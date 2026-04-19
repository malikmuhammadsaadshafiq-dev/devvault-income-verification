import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.orm import Session
from unittest.mock import patch, Mock
from datetime import datetime, timedelta
import io

from app.main import app
from app.models.user import User
from app.models.income_report import IncomeReport
from app.models.stripe_connection import StripeConnection


class TestE2EUserSignUpFlow:
    """End-to-end tests for user signup → verification report → PDF download"""
    
    @pytest.fixture
    async def async_client(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client
    
    @pytest.fixture
    def test_user_data(self):
        return {
            "email": "test_e2e@example.com",
            "password": "TestPass123!",
            "full_name": "E2E Test User",
            "user_type": "independent_developer"
        }
    
    @pytest.fixture
    def user_banking_data(self):
        """Mock bank statement data"""
        return """Date,Description,Amount,Balance
2024-01-15,Upwork Direct Deposit,2500.00,2500.00
2024-01-20,Stripe Connect Transfer,1800.00,4300.00
2024-02-05,Client Payment - Project A,3500.00,7800.00
2024-02-15,Gumroad Sales,1200.00,9000.00
2024-03-10,Upwork Direct Deposit,2200.00,11200.00
2024-03-20,Stripe Connect Transfer,2800.00,14000.00"""
    
    async def test_complete_user_signup_and_verification_flow(self, async_client: AsyncClient, 
                                                         test_user_data, user_banking_data):
        """Test complete user flow: signup → verify email → connect Stripe → upload statements → generate report"""
        
        # Step 1: User Signup
        response = await async_client.post("/api/v1/auth/signup", json=test_user_data)
        assert response.status_code == 201
        user_data = response.json()
        user_id = user_data["id"]
        access_token = user_data["access_token"]
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 2: Email Verification (mocked)
        mock_verification = Mock()
        mock_verification.return_value = {"verified": True}
        
        verify_response = await async_client.post(
            "/api/v1/auth/verify-email",
            json={"token": "mock_verification_token"},
            headers=headers
        )
        assert verify_response.status_code == 200
        assert verify_response.json()["email_verified"] is True
        
        # Step 3: Connect Stripe Account (mock OAuth flow)
        with patch('app.services.stripe_service.StripeOAuthService.get_access_token') as mock_stripe:
            mock_stripe.return_value = {
                "access_token": "sk_test_mock_token",
                "refresh_token": "sk_test_refresh",
                "stripe_user_id": "acct_e2e_test_user",
                "publishable_key": "pk_test_mock_key",
                "scope": "read_write"
            }
            
            stripe_response = await async_client.post(
                "/api/v1/connect/stripe/complete",
                json={"authorization_code": "mock_auth_code"},
                headers=headers
            )
            assert stripe_response.status_code == 200
            assert stripe_response.json()["connected"] is True
        
        # Step 4: Upload Bank Statements (3 months)
        files_to_upload = [
            ("january_2024.csv", "text/csv", user_banking_data),
            ("february_2024.csv", "text/csv", user_banking_data),
            ("march_2024.csv", "text/csv", user_banking_data)
        ]
        
        uploaded_files = []
        for filename, content_type, content in files_to_upload:
            files = {"file": (filename, content, content_type)}
            upload_response = await async_client.post(
                "/api/v1/upload/bank-statement",
                files=files,
                headers=headers
            )
            assert upload_response.status_code == 201
            uploaded_files.append(upload_response.json())
        
        # Step 5: Generate Income Verification Report
        report_response = await async_client.post(
            "/api/v1/reports/generate",
            json={"report_type": "income_verification", "months": 3},
            headers=headers
        )
        assert report_response.status_code == 201
        
        report_data = report_response.json()
        assert "report_id" in report_data
        assert "period_start" in report_data
        assert "period_end" in report_data
        
        # Verify report contains expected income data
        report_result = await async_client.get(
            f"/api/v1/reports/{report_data['report_id']}",
            headers=headers
        )
        assert report_result.status_code == 200
        
        report_details = report_result.json()
        assert report_details["total_verified_income"] == 16800.00  # 3 months × $5,600 avg
        assert report_details["transaction_count"] == 18  # 6 per month × 3 months
        assert report_details["monthly_average"] >= 5000.00  # Meets verification threshold
    
    async def test_report_access_control(self, async_client: AsyncClient, test_user_data):
        """Test that users cannot access other users' reports"""
        
        # Create User 1
        user1_response = await async_client.post("/api/v1/auth/signup", json={
            **test_user_data,
            "email": "user1@example.com"
        })
        user1_id = user1_response.json()["id"]
        user1_token = user1_response.json()["access_token"]
        
        # Create User 2
        user2_response = await async_client.post("/api/v1/auth/signup", json={
            **test_user_data,
            "email": "user2@example.com"
        })
        user2_token = user2_response.json()["access_token"]
        
        # User 1 uploads statement and creates report
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        
        files = {"file": ("user1_statement.csv", "Date,Amount\n2024-01-01,5000", "text/csv")}
        await async_client.post("/api/v1/upload/bank-statement", files=files, headers=user1_headers)
        
        user1_report = await async_client.post(
            "/api/v1/reports/generate",
            json={"report_type": "income_verification"},
            headers=user1_headers
        )
        user1_report_id = user1_report.json()["report_id"]
        
        # User 2 tries to access User 1's report
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        forbidden_response = await async_client.get(
            f"/api/v1/reports/{user1_report_id}",
            headers=user2_headers
        )
        
        assert forbidden_response.status_code == 403
        assert "not authorized" in forbidden_response.json()["detail"]
    
    async def test_report_performance_within_3_seconds(self, async_client: AsyncClient, 
                                                   test_user_data, user_banking_data):
        """Test that report generation completes within 3 seconds for 500+ transactions"""
        
        # Create user
        user_response = await async_client.post("/api/v1/auth/signup", json=test_user_data)
        access_token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create 500+ transactions worth of data
        large_csv_data = ["Date,Description,Amount,Balance"]
        for i in range(501):  # 501 transactions
            amount = 1000 + (i * 10)
            large_csv_data.append(f"2024-01-{1+(i%28)},Transaction {i},{amount},{amount * 2}")
        
        csv_content = "\n".join(large_csv_data)
        
        # Upload statement
        files = {"file": ("large_statement.csv", csv_content, "text/csv")}
        upload_response = await async_client.post("/api/v1/upload/bank-statement", files=files, headers=headers)
        assert upload_response.status_code == 201
        
        # Start timer and generate report
        import time
        start_time = time.time()
        
        report_response = await async_client.post(
            "/api/v1/reports/generate",
            json={"report_type": "income_verification", "months": 3},
            headers=headers
        )
        
        end_time = time.time()
        generation_time = end_time - start_time
        
        assert report_response.status_code == 201
        assert generation_time < 3.0, f"Report generation took {generation_time}s, expected < 3s"
    
    async def test_pdf_report_download(self, async_client: AsyncClient, test_user_data):
        """Test report PDF generation and download"""
        
        # Create user and login
        user_response = await async_client.post("/api/v1/auth/signup", json=test_user_data)
        access_token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Upload test data
        test_csv = """Date,Description,Amount,Balance
2024-01-01,Client Payment,3000.00,3000.00
2024-02-01,Direct Deposit,2000.00,5000.00
2024-03-01,Stripe Payout,2500.00,7500.00"""
        
        files = {"file": ("test_statement.csv", test_csv, "text/csv")}
        upload_response = await async_client.post("/api/v1/upload/bank-statement", files=files, headers=headers)
        assert upload_response.status_code == 201
        
        # Generate report first
        report_response = await async_client.post(
            "/api/v1/reports/generate",
            json={"report_type": "income_verification", "months": 3},
            headers=headers
        )
        report_id = report_response.json()["report_id"]
        
        # Download PDF
        pdf_response = await async_client.get(
            f"/api/v1/reports/{report_id}/download/pdf",
            headers=headers
        )
        
        assert pdf_response.status_code == 200
        assert pdf_response.headers["content-type"] == "application/pdf"
        assert pdf_response.headers["content-disposition"].startswith("attachment")
        assert len(pdf_response.content) > 0  # Non-empty PDF
    
    async def test_stripe_disconnection_and_reconnection(self, async_client: AsyncClient, test_user_data):
        """Test Stripe disconnection and reconnection during flow"""
        
        user_response = await async_client.post("/api/v1/auth/signup", json=test_user_data)
        access_token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Connect Stripe initially
        with patch('app.services.stripe_service.StripeOAuthService.get_access_token') as mock_stripe:
            mock_stripe.return_value = {
                "access_token": "sk_test_initial",
                "refresh_token": "sk_refresh_initial",
                "stripe_user_id": "acct_initial"
            }
            
            connect_response = await async_client.post(
                "/api/v1/connect/stripe/complete",
                json={"authorization_code": "initial_code"},
                headers=headers
            )
            assert connect_response.status_code == 200
        
        # Disconnect Stripe
        disconnect_response = await async_client.post(
            "/api/v1/connect/stripe/disconnect",
            headers=headers
        )
        assert disconnect_response.status_code == 200
        assert disconnect_response.json()["disconnected"] is True
        
        # Reconnect with different account
        with patch('app.services.stripe_service.StripeOAuthService.get_access_token') as mock_stripe:
            mock_stripe.return_value = {
                "access_token": "sk_test_reconnected",
                "refresh_token": "sk_refresh_reconnected",
                "stripe_user_id": "acct_reconnected"
            }
            
            reconnect_response = await async_client.post(
                "/api/v1/connect/stripe/complete",
                json={"authorization_code": "reconnect_code"},
                headers=headers
            )
            assert reconnect_response.status_code == 200
            assert reconnect_response.json()["account_id"] == "acct_reconnected"
    
    async def test_income_verification_threshold_meeting(self, async_client: AsyncClient):
        """Test when user meets income verification threshold (>$5k/month avg)"""
        
        user_data = {
            "email": "verified_income@example.com",
            "password": "TestPass123!",
            "full_name": "Income Verified User"
        }
        
        user_response = await async_client.post("/api/v1/auth/signup", json=user_data)
        access_token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create high-income statement data
        high_income_data = """Date,Description,Amount,Balance
2024-01-01,Client A Payment,5000.00,5000.00
2024-01-15,Client B Payment,4500.00,9500.00
2024-02-01,Client C Payment,5200.00,14700.00
2024-02-15,Client D Payment,4800.00,19500.00
2024-03-01,Client E Payment,5100.00,24600.00
2024-03-15,Client F Payment,4900.00,29500.00
2024-04-01,Client G Payment,5300.00,34800.00"""
        
        files = {"file": ("high_income_statement.csv", high_income_data, "text/csv")}
        upload_response = await async_client.post("/api/v1/upload/bank-statement", files=files, headers=headers)
        
        # Generate verification report
        verify_response = await async_client.post(
            "/api/v1/reports/generate",
            json={
                "report_type": "income_verification",
                "period_months": 3,
                "minimum_threshold": 5000.00
            },
            headers=headers
        )
        
        report = verify_response.json()
        assert verify_response.status_code == 201
        assert report["meets_threshold"] is True
        assert report["average_monthly_income"] >= 5000.00
        assert report["verification_status"] == "verified"


class TestE2EErrorScenarios:
    """End-to-end error handling scenarios"""
    
    async def test_error_handling_broken_upload_flow(self, async_client: AsyncClient):
        """Test handling of corrupted/malformed file uploads"""
        
        user_data = {"email": "error_test@example.com", "password": "TestPass123!"}
        user_response = await async_client.post("/api/v1/auth/signup", json=user_data)
        access_token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Try to upload corrupted CSV
        corrupted_csv = "Date,Amount,Balance\nThis,Is,Broken,Data\n"
        files = {"file": ("corrupted.csv", corrupted_csv, "text/csv")}
        
        response = await async_client.post("/api/v1/upload/bank-statement", files=files, headers=headers)
        assert response.status_code == 422
        assert "malformed" in response.json()["detail"]
    
    async def test_stripe_connection_timeout_handling(self, async_client: AsyncClient):
        """Test handling of Stripe OAuth timeouts"""
        
        user_data = {"email": "timeout_test@example.com", "password": "TestPass123!"}
        user_response = await async_client.post("/api/v1/auth/signup", json=user_data)
        access_token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Mock Stripe timeout
        with patch('httpx.AsyncClient.get') as mock_get:
            import httpx
            mock_get.side_effect = httpx.TimeoutException("Request timeout")
            
            response = await async_client.get("/api/v1/connect/stripe/authorize", headers=headers)
            assert response.status_code == 503
            assert "timeout" in response.json()["detail"]
    
    async def test_nonexistent_report_not_found(self, async_client: AsyncClient):
        """Test accessing non-existent report returns 404"""
        
        user_data = {"email": "notfound_test@example.com", "password": "TestPass123!"}
        user_response = await async_client.post("/api/v1/auth/signup", json=user_data)
        access_token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        nonexistent_id = "99999999-9999-9999-9999-999999999999"
        response = await async_client.get(f"/api/v1/reports/{nonexistent_id}", headers=headers)
        assert response.status_code == 404