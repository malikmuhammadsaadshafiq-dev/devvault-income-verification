import pytest
import io
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.main import app
from app.api.v1.endpoints.upload import validate_file, upload_bank_statement
from app.core.config import settings
from app.models.user import User
from app.models.bank_statement import BankStatement

client = TestClient(app)


class TestFileUploadValidation:
    """Test file upload validation functionality"""
    
    def test_file_extension_validation(self):
        """Test that only CSV and PDF files are accepted"""
        # Test valid extensions
        assert validate_file("test.csv", "text/csv") is True
        assert validate_file("test.pdf", "application/pdf") is True
        
        # Test invalid extensions
        with pytest.raises(HTTPException) as exc_info:
            validate_file("test.txt", "text/plain")
        assert exc_info.value.status_code == 400
        assert "Invalid file format" in str(exc_info.value.detail)
        
        with pytest.raises(HTTPException) as exc_info:
            validate_file("test.exe", "application/octet-stream")
        assert exc_info.value.status_code == 400
    
    def test_file_size_limits(self):
        """Test file size restrictions (max 10MB)"""
        # Mock file size testing
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        large_file = UploadFile(filename="large.csv", file=io.BytesIO(large_content))
        
        with pytest.raises(HTTPException) as exc_info:
            validate_file(large_file.filename, "text/csv", len(large_content))
        assert exc_info.value.status_code == 413
        assert "File too large" in str(exc_info.value.detail)
    
    def test_mime_type_validation(self):
        """Test MIME type validation"""
        # Valid MIME types
        assert validate_file("test.csv", "text/csv") is True
        assert validate_file("test.pdf", "application/pdf") is True
        
        # Invalid MIME types should reject
        with pytest.raises(HTTPException) as exc_info:
            validate_file("test.csv", "text/plain")  # MIME doesn't match extension
        assert exc_info.value.status_code == 400


class TestFileUploadIntegration:
    """Integration tests for file upload endpoints"""
    
    def setup_method(self):
        """Setup test user"""
        self.headers = {"Authorization": "Bearer test-token"}
    
    @patch('app.api.v1.endpoints.upload.get_current_user')
    def test_upload_csv_bank_statement(self, mock_get_user, db_session: Session):
        """Test successful CSV bank statement upload"""
        # Mock authenticated user
        user = User(id=1, email="test@example.com")
        mock_get_user.return_value = user
        
        # Create test CSV content
        csv_content = """Date,Description,Amount
2024-01-01,Client Payment - ABC Corp,2500.00
2024-01-05,Direct Deposit - Upwork,1200.00
2024-01-15,Client Payment - XYZ LLC,3400.00"""
        
        response = client.post(
            "/api/v1/upload/bank-statement",
            files={"file": ("test_statement.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["filename"] == "test_statement.csv"
        assert data["file_type"] == "csv"
        assert "encrypted_path" in data
        
        # Verify database entry
        statement = db_session.query(BankStatement).filter_by(user_id=user.id).first()
        assert statement is not None
        assert statement.filename.endswith(".csv")
    
    @patch('app.api.v1.endpoints.upload.get_current_user')
    def test_upload_pdf_bank_statement(self, mock_get_user):
        """Test successful PDF bank statement upload"""
        user = User(id=1, email="test@example.com")
        mock_get_user.return_value = user
        
        # Create mock PDF content
        pdf_content = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
        
        response = client.post(
            "/api/v1/upload/bank-statement",
            files={"file": ("statement.pdf", pdf_content, "application/pdf")},
            headers=self.headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["file_type"] == "pdf"
    
    def test_unauthorized_upload(self):
        """Test upload without authentication"""
        response = client.post(
            "/api/v1/upload/bank-statement",
            files={"file": ("test.csv", "test,data", "text/csv")}
        )
        assert response.status_code == 401


class TestFileProcessingSecurity:
    """Security tests for file upload and processing"""
    
    def test_no_social_security_numbers_in_csv(self):
        """Test that uploaded CSV files are scanned for SSN patterns"""
        csv_with_ssn = """Date,Description,SSN,Amount
2024-01-01,Client Payment,123-45-6789,2500.00"""
        
        # This should trigger security scan and fail
        with pytest.raises(ValueError) as exc_info:
            from app.services.security_scanner import scan_for_sensitive_data
            scan_for_sensitive_data(csv_with_ssn)
        assert "detected sensitive data" in str(exc_info.value)
    
    def test_file_encryption_at_rest(self):
        """Test that uploaded files are encrypted when stored"""
        # Mock file encryption
        test_content = b"sensitive bank data here"
        encrypted = upload_bank_statement(test_content, "test.csv")
        
        # Verify encryption
        assert encrypted != test_content
        assert encrypted.startswith(b"\x0012345")  # Example encrypted header


class TestFileUploadEdgeCases:
    """Test edge cases for file upload"""
    
    def test_empty_file_upload(self):
        """Test handling of empty files"""
        response = client.post(
            "/api/v1/upload/bank-statement",
            files={"file": ("empty.csv", "", "text/csv")},
            headers=self.headers
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"]
    
    def test_filename_with_special_chars(self):
        """Test handling of filenames with special characters"""
        filename = "bank statement (Q1 2024) - John's business.csv"
        csv_content = "Date,Amount\n2024-01-01,1000"
        
        response = client.post(
            "/api/v1/upload/bank-statement",
            files={"file": (filename, csv_content, "text/csv")},
            headers=self.headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["filename"] == filename
    
    def test_corrupted_csv_handling(self):
        """Test handling of corrupted/malformed CSV files"""
        corrupted_csv = "Date,Amount
2024-01-01,"1000"
2024-01-02""  # Missing closing quote
        
        response = client.post(
            "/api/v1/upload/bank-statement",
            files={"file": ("corrupted.csv", corrupted_csv, "text/csv")},
            headers=self.headers
        )
        assert response.status_code == 422
        assert "malformed" in response.json()["detail"]


@pytest.fixture
def db_session():
    """Database session fixture"""
    from app.db.session import SessionLocal
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()