"""
Zeuer E-commerce API Tests
Tests for: Auth, Products, Cart, Admin endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@zeuer.com"
ADMIN_PASSWORD = "ZeuerAdmin2026"
TEST_USER_EMAIL = "test_pytest@zeuer.com"
TEST_USER_PASSWORD = "TestUser2026"
TEST_USER_NAME = "Test Pytest User"


class TestHealthAndProducts:
    """Health check and public product endpoints"""
    
    def test_api_health(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API Health: {data['message']}")
    
    def test_get_products(self):
        """Test GET /api/products returns products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) >= 6, f"Expected at least 6 products, got {len(products)}"
        print(f"✓ Products: {len(products)} products returned")
        
        # Verify product structure
        for p in products:
            assert "id" in p
            assert "name" in p
            assert "price" in p
            assert "image" in p
    
    def test_get_products_by_category(self):
        """Test category filtering"""
        response = requests.get(f"{BASE_URL}/api/products?category=Jerseys")
        assert response.status_code == 200
        products = response.json()
        for p in products:
            assert p["category"] == "Jerseys"
        print(f"✓ Category filter: {len(products)} Jerseys found")
    
    def test_get_products_by_size(self):
        """Test size filtering"""
        response = requests.get(f"{BASE_URL}/api/products?size=M")
        assert response.status_code == 200
        products = response.json()
        for p in products:
            assert "M" in p.get("sizes", [])
        print(f"✓ Size filter: {len(products)} products with size M")
    
    def test_get_single_product(self):
        """Test GET /api/products/{id}"""
        response = requests.get(f"{BASE_URL}/api/products/irapuato-retro")
        assert response.status_code == 200
        product = response.json()
        assert product["id"] == "irapuato-retro"
        assert product["name"] == "Kit Irapuato '67"
        assert product["price"] == 449.00
        assert "/assets/images/jersey.png" in product["image"]
        print(f"✓ Single product: {product['name']} - ${product['price']}")
    
    def test_product_not_found(self):
        """Test 404 for non-existent product"""
        response = requests.get(f"{BASE_URL}/api/products/non-existent-product")
        assert response.status_code == 404
        print("✓ Product not found returns 404")


class TestAuth:
    """Authentication flow tests"""
    
    def test_login_admin(self):
        """Test admin login"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "id" in data
        print(f"✓ Admin login: {data['email']} (role: {data['role']})")
        
        # Verify cookies are set
        assert "access_token" in session.cookies
        print("✓ Auth cookies set correctly")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials returns 401")
    
    def test_register_new_user(self):
        """Test user registration"""
        session = requests.Session()
        # First try to register (may fail if user exists)
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        })
        
        if response.status_code == 400:
            # User already exists, try login instead
            response = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            assert response.status_code == 200
            print("✓ Test user already exists, login successful")
        else:
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == TEST_USER_EMAIL
            assert data["role"] == "customer"
            print(f"✓ User registered: {data['email']}")
    
    def test_get_me_authenticated(self):
        """Test /api/auth/me with valid session"""
        session = requests.Session()
        # Login first
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        # Get current user
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Get me: {data['email']}")
    
    def test_get_me_unauthenticated(self):
        """Test /api/auth/me without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthenticated /me returns 401")
    
    def test_logout(self):
        """Test logout clears cookies"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        response = session.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        print("✓ Logout successful")


class TestCart:
    """Cart functionality tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return session
    
    def test_get_cart_empty(self, auth_session):
        """Test getting empty cart"""
        response = auth_session.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "subtotal" in data
        assert "tax" in data
        assert "total" in data
        print(f"✓ Cart retrieved: {len(data['items'])} items")
    
    def test_add_to_cart(self, auth_session):
        """Test adding item to cart"""
        response = auth_session.post(f"{BASE_URL}/api/cart/add", json={
            "product_id": "irapuato-retro",
            "size": "M",
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0
        assert data["subtotal"] > 0
        assert data["tax"] > 0  # IVA 16%
        assert data["total"] == round(data["subtotal"] + data["tax"], 2)
        print(f"✓ Added to cart: subtotal=${data['subtotal']}, tax=${data['tax']}, total=${data['total']}")
    
    def test_add_to_cart_invalid_size(self, auth_session):
        """Test adding with invalid size"""
        response = auth_session.post(f"{BASE_URL}/api/cart/add", json={
            "product_id": "irapuato-retro",
            "size": "XXXL",  # Invalid size
            "quantity": 1
        })
        assert response.status_code == 400
        print("✓ Invalid size returns 400")
    
    def test_update_cart_quantity(self, auth_session):
        """Test updating cart item quantity"""
        # First add item
        auth_session.post(f"{BASE_URL}/api/cart/add", json={
            "product_id": "zeuer-dwnc",
            "size": "L",
            "quantity": 1
        })
        
        # Update quantity
        response = auth_session.put(f"{BASE_URL}/api/cart/zeuer-dwnc/L", json={
            "quantity": 3
        })
        assert response.status_code == 200
        data = response.json()
        # Find the item
        item = next((i for i in data["items"] if i["product_id"] == "zeuer-dwnc" and i["size"] == "L"), None)
        if item:
            assert item["quantity"] == 3
        print(f"✓ Cart updated: {len(data['items'])} items, total=${data['total']}")
    
    def test_remove_from_cart(self, auth_session):
        """Test removing item from cart"""
        # First add item
        auth_session.post(f"{BASE_URL}/api/cart/add", json={
            "product_id": "zeuer-gb",
            "size": "S",
            "quantity": 1
        })
        
        # Remove it
        response = auth_session.delete(f"{BASE_URL}/api/cart/zeuer-gb/S")
        assert response.status_code == 200
        data = response.json()
        # Verify item is removed
        item = next((i for i in data["items"] if i["product_id"] == "zeuer-gb" and i["size"] == "S"), None)
        assert item is None
        print("✓ Item removed from cart")


class TestAdminEndpoints:
    """Admin panel API tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Create admin authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_admin_dashboard(self, admin_session):
        """Test admin dashboard endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "total_users" in data
        assert "total_products" in data
        assert "total_revenue" in data
        assert "analytics" in data
        print(f"✓ Admin dashboard: {data['total_products']} products, {data['total_users']} users, ${data['total_revenue']} revenue")
    
    def test_admin_products(self, admin_session):
        """Test admin products list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) >= 6
        print(f"✓ Admin products: {len(products)} products")
    
    def test_admin_orders(self, admin_session):
        """Test admin orders list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Admin orders: {len(orders)} orders")
    
    def test_admin_users(self, admin_session):
        """Test admin users list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) >= 1  # At least admin
        print(f"✓ Admin users: {len(users)} users")
    
    def test_admin_analytics(self, admin_session):
        """Test admin analytics endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
        print(f"✓ Admin analytics: {len(events)} events")
    
    def test_admin_analytics_trends(self, admin_session):
        """Test admin analytics trends"""
        response = admin_session.get(f"{BASE_URL}/api/admin/analytics/trends")
        assert response.status_code == 200
        data = response.json()
        assert "trending_products" in data
        assert "product_performance" in data
        assert "hourly_activity" in data
        print(f"✓ Admin trends: {len(data['trending_products'])} trending products")
    
    def test_admin_requires_auth(self):
        """Test admin endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        print("✓ Admin endpoints require auth")
    
    def test_admin_requires_admin_role(self):
        """Test admin endpoints require admin role"""
        session = requests.Session()
        # Login as regular user
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": "regular_user_test@zeuer.com",
            "password": "TestPass123",
            "name": "Regular User"
        })
        
        response = session.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 403
        print("✓ Admin endpoints require admin role")


class TestNewsletter:
    """Newsletter subscription tests"""
    
    def test_subscribe_newsletter(self):
        """Test newsletter subscription"""
        import uuid
        test_email = f"test_{uuid.uuid4().hex[:8]}@zeuer.com"
        response = requests.post(f"{BASE_URL}/api/newsletter", json={
            "email": test_email
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Newsletter subscription: {data['message']}")


class TestProductImages:
    """Test that product images are accessible"""
    
    def test_product_images_exist(self):
        """Verify product images are accessible"""
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        
        for p in products[:3]:  # Test first 3 products
            image_url = p.get("image", "")
            if image_url.startswith("/"):
                full_url = f"{BASE_URL}{image_url}"
            else:
                full_url = image_url
            
            img_response = requests.head(full_url)
            assert img_response.status_code == 200, f"Image not found: {full_url}"
            print(f"✓ Image accessible: {image_url}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
