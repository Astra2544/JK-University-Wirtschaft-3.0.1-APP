"""
PostgreSQL Migration & Master-Admin Password Lock Tests
Tests für die PostgreSQL-Umstellung und Master-Admin Passwortsperre
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndConnection:
    """Test basic health and PostgreSQL connection"""
    
    def test_health_endpoint(self):
        """Test that backend is running and healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"✓ Health check passed: {data}")
    
    def test_postgresql_connection_via_study_categories(self):
        """Test PostgreSQL connection by fetching study categories"""
        response = requests.get(f"{BASE_URL}/api/study/categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 4, f"Expected at least 4 categories, got {len(data)}"
        
        # Verify expected categories exist
        category_names = [c['name'] for c in data]
        assert 'bachelor' in category_names, "Bachelor category missing"
        assert 'master' in category_names, "Master category missing"
        print(f"✓ PostgreSQL categories loaded: {len(data)} categories")


class TestMasterAdminLogin:
    """Test Master-Admin login functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get Master-Admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "masteradmin", "password": "oehwirtschaft"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data["access_token"], data["admin"]
    
    def test_master_admin_login_success(self, admin_token):
        """Test Master-Admin can login successfully"""
        token, admin = admin_token
        assert token is not None
        assert admin["username"] == "masteradmin"
        assert admin["is_master"] == True
        assert admin["role"] == "master"
        print(f"✓ Master-Admin login successful: {admin['display_name']}")
    
    def test_master_admin_email_correct(self, admin_token):
        """Test Master-Admin email matches expected value"""
        _, admin = admin_token
        assert admin["email"] == "master@oehwirtschaft.at"
        print(f"✓ Master-Admin email correct: {admin['email']}")


class TestMasterAdminPasswordBlock:
    """Test Master-Admin password change is BLOCKED"""
    
    @pytest.fixture
    def master_token(self):
        """Get Master-Admin token for password change test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "masteradmin", "password": "oehwirtschaft"}
        )
        return response.json()["access_token"]
    
    def test_password_change_blocked_with_403(self, master_token):
        """CRITICAL: Master-Admin password change must return HTTP 403"""
        response = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            headers={"Authorization": f"Bearer {master_token}"},
            json={"current_password": "oehwirtschaft", "new_password": "newpassword123"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Password change correctly blocked with HTTP 403")
    
    def test_password_change_error_message(self, master_token):
        """CRITICAL: Verify exact German error message for Master-Admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            headers={"Authorization": f"Bearer {master_token}"},
            json={"current_password": "oehwirtschaft", "new_password": "newpassword123"}
        )
        data = response.json()
        expected_message = "Der Master admin ist nicht befugt sein Passwort zu ändern. Verwaltung liegt bei Astra Capital e.U."
        assert data["detail"] == expected_message, f"Wrong error message: {data.get('detail')}"
        print(f"✓ Correct error message returned: {data['detail']}")


class TestStudyDataFromPostgreSQL:
    """Test Study data is loaded correctly from PostgreSQL"""
    
    def test_study_programs_loaded(self):
        """Test study programs are loaded from PostgreSQL"""
        response = requests.get(f"{BASE_URL}/api/study/programs")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 20, f"Expected at least 20 programs, got {len(data)}"
        print(f"✓ Study programs loaded: {len(data)} programs")
    
    def test_study_updates_loaded(self):
        """Test study updates are loaded from PostgreSQL"""
        response = requests.get(f"{BASE_URL}/api/study/updates")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 20, f"Expected at least 20 updates, got {len(data)}"
        print(f"✓ Study updates loaded: {len(data)} updates")
    
    def test_study_updates_grouped(self):
        """Test grouped updates endpoint for frontend"""
        response = requests.get(f"{BASE_URL}/api/study/updates/grouped")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 5, f"Expected at least 5 grouped programs, got {len(data)}"
        print(f"✓ Grouped updates loaded: {len(data)} program groups")


class TestSGUCRUDOperations:
    """Test SGU (Studiengang-Updates) CRUD operations"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get authenticated headers for admin operations"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "masteradmin", "password": "oehwirtschaft"}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_create_study_update(self, admin_headers):
        """Test creating a new study update"""
        # First get a program ID
        programs = requests.get(f"{BASE_URL}/api/study/programs").json()
        program_id = programs[0]["id"]
        
        # Create test update
        response = requests.post(
            f"{BASE_URL}/api/admin/study/updates",
            headers=admin_headers,
            json={
                "program_id": program_id,
                "content": "TEST_PYTEST: Testinhalt für PostgreSQL Migration",
                "semester": "Testsemester 2026",
                "is_active": True,
                "sort_order": 999
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ Study update created with ID: {data['id']}")
        
        # Cleanup - delete the test update
        requests.delete(f"{BASE_URL}/api/admin/study/updates/{data['id']}", headers=admin_headers)
        print(f"✓ Test update cleaned up")
    
    def test_admin_study_categories_endpoint(self, admin_headers):
        """Test admin study categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/study/categories", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 4
        print(f"✓ Admin study categories: {len(data)} categories")
    
    def test_admin_study_programs_endpoint(self, admin_headers):
        """Test admin study programs endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/study/programs", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 20
        print(f"✓ Admin study programs: {len(data)} programs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
