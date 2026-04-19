import pytest
import pandas as pd
from unittest.mock import patch, mock_open
import io
from datetime import datetime

from app.parsers.csv_parser import CSVStatementParser
from app.parsers.pdf_parser import PDFStatementParser
from app.parsers.data_cleaner import remove_pii_from_transactions


class TestCSVBankStatementParser:
    """Test CSV bank statement parsing functionality"""
    
    def test_parse_standard_csv(self):
        """Test parsing a standard CSV bank statement"""
        csv_content = """Transaction Date,Description,Amount,Balance
2024-01-01,Client Payment - ABC Corp,2500.00,12500.00
2024-01-05,Upwork Direct Deposit,1200.00,13700.00
2024-01-15,Client Payment - XYZ LLC,-3400.00,10300.00
2024-01-20,Interest Earned,12.50,10312.50"""
        
        parser = CSVStatementParser()
        transactions = parser.parse(io.StringIO(csv_content))
        
        assert len(transactions) == 4
        assert transactions[0]["date"] == datetime(2024, 1, 1)
        assert transactions[0]["description"] == "Client Payment - ABC Corp"
        assert transactions[0]["amount"] == 2500.00
        assert transactions[0]["balance"] == 12500.00
    
    def test_parse_csv_without_balance_column(self):
        """Test parsing CSV without balance column"""
        csv_content = """Date,Transaction,Amount
2024-01-01,Shopify Payout,1500.00
2024-01-03,Stripe Transfer,2200.00
2024-01-10,Platform Fee,-100.00"""
        
        parser = CSVStatementParser()
        transactions = parser.parse(io.StringIO(csv_content))
        
        assert len(transactions) == 3
        assert "balance" not in transactions[0] or transactions[0]["balance"] is None
    
    def test_parse_csv_with_various_date_formats(self):
        """Test handling different date formats"""
        csv_content = """Transaction Date,Description,Amount
01/01/2024,Payment,1000.00
01-05-2024,Transfer,2000.00
Jan 10 2024,Deposit,1500.00
1/15/2024 14:30,Fee,-50.00"""
        
        parser = CSVStatementParser()
        transactions = parser.parse(io.StringIO(csv_content))
        
        assert len(transactions) == 4
        # Should handle all formats correctly
        for transaction in transactions:
            assert isinstance(transaction["date"], datetime)
    
    def test_parse_international_csv_formats(self):
        """Test CSV with international formats (commas as decimal separators)"""
        csv_content = """Date,Description,Amount
2024-01-01,Payment,"1.500,00"
2024-01-02,Transfer,"2.200,50"
2024-01-03,Fee,"-100,00"""
        
        parser = CSVStatementParser(locale="de")  # European format
        transactions = parser.parse(io.StringIO(csv_content))
        
        assert transactions[0]["amount"] == 1500.00  # 1.500,00 -> 1500.00
        assert transactions[1]["amount"] == 2200.50  # 2.200,50 -> 2200.50
    
    def test_empty_csv_handling(self):
        """Test handling empty CSV files"""
        parser = CSVStatementParser()
        
        empty_csv = "Date,Description,Amount\n"
        transactions = parser.parse(io.StringIO(empty_csv))
        assert len(transactions) == 0
        
        # Test completely empty file
        with pytest.raises(ValueError):
            parser.parse(io.StringIO(""))
    
    def test_malformed_csv_handling(self):
        """Test handling malformed CSV data"""
        malformed_csv = """Date,Description,Amount
2024-01-01,Payment"""  # Missing last column
        
        parser = CSVStatementParser()
        with pytest.raises(ValueError) as exc_info:
            parser.parse(io.StringIO(malformed_csv))
        assert "incomplete" in str(exc_info.value)


class TestPDFBankStatementParser:
    """Test PDF bank statement parsing functionality"""
    
    @patch('pdfplumber.open')
    def test_parse_standard_pdf_statement(self, mock_pdf_open):
        """Test parsing a standard PDF bank statement"""
        # Mock PDF content extraction
        mock_page = MagicMock()
        mock_page.extract_text.return_value = """
        January 2024 Statement
        
        01/01/2024    CLIENT PAYMENT - ABC CORP        +2,500.00    12,500.00
        01/05/2024    UPWORK DIRECT DEPOSIT            +1,200.00    13,700.00
        01/15/2024    CLIENT PAYMENT - XYZ LLC         +3,400.00    17,100.00
        01/20/2024    MONTHLY FEE                       -15.00    17,085.00
        """
        
        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]
        mock_pdf_open.return_value.__enter__.return_value = mock_pdf
        
        parser = PDFStatementParser()
        transactions = parser.parse("dummy.pdf")
        
        assert len(transactions) == 4
        assert transactions[0]["description"] == "CLIENT PAYMENT - ABC CORP"
        assert transactions[0]["amount"] == 2500.00
        assert transactions[0]["balance"] == 12500.00
    
    @patch('pdfplumber.open')
    def test_parse_pdf_with_mixed_columns(self, mock_pdf_open):
        """Test parsing PDF with mixed column layouts"""
        mock_page = MagicMock()
        mock_page.extract_text.return_value = """
        2024 Date          Transaction Description           Deposits(-) Withdrawals(+)    Balance
        
        01/01              Client Payment A                  2,500.00                   12,500.00
        01/05              Deposit B                         1,200.00                   13,700.00
        01/15              Transfer C                               500.00              13,200.00
        """
        
        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]
        mock_pdf_open.return_value.__enter__.return_value = mock_pdf
        
        parser = PDFStatementParser()
        transactions = parser.parse("dummy.pdf")
        
        assert len(transactions) == 3
        assert transactions[0]["amount"] == 2500.00
        assert transactions[2]["amount"] == -500.00
    
    def test_corrupted_pdf_handling(self):
        """Test handling corrupted PDF files"""
        parser = PDFStatementParser()
        with pytest.raises(ValueError) as exc_info:
            parser.parse("corrupted.pdf")
        assert "invalid PDF structure" in str(exc_info.value)
    
    def test_empty_pdf_handling(self):
        """Test handling empty PDF files"""
        with patch('pdfplumber.open') as mock_pdf_open:
            mock_pdf = MagicMock()
            mock_pdf.pages = []
            mock_pdf_open.return_value.__enter__.return_value = mock_pdf
            
            parser = PDFStatementParser()
            transactions = parser.parse("empty.pdf")
            assert len(transactions) == 0


class TestDataCleaningAndPIIRemoval:
    """Test PII removal from bank statement data"""
    
    def test_remove_account_numbers(self):
        """Test removing bank account numbers from descriptions"""
        original_data = [
            {
                "description": "Payment from John Doe acc: 1234567890",
                "amount": 1000.00,
                "date": datetime(2024, 1, 1)
            }
        ]
        
        cleaned = remove_pii_from_transactions(original_data)
        
        assert "1234567890" not in cleaned[0]["description"]
        assert "acc: ****" in cleaned[0]["description"]
    
    def test_remove_social_security_numbers(self):
        """Test removing SSN patterns from descriptions"""
        original_data = [
            {
                "description": "ACH payment SSN: 123-45-6789 from client",
                "amount": 2000.00,
                "date": datetime(2024, 1, 1)
            }
        ]
        
        cleaned = remove_pii_from_transactions(original_data)
        
        assert "123-45-6789" not in cleaned[0]["description"]
        assert "SSN: ***-**-****" in cleaned[0]["description"]
    
    def test_remove_email_addresses(self):
        """Test removing email addresses from descriptions"""
        original_data = [
            {
                "description": "Freelance payment from john.doe@email.com",
                "amount": 500.00,
                "date": datetime(2024, 1, 1)
            }
        ]
        
        cleaned = remove_pii_from_transactions(original_data)
        
        assert "john.doe@email.com" not in cleaned[0]["description"]
        assert "***@***.***" in cleaned[0]["description"]
    
    def test_preserve_business_names_only(self):
        """Test that legitimate business names are preserved while removing personal info"""
        original_data = [
            {
                "description": "Payment from Amazon Web Services for consulting",
                "amount": 3500.00,
                "date": datetime(2024, 1, 1)
            },
            {
                "description": "Stripe transfer for Shopify store #12345",
                "amount": 1200.00,
                "date": datetime(2024, 1, 2)
            }
        ]
        
        cleaned = remove_pii_from_transactions(original_data)
        
        # Business names should remain
        assert "Amazon Web Services" in cleaned[0]["description"]
        assert "Shopify" in cleaned[1]["description"]
        # Account numbers should be removed
        assert "#12345" not in cleaned[1]["description"]
    
    def test_pii_removal_with_empty_descriptions(self):
        """Test handling edge cases with empty or None descriptions"""
        original_data = [
            {
                "description": None,
                "amount": 1000.00,
                "date": datetime(2024, 1, 1)
            },
            {
                "description": "",
                "amount": 2000.00,
                "date": datetime(2024, 1, 2)
            }
        ]
        
        cleaned = remove_pii_from_transactions(original_data)
        
        assert cleaned[0]["description"] is None
        assert cleaned[1]["description"] == ""


class TestParserPerformance:
    """Performance tests for CSV/PDF parsing"""
    
    def test_csv_parser_performance_large_file(self):
        """Test CSV parser performance with large files (500+ transactions)"""
        # Generate large CSV content
        rows = 500
        csv_rows = ["Date,Description,Amount,Balance"]
        for i in range(rows):
            csv_rows.append(
                f"2024-01-{i%28+1:02d},Freelance Payment - Client {i},{(i + 1) * 100},{(i + 1) * 1000}"
            )
        csv_content = "\n".join(csv_rows)
        
        parser = CSVStatementParser()
        start_time = time.time()
        transactions = parser.parse(io.StringIO(csv_content))
        end_time = time.time()
        
        assert len(transactions) == rows
        assert (end_time - start_time) < 3.0  # Should complete within 3 seconds
    
    @patch('pdfplumber.open')
    def test_pdf_parser_performance_large_file(self, mock_pdf_open):
        """Test PDF parser performance with large statements"""
        # Mock large PDF content
        mock_page = MagicMock()
        mock_text = "\n".join([
            f"2024-01-{i%28+1:02d}    Client {i} Payment    +{(i + 1) * 100}    {(i + 1) * 1000}"
            for i in range(500)
        ])
        mock_page.extract_text.return_value = mock_text
        
        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page] * 5  # 5 pages
        mock_pdf_open.return_value.__enter__.return_value = mock_pdf
        
        parser = PDFStatementParser()
        start_time = time.time()
        transactions = parser.parse("large.pdf")
        end_time = time.time()
        
        assert len(transactions) == 500
        assert (end_time - start_time) < 3.0  # Should complete within 3 seconds


class TestParserErrorHandling:
    """Comprehensive error handling tests for parsers"""
    
    def test_csv_parser_error_scenarios(self):
        """Test various CSV parsing error scenarios"""
        parser = CSVStatementParser()
        
        # Test missing required columns
        with pytest.raises(ValueError) as exc_info:
            csv_content = """Title,Type,Value
Jan 1,Payment,1000"""
            parser.parse(io.StringIO(csv_content))
        assert "required columns" in str(exc_info.value)
        
        # Test invalid numeric formats
        with pytest.raises(ValueError) as exc_info:
            csv_content = """Date,Description,Amount
2024-01-01,Payment,invalid_number"""
            parser.parse(io.StringIO(csv_content))
        assert "invalid amount format" in str(exc_info.value)
        
        # Test future date handling
        future_csv = """Date,Description,Amount
2030-01-01,Future Payment,1000"""
        transactions = parser.parse(io.StringIO(future_csv))
        assert transactions[0]["date"].year == 2030