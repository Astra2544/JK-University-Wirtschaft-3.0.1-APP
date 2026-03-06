"""
═══════════════════════════════════════════════════════════════════════════
 Calendar Events API Tests | ÖH Wirtschaft Website
 Tests for: Public Events, Event Tags, Admin Event CRUD
═══════════════════════════════════════════════════════════════════════════
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://db-image-loader.preview.emergentagent.com')

# Test credentials
ADMIN_USERNAME = "masteradmin"
ADMIN_PASSWORD = "OeH_Wirtschaft_2024!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.fail(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthCheck:
    """Health check endpoint test"""
    
    def test_api_health(self, api_client):
        """Verify API is healthy"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health check passed")


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["admin"]["username"] == ADMIN_USERNAME
        assert data["admin"]["is_master"] == True
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """Test admin login with invalid credentials"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "wronguser", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")


class TestPublicEventsAPI:
    """Public Events API tests (GET /api/events)"""
    
    def test_get_events_returns_200(self, api_client):
        """Test that GET /api/events returns 200"""
        response = api_client.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/events returns {len(data)} events")
    
    def test_get_events_with_month_year_filter(self, api_client):
        """Test events filtered by month and year"""
        response = api_client.get(f"{BASE_URL}/api/events?month=1&year=2025")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All events should be in January 2025
        for event in data:
            assert "2025-01" in event["start_date"]
        print(f"✓ GET /api/events with month=1&year=2025 returns {len(data)} events")
    
    def test_get_events_response_structure(self, api_client):
        """Test event response has correct structure"""
        response = api_client.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            event = data[0]
            required_fields = ["id", "title", "start_date", "all_day", "color", "is_public", "created_by"]
            for field in required_fields:
                assert field in event, f"Missing field: {field}"
        print("✓ Event response structure is correct")
    
    def test_get_events_only_public(self, api_client):
        """Test that only public events are returned"""
        response = api_client.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        for event in data:
            assert event["is_public"] == True
        print("✓ Only public events are returned")


class TestEventTagsAPI:
    """Event Tags API tests (GET /api/events/tags)"""
    
    def test_get_tags_returns_200(self, api_client):
        """Test that GET /api/events/tags returns 200"""
        response = api_client.get(f"{BASE_URL}/api/events/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/events/tags returns {len(data)} tags: {data}")
    
    def test_get_tags_returns_strings(self, api_client):
        """Test that tags are strings"""
        response = api_client.get(f"{BASE_URL}/api/events/tags")
        assert response.status_code == 200
        data = response.json()
        for tag in data:
            assert isinstance(tag, str)
        print("✓ All tags are strings")


class TestAdminEventsAPI:
    """Admin Events API tests (requires authentication)"""
    
    def test_get_admin_events_returns_200(self, authenticated_client):
        """Test that GET /api/admin/events returns 200"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/events returns {len(data)} events")
    
    def test_get_admin_events_unauthorized(self, api_client):
        """Test that unauthenticated request returns 403/401"""
        response = api_client.get(f"{BASE_URL}/api/admin/events")
        assert response.status_code in [401, 403]
        print("✓ Unauthenticated request rejected")
    
    def test_create_event(self, authenticated_client):
        """Test creating a new event"""
        event_data = {
            "title": "TEST_PyTest Event",
            "description": "Test event created by pytest",
            "start_date": "2025-02-01T10:00:00",
            "end_date": "2025-02-01T12:00:00",
            "all_day": False,
            "location": "PyTest Location",
            "color": "teal",
            "tags": "Test, PyTest",
            "is_public": True
        }
        response = authenticated_client.post(
            f"{BASE_URL}/api/admin/events",
            json=event_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == event_data["title"]
        assert data["description"] == event_data["description"]
        assert data["location"] == event_data["location"]
        assert data["color"] == "teal"
        assert data["tags"] == "Test, PyTest"
        assert "id" in data
        print(f"✓ Created event with ID: {data['id']}")
        # Store event ID for cleanup
        return data["id"]
    
    def test_update_event(self, authenticated_client):
        """Test updating an event"""
        # First create an event
        create_data = {
            "title": "TEST_Event to Update",
            "start_date": "2025-02-05T10:00:00",
            "color": "blue",
            "is_public": True
        }
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/events",
            json=create_data
        )
        assert create_response.status_code == 200
        event_id = create_response.json()["id"]
        
        # Update the event
        update_data = {
            "title": "TEST_Event UPDATED",
            "color": "orange",
            "location": "Updated Location"
        }
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/events/{event_id}",
            json=update_data
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["title"] == "TEST_Event UPDATED"
        assert updated["color"] == "orange"
        assert updated["location"] == "Updated Location"
        print(f"✓ Updated event ID: {event_id}")
        
        # Verify with GET
        get_response = authenticated_client.get(f"{BASE_URL}/api/events/{event_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == "TEST_Event UPDATED"
        print("✓ Update verified with GET")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/admin/events/{event_id}")
    
    def test_delete_event(self, authenticated_client):
        """Test deleting an event"""
        # First create an event
        create_data = {
            "title": "TEST_Event to Delete",
            "start_date": "2025-02-10T10:00:00",
            "color": "red",
            "is_public": True
        }
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/events",
            json=create_data
        )
        assert create_response.status_code == 200
        event_id = create_response.json()["id"]
        
        # Delete the event
        delete_response = authenticated_client.delete(
            f"{BASE_URL}/api/admin/events/{event_id}"
        )
        assert delete_response.status_code == 200
        assert "erfolgreich gelöscht" in delete_response.json()["message"]
        print(f"✓ Deleted event ID: {event_id}")
        
        # Verify deletion with GET
        get_response = authenticated_client.get(f"{BASE_URL}/api/events/{event_id}")
        assert get_response.status_code == 404
        print("✓ Deletion verified - event not found")
    
    def test_update_nonexistent_event(self, authenticated_client):
        """Test updating non-existent event returns 404"""
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/events/99999",
            json={"title": "Test"}
        )
        assert response.status_code == 404
        print("✓ Update non-existent event returns 404")
    
    def test_delete_nonexistent_event(self, authenticated_client):
        """Test deleting non-existent event returns 404"""
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/events/99999")
        assert response.status_code == 404
        print("✓ Delete non-existent event returns 404")


class TestEventColorValidation:
    """Test event color options"""
    
    def test_create_event_with_valid_colors(self, authenticated_client):
        """Test creating events with all valid color options"""
        valid_colors = ["blue", "gold", "green", "red", "purple", "pink", "teal", "orange"]
        
        for color in valid_colors:
            event_data = {
                "title": f"TEST_Color {color}",
                "start_date": "2025-02-15T10:00:00",
                "color": color,
                "is_public": True
            }
            response = authenticated_client.post(
                f"{BASE_URL}/api/admin/events",
                json=event_data
            )
            assert response.status_code == 200
            data = response.json()
            assert data["color"] == color
            # Cleanup
            authenticated_client.delete(f"{BASE_URL}/api/admin/events/{data['id']}")
        
        print(f"✓ All {len(valid_colors)} color options work correctly")


@pytest.fixture(scope="module", autouse=True)
def cleanup_test_events(auth_token):
    """Clean up test events after all tests"""
    yield
    # Cleanup all TEST_ prefixed events
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    response = session.get(f"{BASE_URL}/api/admin/events")
    if response.status_code == 200:
        events = response.json()
        for event in events:
            if event["title"].startswith("TEST_"):
                session.delete(f"{BASE_URL}/api/admin/events/{event['id']}")
                print(f"Cleaned up test event: {event['title']}")
