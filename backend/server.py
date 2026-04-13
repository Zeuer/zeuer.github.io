from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, bcrypt, jwt, secrets, io, csv, uuid, json
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode({"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "): token = auth[7:]
    if not token: raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access": raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user: raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError: raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError: raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request):
    try: return await get_current_user(request)
    except HTTPException: return None

async def require_admin(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Pydantic models
class RegisterInput(BaseModel):
    email: str; password: str; name: str

class LoginInput(BaseModel):
    email: str; password: str

class ForgotPasswordInput(BaseModel):
    email: str

class ResetPasswordInput(BaseModel):
    token: str; new_password: str

class CartItemInput(BaseModel):
    product_id: str; size: str; quantity: int = 1

class CartUpdateInput(BaseModel):
    quantity: int

class CheckoutInput(BaseModel):
    origin_url: str

class AddressInput(BaseModel):
    street: str = ""; city: str = ""; state: str = ""; zip_code: str = ""; country: str = "México"

class ProfileUpdateInput(BaseModel):
    name: Optional[str] = None; address: Optional[AddressInput] = None

class AnalyticsEventInput(BaseModel):
    event_type: str; product_id: Optional[str] = None; metadata: Optional[Dict] = None

class NewsletterInput(BaseModel):
    email: str

class ProductCreateInput(BaseModel):
    name: str; price: float; description: str = ""; category: str = ""; sizes: List[str] = []; colors: List[Dict] = []; stock: int = 0; image: str = ""; images: List[str] = []; featured: bool = False; active: bool = True

class ProductUpdateInput(BaseModel):
    name: Optional[str] = None; price: Optional[float] = None; description: Optional[str] = None; category: Optional[str] = None; sizes: Optional[List[str]] = None; colors: Optional[List[Dict]] = None; stock: Optional[int] = None; image: Optional[str] = None; images: Optional[List[str]] = None; featured: Optional[bool] = None; active: Optional[bool] = None

class ContentPostInput(BaseModel):
    platform: str; caption: str; content_type: str = "post"; scheduled_date: Optional[str] = None; status: str = "draft"; tags: List[str] = []

class AIAgentInput(BaseModel):
    message: str; context: Optional[str] = None; session_id: Optional[str] = None

# =============== APP ===============
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ AUTH ============
@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower().strip()
    if await db.users.find_one({"email": email}): raise HTTPException(status_code=400, detail="Email already registered")
    if len(input.password) < 6: raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user_doc = {"email": email, "password_hash": hash_password(input.password), "name": input.name.strip(), "role": "customer", "address": {}, "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    set_auth_cookies(response, create_access_token(user_id, email), create_refresh_token(user_id))
    return {"id": user_id, "email": email, "name": input.name.strip(), "role": "customer"}

@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < datetime.fromisoformat(locked_until):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else: await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one({"identifier": identifier}, {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    set_auth_cookies(response, create_access_token(user_id, email), create_refresh_token(user_id))
    await db.analytics_events.insert_one({"event_type": "user_login", "user_id": user_id, "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "customer")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/"); response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token: raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh": raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user: raise HTTPException(status_code=401, detail="User not found")
        response.set_cookie(key="access_token", value=create_access_token(str(user["_id"]), user["email"]), httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError: raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(input: ForgotPasswordInput):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user: return {"message": "If the email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({"token": token, "user_id": str(user["_id"]), "expires_at": datetime.now(timezone.utc) + timedelta(hours=1), "used": False})
    return {"message": "If the email exists, a reset link has been sent.", "reset_token": token}

@api_router.post("/auth/reset-password")
async def reset_password(input: ResetPasswordInput):
    record = await db.password_reset_tokens.find_one({"token": input.token, "used": False})
    if not record: raise HTTPException(status_code=400, detail="Invalid or expired token")
    expires = record["expires_at"]
    if isinstance(expires, str): expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None: expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires: raise HTTPException(status_code=400, detail="Token expired")
    if len(input.new_password) < 6: raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    await db.users.update_one({"_id": ObjectId(record["user_id"])}, {"$set": {"password_hash": hash_password(input.new_password)}})
    await db.password_reset_tokens.update_one({"token": input.token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully"}

@api_router.put("/auth/profile")
async def update_profile(input: ProfileUpdateInput, request: Request):
    user = await get_current_user(request)
    update = {}
    if input.name is not None: update["name"] = input.name.strip()
    if input.address is not None: update["address"] = input.address.model_dump()
    if update: await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return updated

# ============ PRODUCTS (PUBLIC) ============
@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None, size: Optional[str] = None):
    query = {"active": {"$ne": False}}
    if category: query["category"] = category
    if search: query["$or"] = [{"name": {"$regex": search, "$options": "i"}}, {"description": {"$regex": search, "$options": "i"}}]
    if min_price is not None or max_price is not None:
        pq = {}
        if min_price is not None: pq["$gte"] = min_price
        if max_price is not None: pq["$lte"] = max_price
        query["price"] = pq
    if size: query["sizes"] = size
    return await db.products.find(query, {"_id": 0}).to_list(100)

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    await db.analytics_events.insert_one({"event_type": "product_view", "product_id": product_id, "timestamp": datetime.now(timezone.utc).isoformat()})
    await db.products.update_one({"id": product_id}, {"$inc": {"views": 1}})
    return product

# ============ CART ============
@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_optional_user(request)
    if not user: return {"items": [], "subtotal": 0, "tax": 0, "total": 0}
    cart = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    return cart or {"items": [], "subtotal": 0, "tax": 0, "total": 0}

@api_router.post("/cart/add")
async def add_to_cart(input: CartItemInput, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": input.product_id}, {"_id": 0})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    if input.size not in product.get("sizes", []): raise HTTPException(status_code=400, detail="Invalid size")
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart:
        cart = {"user_id": user["_id"], "items": [], "subtotal": 0, "tax": 0, "total": 0}
        await db.carts.insert_one(cart)
    items = cart.get("items", [])
    found = False
    for item in items:
        if item["product_id"] == input.product_id and item["size"] == input.size:
            item["quantity"] += input.quantity; found = True; break
    if not found:
        items.append({"product_id": input.product_id, "name": product["name"], "price": product["price"], "image": product["image"], "size": input.size, "quantity": input.quantity})
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    tax = round(subtotal * 0.16, 2); total = round(subtotal + tax, 2)
    await db.carts.update_one({"user_id": user["_id"]}, {"$set": {"items": items, "subtotal": subtotal, "tax": tax, "total": total}})
    await db.analytics_events.insert_one({"event_type": "add_to_cart", "product_id": input.product_id, "user_id": user["_id"], "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"items": items, "subtotal": subtotal, "tax": tax, "total": total}

@api_router.put("/cart/{product_id}/{size}")
async def update_cart_item(product_id: str, size: str, input: CartUpdateInput, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart: raise HTTPException(status_code=404, detail="Cart not found")
    items = cart.get("items", [])
    if input.quantity <= 0: items = [i for i in items if not (i["product_id"] == product_id and i["size"] == size)]
    else:
        for item in items:
            if item["product_id"] == product_id and item["size"] == size: item["quantity"] = input.quantity; break
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    tax = round(subtotal * 0.16, 2); total = round(subtotal + tax, 2)
    await db.carts.update_one({"user_id": user["_id"]}, {"$set": {"items": items, "subtotal": subtotal, "tax": tax, "total": total}})
    return {"items": items, "subtotal": subtotal, "tax": tax, "total": total}

@api_router.delete("/cart/{product_id}/{size}")
async def remove_from_cart(product_id: str, size: str, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart: raise HTTPException(status_code=404, detail="Cart not found")
    items = [i for i in cart.get("items", []) if not (i["product_id"] == product_id and i["size"] == size)]
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    tax = round(subtotal * 0.16, 2); total = round(subtotal + tax, 2)
    await db.carts.update_one({"user_id": user["_id"]}, {"$set": {"items": items, "subtotal": subtotal, "tax": tax, "total": total}})
    return {"items": items, "subtotal": subtotal, "tax": tax, "total": total}

# ============ CHECKOUT / STRIPE ============
@api_router.post("/checkout")
async def create_checkout(input: CheckoutInput, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart or not cart.get("items"): raise HTTPException(status_code=400, detail="Cart is empty")
    total = cart["total"]; origin = input.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{host_url}/api/webhook/stripe")
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(amount=float(total), currency="mxn", success_url=success_url, cancel_url=cancel_url, metadata={"user_id": user["_id"], "user_email": user["email"]}))
    await db.payment_transactions.insert_one({"session_id": session.session_id, "user_id": user["_id"], "email": user["email"], "amount": float(total), "currency": "mxn", "payment_status": "pending", "items": cart["items"], "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    user = await get_current_user(request)
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx: raise HTTPException(status_code=404, detail="Transaction not found")
    if tx.get("payment_status") == "paid": return {"status": "complete", "payment_status": "paid"}
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{host_url}/api/webhook/stripe")
    status = await stripe_checkout.get_checkout_status(session_id)
    if status.payment_status == "paid" and tx.get("payment_status") != "paid":
        order_id = str(uuid.uuid4())
        order = {"id": order_id, "user_id": user["_id"], "email": user["email"], "items": tx["items"], "subtotal": sum(i["price"]*i["quantity"] for i in tx["items"]), "tax": round(sum(i["price"]*i["quantity"] for i in tx["items"])*0.16, 2), "total": tx["amount"], "status": "confirmed", "payment_session_id": session_id, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.orders.insert_one(order)
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": "paid", "order_id": order_id}})
        await db.carts.update_one({"user_id": user["_id"]}, {"$set": {"items": [], "subtotal": 0, "tax": 0, "total": 0}})
        await db.analytics_events.insert_one({"event_type": "purchase", "order_id": order_id, "user_id": user["_id"], "amount": tx["amount"], "timestamp": datetime.now(timezone.utc).isoformat()})
    elif status.payment_status != "paid":
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": status.payment_status, "status": status.status}})
    return {"status": status.status, "payment_status": status.payment_status}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body(); sig = request.headers.get("Stripe-Signature")
    try:
        api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip("/")
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{host_url}/api/webhook/stripe")
        event = await stripe_checkout.handle_webhook(body, sig)
        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": event.session_id})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one({"session_id": event.session_id}, {"$set": {"payment_status": "paid"}})
        return {"status": "ok"}
    except Exception as e: logging.error(f"Webhook error: {e}"); return {"status": "error"}

# ============ ORDERS (USER) ============
@api_router.get("/orders")
async def get_orders(request: Request):
    user = await get_current_user(request)
    return await db.orders.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["_id"]}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    return order

# ============ ANALYTICS ============
@api_router.post("/analytics/event")
async def track_event(input: AnalyticsEventInput, request: Request):
    user = await get_optional_user(request)
    await db.analytics_events.insert_one({"event_type": input.event_type, "product_id": input.product_id, "metadata": input.metadata or {}, "user_id": user["_id"] if user else None, "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"status": "ok"}

@api_router.post("/newsletter")
async def subscribe_newsletter(input: NewsletterInput):
    email = input.email.lower().strip()
    if await db.newsletter.find_one({"email": email}): return {"message": "Already subscribed"}
    await db.newsletter.insert_one({"email": email, "subscribed_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Subscribed successfully"}

# ====================================================================
# ==================== ADMIN PANEL ENDPOINTS ==========================
# ====================================================================

# ============ ADMIN DASHBOARD ============
@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    await require_admin(request)
    total_orders = await db.orders.count_documents({}); total_users = await db.users.count_documents({}); total_products = await db.products.count_documents({})
    rev = await db.orders.aggregate([{"$group": {"_id": None, "total": {"$sum": "$total"}}}]).to_list(1)
    total_revenue = rev[0]["total"] if rev else 0
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)
    top_products = await db.products.find({}, {"_id": 0}).sort("views", -1).to_list(5)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    orders_by_date = await db.orders.aggregate([{"$match": {"created_at": {"$gte": thirty_days_ago}}}, {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}, "revenue": {"$sum": "$total"}}}, {"$sort": {"_id": 1}}]).to_list(30)
    total_views = await db.analytics_events.count_documents({"event_type": "product_view"})
    total_atc = await db.analytics_events.count_documents({"event_type": "add_to_cart"})
    total_purchases = await db.analytics_events.count_documents({"event_type": "purchase"})
    conversion = round((total_purchases / total_views * 100), 2) if total_views > 0 else 0
    abandonment = round(((total_atc - total_purchases) / total_atc * 100), 2) if total_atc > 0 else 0
    # New user growth
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    new_users_week = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    # Average order value
    avg_pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$total"}}}]
    avg_res = await db.orders.aggregate(avg_pipeline).to_list(1)
    avg_order_value = round(avg_res[0]["avg"], 2) if avg_res else 0
    return {"total_orders": total_orders, "total_users": total_users, "total_products": total_products, "total_revenue": total_revenue, "recent_orders": recent_orders, "top_products": top_products, "orders_by_date": orders_by_date, "new_users_week": new_users_week, "avg_order_value": avg_order_value, "analytics": {"total_views": total_views, "total_add_to_cart": total_atc, "total_purchases": total_purchases, "conversion_rate": conversion, "cart_abandonment": abandonment}}

# ============ ADMIN PRODUCTS (FULL CRUD) ============
@api_router.get("/admin/products")
async def admin_products(request: Request):
    await require_admin(request)
    return await db.products.find({}, {"_id": 0}).to_list(200)

@api_router.post("/admin/products")
async def admin_create_product(input: ProductCreateInput, request: Request):
    await require_admin(request)
    pid = input.name.lower().replace(" ", "-").replace("'", "")
    pid = ''.join(c for c in pid if c.isalnum() or c == '-')
    existing = await db.products.find_one({"id": pid})
    if existing: pid = f"{pid}-{secrets.token_hex(3)}"
    product = {"id": pid, "name": input.name, "price": input.price, "description": input.description, "category": input.category, "sizes": input.sizes, "colors": input.colors, "stock": input.stock, "image": input.image or "/assets/images/jersey.png", "images": input.images or [input.image or "/assets/images/jersey.png"], "featured": input.featured, "active": input.active, "views": 0, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.products.insert_one(product)
    product.pop("_id", None)
    return product

@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    allowed = ["name", "price", "description", "stock", "sizes", "colors", "category", "image", "images", "featured", "active"]
    update = {k: v for k, v in body.items() if k in allowed}
    if not update: raise HTTPException(status_code=400, detail="No valid fields")
    result = await db.products.update_one({"id": product_id}, {"$set": update})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, request: Request):
    await require_admin(request)
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.put("/admin/products/{product_id}/toggle")
async def admin_toggle_product(product_id: str, request: Request):
    await require_admin(request)
    product = await db.products.find_one({"id": product_id})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    new_active = not product.get("active", True)
    await db.products.update_one({"id": product_id}, {"$set": {"active": new_active}})
    return {"active": new_active}

# ============ ADMIN ORDERS ============
@api_router.get("/admin/orders")
async def admin_orders(request: Request, status: Optional[str] = None):
    await require_admin(request)
    query = {}
    if status: query["status"] = status
    return await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    new_status = body.get("status")
    if new_status not in ["confirmed", "processing", "shipped", "delivered", "cancelled"]: raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.modified_count == 0: raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Status updated"}

@api_router.get("/admin/orders/export")
async def admin_export_orders(request: Request):
    await require_admin(request)
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Order ID", "Email", "Items", "Subtotal", "Tax", "Total", "Status", "Date"])
    for o in orders:
        items_str = "; ".join([f"{i['name']} ({i['size']}) x{i['quantity']}" for i in o.get("items", [])])
        writer.writerow([o.get("id", ""), o.get("email", ""), items_str, o.get("subtotal", 0), o.get("tax", 0), o.get("total", 0), o.get("status", ""), o.get("created_at", "")])
    output.seek(0)
    return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=zeuer_orders.csv"})

# ============ ADMIN USERS ============
@api_router.get("/admin/users")
async def admin_users(request: Request):
    await require_admin(request)
    users = await db.users.find({}, {"password_hash": 0}).to_list(200)
    for u in users: u["_id"] = str(u["_id"])
    return users

# ============ ADMIN ANALYTICS ============
@api_router.get("/admin/analytics")
async def admin_analytics(request: Request):
    await require_admin(request)
    return await db.analytics_events.find({}, {"_id": 0}).sort("timestamp", -1).to_list(500)

@api_router.get("/admin/analytics/trends")
async def admin_trends(request: Request):
    await require_admin(request)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    fourteen_days_ago = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    # Views this week vs last week per product
    this_week = await db.analytics_events.aggregate([{"$match": {"event_type": "product_view", "timestamp": {"$gte": seven_days_ago}}}, {"$group": {"_id": "$product_id", "count": {"$sum": 1}}}]).to_list(50)
    last_week = await db.analytics_events.aggregate([{"$match": {"event_type": "product_view", "timestamp": {"$gte": fourteen_days_ago, "$lt": seven_days_ago}}}, {"$group": {"_id": "$product_id", "count": {"$sum": 1}}}]).to_list(50)
    lw_map = {x["_id"]: x["count"] for x in last_week}
    trending = []
    for item in this_week:
        pid = item["_id"]; tw = item["count"]; lwc = lw_map.get(pid, 0)
        growth = round(((tw - lwc) / max(lwc, 1)) * 100, 1)
        product = await db.products.find_one({"id": pid}, {"_id": 0, "name": 1, "price": 1, "image": 1, "category": 1})
        if product: trending.append({**product, "product_id": pid, "views_this_week": tw, "views_last_week": lwc, "growth": growth})
    trending.sort(key=lambda x: x["growth"], reverse=True)
    # Category performance
    cat_pipeline = [{"$group": {"_id": "$category", "total_revenue": {"$sum": "$total"}, "order_count": {"$sum": 1}}}, {"$sort": {"total_revenue": -1}}]
    # This uses orders which have items, need to unwind
    cat_perf = await db.orders.aggregate([{"$unwind": "$items"}, {"$group": {"_id": "$items.name", "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}, "units_sold": {"$sum": "$items.quantity"}}}, {"$sort": {"revenue": -1}}]).to_list(20)
    # Hourly activity
    hourly = await db.analytics_events.aggregate([{"$match": {"timestamp": {"$gte": seven_days_ago}}}, {"$group": {"_id": {"$substr": ["$timestamp", 11, 2]}, "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}]).to_list(24)
    return {"trending_products": trending[:10], "product_performance": cat_perf, "hourly_activity": hourly}

# ============ CONTENT PANEL ============
@api_router.get("/admin/content")
async def get_content(request: Request):
    await require_admin(request)
    return await db.content_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/admin/content")
async def create_content(input: ContentPostInput, request: Request):
    await require_admin(request)
    post = {"id": str(uuid.uuid4()), "platform": input.platform, "caption": input.caption, "content_type": input.content_type, "scheduled_date": input.scheduled_date, "status": input.status, "tags": input.tags, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.content_posts.insert_one(post)
    post.pop("_id", None)
    return post

@api_router.put("/admin/content/{post_id}")
async def update_content(post_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    allowed = ["caption", "platform", "content_type", "scheduled_date", "status", "tags"]
    update = {k: v for k, v in body.items() if k in allowed}
    await db.content_posts.update_one({"id": post_id}, {"$set": update})
    return {"message": "Updated"}

@api_router.delete("/admin/content/{post_id}")
async def delete_content(post_id: str, request: Request):
    await require_admin(request)
    await db.content_posts.delete_one({"id": post_id})
    return {"message": "Deleted"}

# ============ AI AGENT ============
@api_router.post("/admin/ai/chat")
async def ai_chat(input: AIAgentInput, request: Request):
    await require_admin(request)
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key: raise HTTPException(status_code=500, detail="AI not configured")

    # Gather business context
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    rev = await db.orders.aggregate([{"$group": {"_id": None, "total": {"$sum": "$total"}}}]).to_list(1)
    total_revenue = rev[0]["total"] if rev else 0
    top_prods = await db.products.find({}, {"_id": 0, "name": 1, "price": 1, "stock": 1, "views": 1, "category": 1}).sort("views", -1).to_list(6)
    recent_orders = await db.orders.find({}, {"_id": 0, "total": 1, "status": 1, "created_at": 1, "items": 1}).sort("created_at", -1).to_list(5)
    low_stock = await db.products.find({"stock": {"$lte": 5}}, {"_id": 0, "name": 1, "stock": 1}).to_list(10)

    biz_context = f"""
ZEUER BUSINESS DATA:
- Total Products: {total_products}
- Total Orders: {total_orders}
- Total Revenue: ${total_revenue:,.2f} MXN
- Top Products (by views): {json.dumps(top_prods, default=str)}
- Recent Orders: {json.dumps(recent_orders, default=str)}
- Low Stock Products: {json.dumps(low_stock, default=str)}
"""

    system_msg = f"""You are ZEUER AI, an intelligent business assistant for the Zeuer streetwear brand's admin panel. You help the admin manage their e-commerce store.

Brand: Zeuer — a Mexican streetwear/sportswear brand. Tagline: "Técnico. Táctico. Lógico."
Brand personality: modern, premium, bold, minimal. Colors: Electric Blue (#0A6CFF), Deep Black (#0A0A0A).

{biz_context}

Your capabilities:
1. PRODUCT CREATION: Generate product ideas, names, descriptions optimized for conversion. Consider streetwear trends.
2. ANALYTICS: Explain business metrics in simple language. Give actionable recommendations.
3. MARKETING: Generate Instagram/TikTok captions, marketing strategies for streetwear audience.
4. OPERATIONS: Identify issues (low stock, pricing, missing data). Suggest improvements.
5. STRATEGY: Provide business growth recommendations based on data.

Always respond in a concise, professional tone. Use Spanish when appropriate for the Mexican market. Format with markdown for readability."""

    session_id = input.session_id or str(uuid.uuid4())
    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system_msg)
    chat.with_model("openai", "gpt-4.1")

    # Load chat history from DB
    history = await db.ai_chat_history.find({"session_id": session_id}).sort("timestamp", 1).to_list(50)
    for h in history:
        if h["role"] == "user":
            chat.messages.append({"role": "user", "content": h["content"]})
        else:
            chat.messages.append({"role": "assistant", "content": h["content"]})

    user_msg = UserMessage(text=input.message)
    response = await chat.send_message(user_msg)

    # Save to DB
    now = datetime.now(timezone.utc).isoformat()
    await db.ai_chat_history.insert_one({"session_id": session_id, "role": "user", "content": input.message, "timestamp": now})
    await db.ai_chat_history.insert_one({"session_id": session_id, "role": "assistant", "content": response, "timestamp": now})

    return {"response": response, "session_id": session_id}

@api_router.get("/admin/ai/history")
async def ai_history(request: Request, session_id: Optional[str] = None):
    await require_admin(request)
    query = {}
    if session_id: query["session_id"] = session_id
    history = await db.ai_chat_history.find(query, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return history

@api_router.get("/admin/ai/sessions")
async def ai_sessions(request: Request):
    await require_admin(request)
    sessions = await db.ai_chat_history.aggregate([{"$group": {"_id": "$session_id", "last_message": {"$last": "$content"}, "last_timestamp": {"$last": "$timestamp"}, "count": {"$sum": 1}}}, {"$sort": {"last_timestamp": -1}}]).to_list(20)
    return sessions

# ============ HEALTH ============
@api_router.get("/")
async def root():
    return {"message": "Zeuer API v2"}

app.include_router(api_router)

# CORS: support multiple origins for Render/Vercel/local
cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
cors_origins.append(os.environ.get("FRONTEND_URL", "http://localhost:3000"))
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ SEED ============
PRODUCTS = [
    {"id": "irapuato-retro", "name": "Kit Irapuato '67", "price": 449.00, "description": "Un clásico de 1967. Revive la historia con esta pieza icónica de streetwear táctico. Tejido premium con acabado retro auténtico.", "image": "/assets/images/jersey.png", "images": ["/assets/images/jersey.png"], "category": "Jerseys", "sizes": ["S", "M", "L", "XL", "XXL"], "colors": [{"name": "Rojo Clásico", "hex": "#ff3c3c"}], "stock": 25, "views": 0, "featured": True, "active": True},
    {"id": "zeuer-dwnc", "name": "Zeuer x DWNC", "price": 599.00, "description": "Recuerda ser quien quieras ser. Colaboración exclusiva con diseño de vanguardia. Edición limitada.", "image": "/assets/images/dwnc.png", "images": ["/assets/images/dwnc.png"], "category": "Collaborations", "sizes": ["S", "M", "L", "XL"], "colors": [{"name": "Negro", "hex": "#1a1a1a"}], "stock": 15, "views": 0, "featured": True, "active": True},
    {"id": "zeuer-gb", "name": "Zeuer GB Concept", "price": 649.00, "description": "Excelencia académica. Diseño conceptual para el atleta moderno. Corte técnico con materiales de competición.", "image": "/assets/images/zgb.png", "images": ["/assets/images/zgb.png"], "category": "Concepts", "sizes": ["S", "M", "L", "XL", "XXL"], "colors": [{"name": "Blanco", "hex": "#ffffff"}], "stock": 20, "views": 0, "featured": True, "active": True},
    {"id": "zeuer-stealth", "name": "Zeuer Stealth Tee", "price": 349.00, "description": "Camiseta técnica con corte oversize. Tela respirable de alto rendimiento con logo bordado.", "image": "/assets/images/dwnc.png", "images": ["/assets/images/dwnc.png"], "category": "Basics", "sizes": ["S", "M", "L", "XL"], "colors": [{"name": "Negro", "hex": "#0a0a0a"}, {"name": "Blanco", "hex": "#f5f5f5"}], "stock": 40, "views": 0, "featured": False, "active": True},
    {"id": "zeuer-track-pants", "name": "Zeuer Track Pants", "price": 549.00, "description": "Pantalón deportivo con corte táctico. Banda lateral con logo Zeuer. Tela stretch premium.", "image": "/assets/images/zgb.png", "images": ["/assets/images/zgb.png"], "category": "Bottoms", "sizes": ["S", "M", "L", "XL"], "colors": [{"name": "Negro", "hex": "#0a0a0a"}], "stock": 30, "views": 0, "featured": False, "active": True},
    {"id": "zeuer-cap", "name": "Zeuer Logo Cap", "price": 299.00, "description": "Gorra estructurada con logo Zeuer bordado. Ajuste snapback. Edición limitada.", "image": "/assets/images/jersey.png", "images": ["/assets/images/jersey.png"], "category": "Accessories", "sizes": ["ONE SIZE"], "colors": [{"name": "Negro", "hex": "#0a0a0a"}, {"name": "Rojo", "hex": "#ff3c3c"}], "stock": 50, "views": 0, "featured": False, "active": True}
]

async def seed_products():
    for p in PRODUCTS:
        existing = await db.products.find_one({"id": p["id"]})
        if not existing:
            await db.products.insert_one(p)
        elif existing.get("image", "").startswith("https://zeuer.github.io"):
            await db.products.update_one({"id": p["id"]}, {"$set": {"image": p["image"], "images": p["images"]}})

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@zeuer.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ZeuerAdmin2026")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Zeuer Admin", "role": "admin", "address": {}, "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=3600)
    await db.ai_chat_history.create_index([("session_id", 1), ("timestamp", 1)])
    await seed_admin(); await seed_products()
    logger.info("Zeuer API v2 started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
