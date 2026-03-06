#!/usr/bin/env python3
"""
Backend API Tests for ÖH Wirtschaft Asset Management System
Tests the asset synchronization and API endpoints
"""

import requests
import sys
import json
from datetime import datetime

class AssetAPITester:
    def __init__(self, base_url="https://mobile-replica-14.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Try to parse JSON response for additional validation
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items returned")
                    elif isinstance(response_data, dict):
                        if 'data_url' in response_data:
                            print(f"   Response: Asset data returned (length: {len(response_data.get('data_url', ''))[:50]}...)")
                        else:
                            print(f"   Response: {list(response_data.keys())}")
                    return True, response_data
                except:
                    print(f"   Response: Non-JSON response ({len(response.text)} chars)")
                    return True, response.text
            else:
                self.issues.append({
                    "endpoint": endpoint,
                    "issue": f"Expected status {expected_status}, got {response.status_code}",
                    "response": response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.issues.append({
                "endpoint": endpoint,
                "issue": f"Network error: {str(e)}",
                "response": ""
            })
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}

    def test_get_all_assets(self):
        """Test GET /api/assets - Liste aller Assets aus der Datenbank"""
        success, response = self.run_test(
            "Get All Assets",
            "GET",
            "api/assets",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Returned {len(response)} assets")
            
            # Check structure of first asset if available
            if response:
                asset = response[0]
                required_fields = ['asset_key', 'filename', 'mime_type', 'category']
                missing_fields = [field for field in required_fields if field not in asset]
                if missing_fields:
                    self.issues.append({
                        "endpoint": "api/assets",
                        "issue": f"Missing fields in asset response: {missing_fields}",
                        "response": str(asset)
                    })
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                else:
                    print(f"   ✓ Asset structure correct")
                
        return success, response

    def test_get_single_asset(self, asset_key="logo"):
        """Test GET /api/assets/{asset_key} - Einzelnes Asset mit data_url abrufen"""
        success, response = self.run_test(
            f"Get Single Asset ({asset_key})",
            "GET",
            f"api/assets/{asset_key}",
            200
        )
        
        if success and isinstance(response, dict):
            # Check if data_url is present and looks like base64
            data_url = response.get('data_url', '')
            if data_url and data_url.startswith('data:'):
                print(f"   ✓ Valid data URL format")
            else:
                self.issues.append({
                    "endpoint": f"api/assets/{asset_key}",
                    "issue": "data_url missing or invalid format",
                    "response": str(response.keys())
                })
                print(f"   ⚠️  Invalid data_url format")
                
        return success, response

    def test_get_assets_batch(self, keys="logo,oehli-logo"):
        """Test GET /api/assets-batch?keys=logo,oehli-logo - Mehrere Assets gleichzeitig abrufen"""
        success, response = self.run_test(
            f"Get Assets Batch ({keys})",
            "GET",
            f"api/assets-batch?keys={keys}",
            200
        )
        
        if success and isinstance(response, dict):
            key_list = [k.strip() for k in keys.split(',')]
            found_keys = list(response.keys())
            print(f"   ✓ Requested keys: {key_list}")
            print(f"   ✓ Returned keys: {found_keys}")
            
            # Check if all requested keys are returned (if they exist)
            for key in key_list:
                if key in response:
                    asset_data = response[key]
                    if 'data_url' in asset_data and asset_data['data_url']:
                        print(f"   ✓ {key}: Valid data_url")
                    else:
                        print(f"   ⚠️  {key}: Missing or empty data_url")
                else:
                    print(f"   ⚠️  {key}: Not found in response")
                    
        return success, response

    def test_asset_categories(self):
        """Test filtering assets by category"""
        categories_to_test = ['logo', 'background', 'team']
        
        for category in categories_to_test:
            success, response = self.run_test(
                f"Get Assets by Category ({category})",
                "GET",
                f"api/assets?category={category}",
                200
            )
            
            if success and isinstance(response, list):
                print(f"   ✓ Category '{category}': {len(response)} assets")
                
                # Verify all returned assets have the correct category
                for asset in response:
                    if asset.get('category') != category:
                        self.issues.append({
                            "endpoint": f"api/assets?category={category}",
                            "issue": f"Asset {asset.get('asset_key')} has wrong category: {asset.get('category')}",
                            "response": str(asset)
                        })

    def test_nonexistent_asset(self):
        """Test requesting non-existent asset returns 404"""
        success, response = self.run_test(
            "Get Non-existent Asset",
            "GET",
            "api/assets/nonexistent-asset-key",
            404
        )
        return success

    def test_asset_sync_verification(self):
        """Verify that asset sync has been performed by checking for expected assets"""
        print(f"\n🔍 Verifying Asset Sync from Filesystem...")
        
        # Expected assets based on ASSETS_TO_SYNC configuration
        expected_assets = [
            'logo',
            'oehli-logo', 
            'background/hero-main',
            'background/slide-1',
            'team/maximilian-pilsner',
            'team/lucia-schoisswohl'
        ]
        
        success, all_assets = self.test_get_all_assets()
        if not success:
            return False
            
        asset_keys = [asset['asset_key'] for asset in all_assets] if isinstance(all_assets, list) else []
        
        found_count = 0
        for expected in expected_assets:
            if expected in asset_keys:
                found_count += 1
                print(f"   ✓ Found expected asset: {expected}")
            else:
                print(f"   ⚠️  Missing expected asset: {expected}")
                
        sync_success = found_count > 0
        if sync_success:
            print(f"   ✓ Asset sync verification: {found_count}/{len(expected_assets)} assets found")
        else:
            self.issues.append({
                "endpoint": "Asset Sync",
                "issue": "No expected assets found - sync may have failed",
                "response": f"Found assets: {asset_keys[:10]}"
            })
            print(f"   ❌ No expected assets found - sync may have failed")
            
        return sync_success

def main():
    print("=" * 60)
    print("ÖH WIRTSCHAFT - ASSET MANAGEMENT API TESTS")
    print("=" * 60)
    
    # Setup
    tester = AssetAPITester()
    
    # Test suite
    print(f"\n📋 Running Asset Management Tests...")
    
    # 1. Test basic asset listing
    tester.test_get_all_assets()
    
    # 2. Test asset sync verification
    tester.test_asset_sync_verification()
    
    # 3. Test single asset retrieval
    tester.test_get_single_asset("logo")
    tester.test_get_single_asset("oehli-logo")
    
    # 4. Test batch asset retrieval
    tester.test_get_assets_batch("logo,oehli-logo")
    tester.test_get_assets_batch("background/hero-main,team/maximilian-pilsner")
    
    # 5. Test category filtering
    tester.test_asset_categories()
    
    # 6. Test error handling
    tester.test_nonexistent_asset()
    
    # Print summary
    print(f"\n📊 TEST SUMMARY")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.issues:
        print(f"\n❌ ISSUES FOUND:")
        for i, issue in enumerate(tester.issues, 1):
            print(f"{i}. {issue['endpoint']}: {issue['issue']}")
            if issue['response']:
                print(f"   Response: {issue['response']}")
    else:
        print(f"\n✅ All tests passed successfully!")
    
    # Return exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())