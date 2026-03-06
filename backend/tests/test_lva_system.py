"""
LVA (Lehrveranstaltungen) System Tests
Tests for LVA listing, rating, verification code, and admin CRUD operations
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://db-image-loader.preview.emergentagent.com')

# Test credentials
ADMIN_USERNAME = "masteradmin"
ADMIN_PASSWORD = "oehwirtschaft"

# Test data
VALID_EMAIL = "test@students.jku.at"
INVALID_EMAIL = "test@gmail.com"
TEST_LVA_NAME = "TEST_LVA_Pytest_Course"


class TestLVAPublicEndpoints:
    """Public LVA endpoints tests (no auth required)"""
    
    def test_get_lvas_list(self):
        """GET /api/lvas - Get list of active LVAs"""
        response = requests.get(f"{BASE_URL}/api/lvas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/lvas - Found {len(data)} LVAs")
        
    def test_get_lvas_with_search(self):
        """GET /api/lvas?search=... - Search LVAs by name"""
        response = requests.get(f"{BASE_URL}/api/lvas?search=Buchhaltung")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # If there are results, they should contain the search term
        for lva in data:
            assert "buchhaltung" in lva["name"].lower(), f"Search result should contain 'Buchhaltung': {lva['name']}"
        print(f"✓ GET /api/lvas?search=Buchhaltung - Found {len(data)} matching LVAs")
        
    def test_get_lvas_response_structure(self):
        """Verify LVA response structure includes rating fields"""
        response = requests.get(f"{BASE_URL}/api/lvas")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            lva = data[0]
            # Check required fields
            required_fields = ["id", "name", "is_active", "rating_count"]
            for field in required_fields:
                assert field in lva, f"Missing field: {field}"
            
            # Check rating fields (may be null if no ratings)
            rating_fields = ["avg_effort", "avg_difficulty", "avg_total", 
                           "effort_text", "effort_color", "difficulty_text", 
                           "difficulty_color", "total_text", "total_color"]
            for field in rating_fields:
                assert field in lva, f"Missing rating field: {field}"
            print(f"✓ LVA response structure verified with all required fields")
        else:
            print("⚠ No LVAs found to verify structure")


class TestLVAVerificationFlow:
    """Tests for email verification and rating submission flow"""
    
    def test_request_code_valid_email(self):
        """POST /api/lva/request-code - Valid @students.jku.at email"""
        # First get an LVA ID
        lvas_response = requests.get(f"{BASE_URL}/api/lvas")
        if lvas_response.status_code != 200 or len(lvas_response.json()) == 0:
            pytest.skip("No LVAs available for testing")
        
        lva_id = lvas_response.json()[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/lva/request-code", json={
            "email": VALID_EMAIL,
            "lva_id": lva_id
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "success" in data or "message" in data, "Response should contain success or message"
        print(f"✓ POST /api/lva/request-code - Code requested for valid email")
        
    def test_request_code_invalid_email(self):
        """POST /api/lva/request-code - Invalid email domain should be rejected"""
        # First get an LVA ID
        lvas_response = requests.get(f"{BASE_URL}/api/lvas")
        if lvas_response.status_code != 200 or len(lvas_response.json()) == 0:
            pytest.skip("No LVAs available for testing")
        
        lva_id = lvas_response.json()[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/lva/request-code", json={
            "email": INVALID_EMAIL,
            "lva_id": lva_id
        })
        
        # Should return 400 or 403 for invalid email domain
        assert response.status_code in [400, 403], f"Expected 400/403 for invalid email, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
        print(f"✓ POST /api/lva/request-code - Invalid email correctly rejected: {data['detail']}")
        
    def test_request_code_nonexistent_lva(self):
        """POST /api/lva/request-code - Non-existent LVA should return 404"""
        response = requests.post(f"{BASE_URL}/api/lva/request-code", json={
            "email": VALID_EMAIL,
            "lva_id": 99999
        })
        
        assert response.status_code == 404, f"Expected 404 for non-existent LVA, got {response.status_code}"
        print(f"✓ POST /api/lva/request-code - Non-existent LVA correctly returns 404")
        
    def test_verify_code_invalid(self):
        """POST /api/lva/verify-code - Invalid code should be rejected"""
        # First get an LVA ID
        lvas_response = requests.get(f"{BASE_URL}/api/lvas")
        if lvas_response.status_code != 200 or len(lvas_response.json()) == 0:
            pytest.skip("No LVAs available for testing")
        
        lva_id = lvas_response.json()[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/lva/verify-code", json={
            "email": VALID_EMAIL,
            "code": "00000",  # Invalid code
            "lva_id": lva_id
        })
        
        # Should return 400 for invalid code
        assert response.status_code == 400, f"Expected 400 for invalid code, got {response.status_code}"
        print(f"✓ POST /api/lva/verify-code - Invalid code correctly rejected")
        
    def test_submit_rating_invalid_code(self):
        """POST /api/lva/submit-rating - Invalid code should be rejected"""
        # First get an LVA ID
        lvas_response = requests.get(f"{BASE_URL}/api/lvas")
        if lvas_response.status_code != 200 or len(lvas_response.json()) == 0:
            pytest.skip("No LVAs available for testing")
        
        lva_id = lvas_response.json()[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/lva/submit-rating", json={
            "email": VALID_EMAIL,
            "code": "00000",  # Invalid code
            "lva_id": lva_id,
            "effort_rating": 3,
            "difficulty_rating": 3
        })
        
        # Should return 400 for invalid code
        assert response.status_code == 400, f"Expected 400 for invalid code, got {response.status_code}"
        print(f"✓ POST /api/lva/submit-rating - Invalid code correctly rejected")
        
    def test_submit_rating_invalid_values(self):
        """POST /api/lva/submit-rating - Invalid rating values should be rejected"""
        # First get an LVA ID
        lvas_response = requests.get(f"{BASE_URL}/api/lvas")
        if lvas_response.status_code != 200 or len(lvas_response.json()) == 0:
            pytest.skip("No LVAs available for testing")
        
        lva_id = lvas_response.json()[0]["id"]
        
        # Test with rating out of range (6 is invalid)
        response = requests.post(f"{BASE_URL}/api/lva/submit-rating", json={
            "email": VALID_EMAIL,
            "code": "12345",
            "lva_id": lva_id,
            "effort_rating": 6,  # Invalid - should be 1-5
            "difficulty_rating": 3
        })
        
        # Should return 400 for invalid rating values
        assert response.status_code == 400, f"Expected 400 for invalid rating, got {response.status_code}"
        print(f"✓ POST /api/lva/submit-rating - Invalid rating values correctly rejected")


class TestLVAAdminEndpoints:
    """Admin LVA CRUD endpoints tests (auth required)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
    def test_admin_get_lvas(self):
        """GET /api/admin/lvas - Get all LVAs (including inactive)"""
        response = requests.get(f"{BASE_URL}/api/admin/lvas", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/admin/lvas - Found {len(data)} LVAs (admin view)")
        
    def test_admin_create_lva(self):
        """POST /api/admin/lvas - Create a new LVA"""
        response = requests.post(f"{BASE_URL}/api/admin/lvas", headers=self.headers, json={
            "name": TEST_LVA_NAME,
            "description": "Test LVA created by pytest",
            "is_active": True
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain LVA id"
        self.created_lva_id = data["id"]
        print(f"✓ POST /api/admin/lvas - Created LVA with id {data['id']}")
        
        # Cleanup - delete the created LVA
        delete_response = requests.delete(f"{BASE_URL}/api/admin/lvas/{data['id']}", headers=self.headers)
        assert delete_response.status_code == 200, f"Cleanup failed: {delete_response.text}"
        
    def test_admin_create_duplicate_lva(self):
        """POST /api/admin/lvas - Duplicate name should be rejected"""
        # First create an LVA
        create_response = requests.post(f"{BASE_URL}/api/admin/lvas", headers=self.headers, json={
            "name": TEST_LVA_NAME + "_duplicate_test",
            "description": "Test",
            "is_active": True
        })
        
        if create_response.status_code == 200:
            lva_id = create_response.json()["id"]
            
            # Try to create another with same name
            duplicate_response = requests.post(f"{BASE_URL}/api/admin/lvas", headers=self.headers, json={
                "name": TEST_LVA_NAME + "_duplicate_test",
                "description": "Duplicate",
                "is_active": True
            })
            
            assert duplicate_response.status_code == 400, f"Expected 400 for duplicate, got {duplicate_response.status_code}"
            print(f"✓ POST /api/admin/lvas - Duplicate name correctly rejected")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/admin/lvas/{lva_id}", headers=self.headers)
        else:
            pytest.skip("Could not create initial LVA for duplicate test")
            
    def test_admin_update_lva(self):
        """PUT /api/admin/lvas/{id} - Update an LVA"""
        # First create an LVA
        create_response = requests.post(f"{BASE_URL}/api/admin/lvas", headers=self.headers, json={
            "name": TEST_LVA_NAME + "_update_test",
            "description": "Original description",
            "is_active": True
        })
        
        if create_response.status_code == 200:
            lva_id = create_response.json()["id"]
            
            # Update the LVA
            update_response = requests.put(f"{BASE_URL}/api/admin/lvas/{lva_id}", headers=self.headers, json={
                "description": "Updated description",
                "is_active": False
            })
            
            assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
            print(f"✓ PUT /api/admin/lvas/{lva_id} - LVA updated successfully")
            
            # Verify update
            get_response = requests.get(f"{BASE_URL}/api/admin/lvas", headers=self.headers)
            lvas = get_response.json()
            updated_lva = next((l for l in lvas if l["id"] == lva_id), None)
            assert updated_lva is not None, "Updated LVA not found"
            assert updated_lva["description"] == "Updated description", "Description not updated"
            assert updated_lva["is_active"] == False, "is_active not updated"
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/admin/lvas/{lva_id}", headers=self.headers)
        else:
            pytest.skip("Could not create LVA for update test")
            
    def test_admin_delete_lva(self):
        """DELETE /api/admin/lvas/{id} - Delete an LVA"""
        # First create an LVA
        create_response = requests.post(f"{BASE_URL}/api/admin/lvas", headers=self.headers, json={
            "name": TEST_LVA_NAME + "_delete_test",
            "description": "To be deleted",
            "is_active": True
        })
        
        if create_response.status_code == 200:
            lva_id = create_response.json()["id"]
            
            # Delete the LVA
            delete_response = requests.delete(f"{BASE_URL}/api/admin/lvas/{lva_id}", headers=self.headers)
            assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
            print(f"✓ DELETE /api/admin/lvas/{lva_id} - LVA deleted successfully")
            
            # Verify deletion
            get_response = requests.get(f"{BASE_URL}/api/admin/lvas", headers=self.headers)
            lvas = get_response.json()
            deleted_lva = next((l for l in lvas if l["id"] == lva_id), None)
            assert deleted_lva is None, "LVA should be deleted"
        else:
            pytest.skip("Could not create LVA for delete test")
            
    def test_admin_delete_nonexistent_lva(self):
        """DELETE /api/admin/lvas/{id} - Non-existent LVA should return 404"""
        response = requests.delete(f"{BASE_URL}/api/admin/lvas/99999", headers=self.headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE /api/admin/lvas/99999 - Non-existent LVA correctly returns 404")
        
    def test_admin_import_lvas(self):
        """POST /api/admin/lvas/import - Import LVAs from predefined list"""
        response = requests.post(f"{BASE_URL}/api/admin/lvas/import", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "imported" in data, "Response should contain 'imported' count"
        assert "skipped" in data, "Response should contain 'skipped' count"
        print(f"✓ POST /api/admin/lvas/import - Imported {data['imported']}, skipped {data['skipped']}")


class TestLVAGetSingle:
    """Tests for getting a single LVA"""
    
    def test_get_single_lva(self):
        """GET /api/lvas/{id} - Get a single LVA with ratings"""
        # First get list to find an ID
        lvas_response = requests.get(f"{BASE_URL}/api/lvas")
        if lvas_response.status_code != 200 or len(lvas_response.json()) == 0:
            pytest.skip("No LVAs available for testing")
        
        lva_id = lvas_response.json()[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/lvas/{lva_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == lva_id, "ID should match"
        assert "name" in data, "Response should contain name"
        assert "rating_count" in data, "Response should contain rating_count"
        print(f"✓ GET /api/lvas/{lva_id} - Retrieved LVA: {data['name']}")
        
    def test_get_nonexistent_lva(self):
        """GET /api/lvas/{id} - Non-existent LVA should return 404"""
        response = requests.get(f"{BASE_URL}/api/lvas/99999")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ GET /api/lvas/99999 - Non-existent LVA correctly returns 404")


class TestAdminAuthRequired:
    """Tests to verify admin endpoints require authentication"""
    
    def test_admin_lvas_requires_auth(self):
        """GET /api/admin/lvas - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/lvas")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/admin/lvas - Correctly requires authentication")
        
    def test_admin_create_lva_requires_auth(self):
        """POST /api/admin/lvas - Should require authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/lvas", json={
            "name": "Unauthorized LVA",
            "is_active": True
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ POST /api/admin/lvas - Correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
