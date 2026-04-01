import requests
import sys
from datetime import datetime
import json

class ZeuerAPITester:
    def __init__(self, base_url="https://luxury-storefront-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.test_user = None
        self.test_product_id = "irapuato-retro"

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('/') else f"{self.base_url}{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health endpoint"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success and response.get("message") == "Zeuer API v1"

    def test_products_list(self):
        """Test products list endpoint"""
        success, response = self.run_test(
            "Products List",
            "GET", 
            "products",
            200
        )
        if success:
            products_count = len(response)
            print(f"   Found {products_count} products")
            return products_count == 6  # Expected 6 products
        return False

    def test_single_product(self):
        """Test single product endpoint"""
        success, response = self.run_test(
            "Single Product",
            "GET",
            f"products/{self.test_product_id}",
            200
        )
        if success:
            has_sizes = "sizes" in response and len(response["sizes"]) > 0
            has_colors = "colors" in response and len(response["colors"]) > 0
            has_stock = "stock" in response and response["stock"] > 0
            print(f"   Product: {response.get('name', 'Unknown')}")
            print(f"   Sizes: {response.get('sizes', [])}")
            print(f"   Colors: {len(response.get('colors', []))} colors")
            print(f"   Stock: {response.get('stock', 0)}")
            return has_sizes and has_colors and has_stock
        return False

    def test_auth_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@zeuer.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestUser2026",
                "name": "Test User"
            }
        )
        if success:
            self.test_user = response
            print(f"   Registered user: {response.get('email')}")
            return True
        return False

    def test_auth_login_admin(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "admin@zeuer.com",
                "password": "ZeuerAdmin2026"
            }
        )
        if success:
            self.admin_user = response
            print(f"   Logged in as: {response.get('email')} (role: {response.get('role')})")
            return response.get("role") == "admin"
        return False

    def test_auth_me(self):
        """Test current user endpoint"""
        success, response = self.run_test(
            "Current User Info",
            "GET",
            "auth/me",
            200
        )
        if success:
            print(f"   Current user: {response.get('email')} (role: {response.get('role')})")
            return response.get("email") == "admin@zeuer.com"
        return False

    def test_cart_add(self):
        """Test adding item to cart"""
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "cart/add",
            200,
            data={
                "product_id": self.test_product_id,
                "size": "M",
                "quantity": 1
            }
        )
        if success:
            items = response.get("items", [])
            print(f"   Cart items: {len(items)}")
            print(f"   Total: ${response.get('total', 0)}")
            return len(items) > 0
        return False

    def test_cart_get(self):
        """Test getting cart contents"""
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        if success:
            items = response.get("items", [])
            print(f"   Cart items: {len(items)}")
            print(f"   Total: ${response.get('total', 0)}")
            return True
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200
        )
        if success:
            print(f"   Total orders: {response.get('total_orders', 0)}")
            print(f"   Total users: {response.get('total_users', 0)}")
            print(f"   Total products: {response.get('total_products', 0)}")
            print(f"   Total revenue: ${response.get('total_revenue', 0)}")
            return "total_orders" in response and "total_users" in response
        return False

    def test_admin_orders(self):
        """Test admin orders endpoint"""
        success, response = self.run_test(
            "Admin Orders",
            "GET",
            "admin/orders",
            200
        )
        if success:
            print(f"   Found {len(response)} orders")
            return isinstance(response, list)
        return False

    def test_admin_users(self):
        """Test admin users endpoint"""
        success, response = self.run_test(
            "Admin Users",
            "GET",
            "admin/users",
            200
        )
        if success:
            print(f"   Found {len(response)} users")
            return isinstance(response, list) and len(response) > 0
        return False

    def test_newsletter(self):
        """Test newsletter subscription"""
        test_email = f"newsletter_{datetime.now().strftime('%H%M%S')}@zeuer.com"
        success, response = self.run_test(
            "Newsletter Subscription",
            "POST",
            "newsletter",
            200,
            data={"email": test_email}
        )
        if success:
            print(f"   Subscribed: {test_email}")
            return response.get("message") == "Subscribed successfully"
        return False

def main():
    print("🚀 Starting Zeuer E-commerce API Tests")
    print("=" * 50)
    
    tester = ZeuerAPITester()
    
    # Test sequence
    tests = [
        ("API Health", tester.test_health_check),
        ("Products List (6 products)", tester.test_products_list),
        ("Single Product Details", tester.test_single_product),
        ("User Registration", tester.test_auth_register),
        ("Admin Login", tester.test_auth_login_admin),
        ("Current User Info", tester.test_auth_me),
        ("Add to Cart", tester.test_cart_add),
        ("Get Cart", tester.test_cart_get),
        ("Admin Dashboard", tester.test_admin_dashboard),
        ("Admin Orders", tester.test_admin_orders),
        ("Admin Users", tester.test_admin_users),
        ("Newsletter Subscription", tester.test_newsletter),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n📈 Success rate: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())