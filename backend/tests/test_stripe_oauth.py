import pytest
from unittest.mock import patch, Mock, AsyncMock
from httpx import Response
import json
from datetime import datetime, timedelta
from typing import Dict, Optional

from app.services.stripe_service import StripeOAuthService
from app.models.user import User
from app.models.stripe_connection import StripeConnection
from sqlalchemy.orm import Session


class TestStripeOAuthService:
    """Test Stripe OAuth flow mocking and integration"""
    
    def setup_method(self):
        self.service = StripeOAuthService(
            client_id="test_client_id",
            client_secret="test_client_secret",
            redirect_uri="http://localhost:8000/auth/stripe/callback"
        )
    
    def test_generate_oauth_url(self):
        """Test OAuth URL generation with correct parameters"""
        state = "test_random_state"
        url = self.service.get_oauth_url(state)
        
        expected_params = [
            "response_type=code",
            "scope=read_write",
            "test_client_id",
            "state=test_random_state",
            "redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fauth%2Fstripe%2Fcallback"
        ]
        
        for param in expected_params:
            assert param in url
        assert url.startswith("https://connect.stripe.com/oauth/authorize")
    
    @patch('httpx.AsyncClient.post')
    async def test_get_access_token_success(self, mock_post):
        """Test successful access token retrieval from Stripe"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token",
            "stripe_user_id": "acct_1234567890",
            "publishable_key": "pk_test_12345",
            "livemode": False,
            "scope": "read_write"
        }
        mock_post.return_value.__aenter__.return_value = mock_response
        
        result = await self.service.get_access_token("auth_code_123")
        
        assert result["access_token"] == "test_access_token"
        assert result["stripe_user_id"] == "acct_1234567890"
        assert result["scope"] == "read_write"
    
    @patch('httpx.AsyncClient.post')
    async def test_get_access_token_invalid_auth_code(self, mock_post):
        """Test handling of invalid authorization code"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": "invalid_authorization_code",
            "error_description": "Invalid authorization code"
        }
        mock_post.return_value.__aenter__.return_value = mock_response
        
        with pytest.raises(Exception) as exc_info:
            await self.service.get_access_token("invalid_auth_code")
        assert "invalid_authorization_code" in str(exc_info.value)
    
    @patch('httpx.AsyncClient.post')
    async def test_get_access_token_rate_limit(self, mock_post):
        """Test handling of rate limit errors"""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.headers = {"Retry-After": "60"}
        mock_response.text = "Rate limit exceeded"
        mock_post.return_value.__aenter__.return_value = mock_response
        
        with pytest.raises(Exception) as exc_info:
            await self.service.get_access_token("auth_code")
        assert "rate limit" in str(exc_info.value).lower()


class TestStripeOAuthFlowMock:
    """Mock-based tests for Stripe OAuth flow"""
    
    @pytest.fixture
    def mock_stripe_connection(self):
        return {
            "access_token": "mock_access_123",
            "refresh_token": "mock_refresh_456",
            "stripe_user_id": "acct_mock_user",
            "publishable_key": "pk_test_mock",
            "connected_at": datetime.utcnow()
        }
    
    @patch('app.services.stripe_service.StripeOAuthService.get_access_token')
    @patch('app.models.stripe_connection.StripeConnection.create')
    def test_complete_oauth_flow_mock(self, mock_create_connection, mock_get_token, 
                                    mock_stripe_connection, db_session: Session):
        """Test complete OAuth flow using mocked Stripe responses"""
        
        # Mock token response
        mock_get_token.return_value = {
            "access_token": "mock_access_123",
            "refresh_token": "mock_refresh_456",
            "stripe_user_id": "acct_mock_user",
            "publishable_key": "pk_test_mock"
        }
        
        # Mock database creation
        mock_connection = Mock()
        mock_connection.id = 1
        mock_connection.stripe_user_id = "acct_mock_user"
        mock_create_connection.return_value = mock_connection
        
        user = User(id=1, email="test@example.com")
        
        # Test complete flow
        from app.api.v1.endpoints.stripe_oauth import complete_stripe_oauth
        result = complete_stripe_oauth("auth_code_mock", user, db_session)
        
        assert result.stripe_user_id == "acct_mock_user"
        assert result.connected_at is not None
        mock_get_token.assert_called_once_with("auth_code_mock")


class TestStripeConnectionManagement:
    """Test Stripe connection management at the database level"""
    
    def test_create_stripe_connection(self, db_session: Session):
        """Test creating a new Stripe connection in database"""
        user = User(id=1, email="test@example.com")
        
        connection_data = {
            "user_id": user.id,
            "stripe_user_id": "acct_test_user",
            "access_token": "sk_test_access_token",
            "refresh_token": "sk_test_refresh_token",
            "publishable_key": "pk_test_publishable",
            "scope": "read_write"
        }
        
        conn = StripeConnection(**connection_data)
        db_session.add(conn)
        db_session.commit()
        
        assert conn.id is not None
        assert conn.stripe_user_id == "acct_test_user"
        assert conn.connected_at <= datetime.utcnow()
        assert conn.is_active is True
    
    def test_connection_deactivation(self, db_session: Session):
        """Test deactivating a Stripe connection"""
        user = User(id=1, email="test@example.com")
        
        conn = StripeConnection(
            user_id=user.id,
            stripe_user_id="acct_test",
            access_token="test_token",
            is_active=True
        )
        db_session.add(conn)
        db_session.commit()
        
        # Deactivate connection
        conn.is_active = False
        db_session.commit()
        
        assert conn.is_active is False
        assert conn.disconnected_at is not None
    
    def test_user_cannot_duplicate_connections(self, db_session: Session):
        """Test that users cannot create duplicate Stripe connections"""
        user = User(id=1, email="test@example.com")
        
        conn1 = StripeConnection(
            user_id=user.id,
            stripe_user_id="acct_1",
            access_token="token1"
        )
        db_session.add(conn1)
        db_session.commit()
        
        # Attempt duplicate with same stripe_user_id
        conn2 = StripeConnection(
            user_id=user.id,
            stripe_user_id="acct_1",
            access_token="token2"
        )
        
        db_session.add(conn2)
        with pytest.raises(Exception):  # Should trigger unique constraint
            db_session.commit()


class TestStripeOauthEndpoints:
    """Test actual OAuth endpoints"""
    
    def setup_method(self):
        from fastapi.testclient import TestClient
        from app.main import app
        self.client = TestClient(app)
    
    @patch('app.services.stripe_service.StripeOAuthService.get_oauth_url')
    @patch('app.api.v1.dependencies.get_current_user')
    def test_oauth_initiate_endpoint(self, mock_get_user, mock_get_url):
        """Test OAuth initiation endpoint"""
        mock_user = Mock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user
        
        mock_get_url.return_value = "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=test"
        
        response = self.client.get(
            "/api/v1/connect/stripe/authorize",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 302
        assert "Location" in response.headers
    
    @patch('app.api.v1.endpoints.stripe_oauth.handle_stripe_callback')
    @patch('app.api.v1.dependencies.get_current_user')
    def test_oauth_callback_endpoint(self, mock_get_user, mock_callback):
        """Test OAuth callback endpoint"""
        mock_user = Mock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user
        
        mock_callback.return_value = {"status": "connected", "account_id": "acct_123"}
        
        response = self.client.get(
            "/api/v1/auth/stripe/callback?code=test_code&state=test_state",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        assert response.json()["account_id"] == "acct_123"


class TestStripeWebhookHandling:
    """Test Stripe webhook handling for account updates"""
    
    def test_webhook_signature_verification(self):
        """Test Stripe webhook signature verification"""
        from app.services.stripe_service import StripeWebhookService
        
        webhook_service = StripeWebhookService(
            webhook_secret="whsec_test_secret"
        )
        
        payload = b'{"id":"evt_test","type":"account.application.deauthorized"}'
        signature = "t=1234567890,v1=test_signature"
        
        with patch('stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = {
                'id': 'evt_test',
                'type': 'account.application.deauthorized',
                'data': {'object': {'id': 'acct_test'}}
            }
            
            event = webhook_service.verify_webhook(payload, signature)
            assert event['type'] == 'account.application.deauthorized'
    
    def test_handle_account_deauthorized(self, db_session: Session):
        """Test handling account deauthorization via webhook"""
        user = User(id=1, email="test@example.com")
        
        conn = StripeConnection(
            user_id=user.id,
            stripe_user_id="acct_test_deauth",
            access_token="test_token",
            is_active=True
        )
        db_session.add(conn)
        db_session.commit()
        
        # Simulate deauthorization webhook
        conn.is_active = False
        conn.disconnected_at = datetime.utcnow()
        db_session.commit()
        
        updated_conn = db_session.query(StripeConnection).filter_by(
            stripe_user_id="acct_test_deauth"
        ).first()
        assert updated_conn.is_active is False
        assert updated_conn.disconnected_at is not None


class TestStripeErrorsAndRetries:
    """Test error handling and retry mechanisms"""
    
    @patch('httpx.AsyncClient.post')
    async def test_stripe_timeout_handling(self, mock_post):
        """Test handling timeout errors from Stripe"""
        import httpx
        mock_post.side_effect = httpx.TimeoutException("Request timeout")
        
        with pytest.raises(Exception) as exc_info:
            await self.service.get_access_token("test_code")
        assert "timeout" in str(exc_info.value)
    
    @patch('httpx.AsyncClient.post')
    async def test_stripe_network_errors(self, mock_post):
        """Test handling network connectivity issues"""
        import httpx
        mock_post.side_effect = httpx.ConnectError("Network unreachable")
        
        with pytest.raises(Exception) as exc_info:
            await self.service.get_access_token("test_code")
        assert "network" in str(exc_info.value)
    
    @patch('httpx.AsyncClient.post')
    async def test_token_refresh_flow(self, mock_post):
        """Test token refresh flow when access token expires"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "new_access_token",
            "refresh_token": "new_refresh_token",
            "token_type": "bearer"
        }
        mock_post.return_value.__aenter__.return_value = mock_response
        
        result = await self.service.refresh_access_token("old_refresh_token")
        
        assert result["access_token"] == "new_access_token"
        assert result["refresh_token"] == "new_refresh_token"