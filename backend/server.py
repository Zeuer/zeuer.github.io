from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
import secrets
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# JWT tokens
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# Pydantic models
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str

class LoginInput(BaseModel):
    email: str
    password: str

class ForgotPasswordInput(BaseModel):
    email: str

class ResetPasswordInput(BaseModel):
    token: str
    new_password: str

class CartItemInput(BaseModel):
    product_id: str
    size: str
    quantity: int = 1

class CartUpdateInput(BaseModel):
    quantity: int

class CheckoutInput(BaseModel):
    origin_url: str

class AddressInput(BaseModel):
    street: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = "México"

class ProfileUpdateInput(BaseModel):
    name: Optional[str] = None
    address: Optional[AddressInput] = None

class AnalyticsEventInput(BaseModel):
    event_type: str
    product_id: Optional[str] = None
    metadata: Optional[Dict] = None

class NewsletterInput(BaseModel):
    email: str

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(input.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user_doc = {
        "email": email,
        "password_hash": hash_password(input.password),
        "name": input.name.strip(),
        "role": "customer",
        "address": {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
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
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)

    # Track login event
    await db.analytics_events.insert_one({
        "event_type": "user_login", "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "customer")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(input: ForgotPasswordInput):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token, "user_id": str(user["_id"]),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False
    })
    logging.info(f"Password reset token for {email}: {token}")
    return {"message": "If the email exists, a reset link has been sent.", "reset_token": token}

@api_router.post("/auth/reset-password")
async def reset_password(input: ResetPasswordInput):
    record = await db.password_reset_tokens.find_one({"token": input.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    expires = record["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Token expired")
    if len(input.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    await db.users.update_one(
        {"_id": ObjectId(record["user_id"])},
        {"$set": {"password_hash": hash_password(input.new_password)}}
    )
    await db.password_reset_tokens.update_one({"token": input.token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully"}

@api_router.put("/auth/profile")
async def update_profile(input: ProfileUpdateInput, request: Request):
    user = await get_current_user(request)
    update = {}
    if input.name is not None:
        update["name"] = input.name.strip()
    if input.address is not None:
        update["address"] = input.address.model_dump()
    if update:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return updated

# ============ PRODUCTS ROUTES ============

@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None, size: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q
    if size:
        query["sizes"] = size

    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Track view
    await db.analytics_events.insert_one({
        "event_type": "product_view", "product_id": product_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    await db.products.update_one({"id": product_id}, {"$inc": {"views": 1}})
    return product

# ============ CART ROUTES ============

@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_optional_user(request)
    if not user:
        return {"items": [], "subtotal": 0, "tax": 0, "total": 0}
    cart = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "subtotal": 0, "tax": 0, "total": 0}
    return cart

@api_router.post("/cart/add")
async def add_to_cart(input: CartItemInput, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": input.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if input.size not in product.get("sizes", []):
        raise HTTPException(status_code=400, detail="Invalid size")

    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart:
        cart = {"user_id": user["_id"], "items": [], "subtotal": 0, "tax": 0, "total": 0}
        await db.carts.insert_one(cart)

    items = cart.get("items", [])
    found = False
    for item in items:
        if item["product_id"] == input.product_id and item["size"] == input.size:
            item["quantity"] += input.quantity
            found = True
            break
    if not found:
        items.append({
            "product_id": input.product_id,
            "name": product["name"],
            "price": product["price"],
            "image": product["image"],
            "size": input.size,
            "quantity": input.quantity
        })

    subtotal = sum(i["price"] * i["quantity"] for i in items)
    tax = round(subtotal * 0.16, 2)
    total = round(subtotal + tax, 2)
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$set": {"items": items, "subtotal": subtotal, "tax": tax, "total": total}}
    )

    # Track event
    await db.analytics_events.insert_one({
        "event_type": "add_to_cart", "product_id": input.product_id,
        "user_id": user["_id"], "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {"items": items, "subtotal": subtotal, "tax": tax, "total": total}

@api_router.put("/cart/{product_id}/{size}")
async def update_cart_item(product_id: str, size: str, input: CartUpdateInput, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = cart.get("items", [])
    if input.quantity <= 0:
        items = [i for i in items if not (i["product_id"] == product_id and i["size"] == size)]
    else:
        for item in items:
            if item["product_id"] == product_id and item["size"] == size:
                item["quantity"] = input.quantity
                break

    subtotal = sum(i["price"] * i["quantity"] for i in items)
    tax = round(subtotal * 0.16, 2)
    total = round(subtotal + tax, 2)
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$set": {"items": items, "subtotal": subtotal, "tax": tax, "total": total}}
    )
    return {"items": items, "subtotal": subtotal, "tax": tax, "total": total}

@api_router.delete("/cart/{product_id}/{size}")
async def remove_from_cart(product_id: str, size: str, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = [i for i in cart.get("items", []) if not (i["product_id"] == product_id and i["size"] == size)]
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    tax = round(subtotal * 0.16, 2)
    total = round(subtotal + tax, 2)
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$set": {"items": items, "subtotal": subtotal, "tax": tax, "total": total}}
    )
    return {"items": items, "subtotal": subtotal, "tax": tax, "total": total}

# ============ CHECKOUT / STRIPE ============

@api_router.post("/checkout")
async def create_checkout(input: CheckoutInput, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = cart["total"]
    origin = input.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"

    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    checkout_req = CheckoutSessionRequest(
        amount=float(total),
        currency="mxn",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user["_id"], "user_email": user["email"]}
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)

    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user["_id"],
        "email": user["email"],
        "amount": float(total),
        "currency": "mxn",
        "payment_status": "pending",
        "items": cart["items"],
        "metadata": {"user_id": user["_id"], "user_email": user["email"]},
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    user = await get_current_user(request)

    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # If already processed, return cached status
    if tx.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid"}

    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)

    if status.payment_status == "paid" and tx.get("payment_status") != "paid":
        # Create order
        order_id = str(uuid.uuid4())
        order = {
            "id": order_id,
            "user_id": user["_id"],
            "email": user["email"],
            "items": tx["items"],
            "subtotal": sum(i["price"] * i["quantity"] for i in tx["items"]),
            "tax": round(sum(i["price"] * i["quantity"] for i in tx["items"]) * 0.16, 2),
            "total": tx["amount"],
            "status": "confirmed",
            "payment_session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.orders.insert_one(order)
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "order_id": order_id}}
        )
        # Clear cart
        await db.carts.update_one(
            {"user_id": user["_id"]},
            {"$set": {"items": [], "subtotal": 0, "tax": 0, "total": 0}}
        )
        # Track purchase event
        await db.analytics_events.insert_one({
            "event_type": "purchase", "order_id": order_id,
            "user_id": user["_id"], "amount": tx["amount"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    elif status.payment_status != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": status.payment_status, "status": status.status}}
        )

    return {"status": status.status, "payment_status": status.payment_status}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    try:
        api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        event = await stripe_checkout.handle_webhook(body, sig)
        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": event.session_id})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============ ORDERS ============

@api_router.get("/orders")
async def get_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ============ ANALYTICS ============

@api_router.post("/analytics/event")
async def track_event(input: AnalyticsEventInput, request: Request):
    user = await get_optional_user(request)
    event = {
        "event_type": input.event_type,
        "product_id": input.product_id,
        "metadata": input.metadata or {},
        "user_id": user["_id"] if user else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics_events.insert_one(event)
    return {"status": "ok"}

# ============ NEWSLETTER ============

@api_router.post("/newsletter")
async def subscribe_newsletter(input: NewsletterInput):
    email = input.email.lower().strip()
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        return {"message": "Already subscribed"}
    await db.newsletter.insert_one({"email": email, "subscribed_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Subscribed successfully"}

# ============ ADMIN ROUTES ============

async def require_admin(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    await require_admin(request)
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    total_products = await db.products.count_documents({})

    # Revenue
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = rev[0]["total"] if rev else 0

    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

    # Top products by views
    top_products = await db.products.find({}, {"_id": 0}).sort("views", -1).to_list(5)

    # Orders by date (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    orders_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
        {"$sort": {"_id": 1}}
    ]
    orders_by_date = await db.orders.aggregate(orders_pipeline).to_list(30)

    # Analytics counts
    total_views = await db.analytics_events.count_documents({"event_type": "product_view"})
    total_add_to_cart = await db.analytics_events.count_documents({"event_type": "add_to_cart"})
    total_purchases = await db.analytics_events.count_documents({"event_type": "purchase"})

    conversion_rate = round((total_purchases / total_views * 100), 2) if total_views > 0 else 0
    cart_abandonment = round(((total_add_to_cart - total_purchases) / total_add_to_cart * 100), 2) if total_add_to_cart > 0 else 0

    return {
        "total_orders": total_orders,
        "total_users": total_users,
        "total_products": total_products,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders,
        "top_products": top_products,
        "orders_by_date": orders_by_date,
        "analytics": {
            "total_views": total_views,
            "total_add_to_cart": total_add_to_cart,
            "total_purchases": total_purchases,
            "conversion_rate": conversion_rate,
            "cart_abandonment": cart_abandonment
        }
    }

@api_router.get("/admin/orders")
async def admin_orders(request: Request, status: Optional[str] = None):
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    new_status = body.get("status")
    if new_status not in ["confirmed", "processing", "shipped", "delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": new_status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Status updated"}

@api_router.get("/admin/users")
async def admin_users(request: Request):
    await require_admin(request)
    users = await db.users.find({}, {"password_hash": 0}).to_list(100)
    for u in users:
        u["_id"] = str(u["_id"])
    return users

@api_router.get("/admin/analytics")
async def admin_analytics(request: Request):
    await require_admin(request)
    events = await db.analytics_events.find({}, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return events

@api_router.get("/admin/products")
async def admin_products(request: Request):
    await require_admin(request)
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return products

@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    allowed = ["name", "price", "description", "stock", "sizes", "colors", "category"]
    update = {k: v for k, v in body.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    result = await db.products.update_one({"id": product_id}, {"$set": update})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

# ============ HEALTH / ROOT ============

@api_router.get("/")
async def root():
    return {"message": "Zeuer API v1"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ SEED DATA ============

PRODUCTS = [
    {
        "id": "irapuato-retro",
        "name": "Kit Irapuato '67",
        "price": 449.00,
        "description": "Un clásico de 1967. Revive la historia con esta pieza icónica de streetwear táctico. Tejido premium con acabado retro auténtico.",
        "image": "https://zeuer.github.io/assets/images/jersey.png",
        "images": ["https://zeuer.github.io/assets/images/jersey.png"],
        "category": "Jerseys",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "Rojo Clásico", "hex": "#ff3c3c"}],
        "stock": 25,
        "views": 0,
        "featured": True
    },
    {
        "id": "zeuer-dwnc",
        "name": "Zeuer x DWNC",
        "price": 599.00,
        "description": "Recuerda ser quien quieras ser. Colaboración exclusiva con diseño de vanguardia. Edición limitada.",
        "image": "https://zeuer.github.io/assets/images/dwnc.png",
        "images": ["https://zeuer.github.io/assets/images/dwnc.png"],
        "category": "Collaborations",
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Negro", "hex": "#1a1a1a"}],
        "stock": 15,
        "views": 0,
        "featured": True
    },
    {
        "id": "zeuer-gb",
        "name": "Zeuer GB Concept",
        "price": 649.00,
        "description": "Excelencia académica. Diseño conceptual para el atleta moderno. Corte técnico con materiales de competición.",
        "image": "https://zeuer.github.io/assets/images/zgb.png",
        "images": ["https://zeuer.github.io/assets/images/zgb.png"],
        "category": "Concepts",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "Blanco", "hex": "#ffffff"}],
        "stock": 20,
        "views": 0,
        "featured": True
    },
    {
        "id": "zeuer-stealth",
        "name": "Zeuer Stealth Tee",
        "price": 349.00,
        "description": "Camiseta técnica con corte oversize. Tela respirable de alto rendimiento con logo bordado.",
        "image": "https://zeuer.github.io/assets/images/dwnc.png",
        "images": ["https://zeuer.github.io/assets/images/dwnc.png"],
        "category": "Basics",
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Negro", "hex": "#0a0a0a"}, {"name": "Blanco", "hex": "#f5f5f5"}],
        "stock": 40,
        "views": 0,
        "featured": False
    },
    {
        "id": "zeuer-track-pants",
        "name": "Zeuer Track Pants",
        "price": 549.00,
        "description": "Pantalón deportivo con corte táctico. Banda lateral con logo Zeuer. Tela stretch premium.",
        "image": "https://zeuer.github.io/assets/images/zgb.png",
        "images": ["https://zeuer.github.io/assets/images/zgb.png"],
        "category": "Bottoms",
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Negro", "hex": "#0a0a0a"}],
        "stock": 30,
        "views": 0,
        "featured": False
    },
    {
        "id": "zeuer-cap",
        "name": "Zeuer Logo Cap",
        "price": 299.00,
        "description": "Gorra estructurada con logo Zeuer bordado. Ajuste snapback. Edición limitada.",
        "image": "https://zeuer.github.io/assets/images/jersey.png",
        "images": ["https://zeuer.github.io/assets/images/jersey.png"],
        "category": "Accessories",
        "sizes": ["ONE SIZE"],
        "colors": [{"name": "Negro", "hex": "#0a0a0a"}, {"name": "Rojo", "hex": "#ff3c3c"}],
        "stock": 50,
        "views": 0,
        "featured": False
    }
]

async def seed_products():
    for p in PRODUCTS:
        existing = await db.products.find_one({"id": p["id"]})
        if not existing:
            await db.products.insert_one(p)

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@zeuer.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ZeuerAdmin2026")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Zeuer Admin",
            "role": "admin",
            "address": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=3600)
    await seed_admin()
    await seed_products()
    logger.info("Zeuer API started - Products and admin seeded")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
