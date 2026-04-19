import pytest
from datetime import datetime, timedelta, date
from decimal import Decimal
from unittest.mock import Mock, patch
import json

from app.services.income_report_service import IncomeReportService
from app.models.income_report import IncomeReport
from app.models.bank_statement import BankStatement
from app.models.stripe_connection import StripeConnection
from app.models.user import User


class TestIncomeReportCalculations:
    """Test income report calculation accuracy"""
    
    def setup_method(self):
        self.service = IncomeReportService()
    
    def test_simple_income_calculation(self):
        """Test basic monthly income calculation"""
        transactions = [
            {"date": datetime(2024, 1, 15), "amount": 2500.00, "description": "Client payment"},
            {"date": datetime(2024, 1, 20), "amount": 1200.00, "description": "Upwork withdrawal"},
            {"date": datetime(2024, 1, 25), "amount": 3400.00, "description": "Stripe payout"},
        ]
        
        report = self.service.calculate_monthly_income(2024, 1, transactions)
        
        assert report.total_income == 7100.00
        assert report.transaction_count == 3
        assert report.average_transaction == 2366.67
        assert report.median_transaction == 2500.00
    
    def test_income_with_negative_amounts(self):
        """Test calculation with chargebacks/refunds"""
        transactions = [
            {"date": datetime(2024, 1, 1), "amount": 5000.00, "description": "Client A"},
            {"date": datetime(2024, 1, 5), "amount": 3000.00, "description": "Client B"},
            {"date": datetime(2024, 1, 10), "amount": -500.00, "description": "Refund to customer"},
            {"date": datetime(2024, 1, 15), "amount": 4500.00, "description": "Client C"},
        ]
        
        report = self.service.calculate_monthly_income(2024, 1, transactions)
        
        assert report.total_income == 12000.00  # Sum of positive amounts
        assert report.total_refunds == 500.00
        assert report.net_income == 11500.00
    
    def test_rolling_3_month_average(self):
        """Test 3-month rolling average calculation"""
        monthly_data = {
            2024: {
                1: [1000, 2000, 3000],  # 6000 total
                2: [1500, 2500, 3500],  # 7500 total
                3: [2000, 3000, 4000],  # 9000 total
            }
        }
        
        three_month_avg = self.service.calculate_rolling_3_month_average(
            datetime(2024, 3, 1), monthly_data
        )
        
        expected_avg = (6000 + 7500 + 9000) / 3  # 7500.00
        assert three_month_avg == expected_avg
    
    def test_yearly_income_calculation(self):
        """Test yearly income calculation from multiple months"""
        yearly_data = [
            {"date": datetime(2024, 1, 15), "amount": 2500},
            {"date": datetime(2024, 1, 25), "amount": 3000},
            {"date": datetime(2024, 2, 10), "amount": 2200},
            {"date": datetime(2024, 2, 20), "amount": 2800},
            {"date": datetime(2024, 3, 5), "amount": 3500},
            {"date": datetime(2024, 12, 15), "amount": 4000},
        ]
        
        report = self.service.calculate_yearly_income(2024, yearly_data)
        
        assert report.total_income == 18000.00
        assert len([m for m in report.monthly_breakdown if m.income > 0]) == 4
    
    def test_income_consistency_verification(self):
        """Test calculations with various payment patterns"""
        # Simulate consistent freelance income
        consistent_transactions = []
        for month in range(1, 4):  # 3 months
            for day in [5, 15, 25]:  # 3 payments per month
                consistent_transactions.append({
                    "date": datetime(2024, month, day),
                    "amount": 2000.00,
                    "description": f"Client payment - Month {month}"
                })
        
        report = self.service.calculate_income_report(consistent_transactions)
        
        assert report.consistent_income is True
        assert report.monthly_variance < 100  # Very low variance
        assert report.payment_frequency == "weekly"  # 3x per month ≈ weekly
    
    def test_irregular_income_detection(self):
        """Test detection of irregular income patterns"""
        irregular_data = [
            {"date": datetime(2024, 1, 1), "amount": 10000.00},  # Large one-time
            {"date": datetime(2024, 3, 15), "amount": 500.00},     # Small follow-up
            {"date": datetime(2024, 6, 1), "amount": 8000.00},   # Another large
        ]
        
        report = self.service.calculate_income_report(irregular_data)
        
        assert report.consistent_income is False
        assert report.monthly_variance > 1000
        assert report.payment_frequency == "irregular"
    
    def test_mixed_income_sources_calculation(self):
        """Test calculation with multiple income sources"""
        mixed_transactions = [
            {"amount": 2000, "description": "Upwork payment", "date": datetime(2024, 1, 5)},
            {"amount": 3500, "description": "Direct client payment", "date": datetime(2024, 1, 10)},
            {"amount": 1200, "description": "Fiverr withdrawal", "date": datetime(2024, 1, 15)},
            {"amount": 4000, "description": "Gumroad sales", "date": datetime(2024, 1, 20)},
        ]
        
        report = self.service.calculate_income_source_breakdown(mixed_transactions)
        
        assert len(report.income_sources) == 4
        assert report.source_totals["Upwork payment"] == 2000
        assert report.source_totals["Direct client payment"] == 3500
        assert report.total_income == 10700.00
    
    def test_tax_quarterly_breakdown(self):
        """Test quarterly tax calculation breakdown"""
        quarterly_data = [
            # Q1 2024
            {"date": datetime(2024, 1, 15), "amount": 3000},
            {"date": datetime(2024, 2, 15), "amount": 2500},
            {"date": datetime(2024, 3, 15), "amount": 2800},
            # Q2 2024
            {"date": datetime(2024, 4, 15), "amount": 3200},
            {"date": datetime(2024, 5, 15), "amount": 2700},
            {"date": datetime(2024, 6, 15), "amount": 2900},
        ]
        
        report = self.service.calculate_quarterly_breakdown(quarterly_data)
        
        assert len(report.quarters) == 2
        assert report.quarters[0].total == 8300.00  # Q1
        assert report.quarters[1].total == 8800.00  # Q2
        assert report.annual_total == 17100.00


class TestAdvancedReportFeatures:
    """Test advanced report features and accuracy"""
    
    def test_profit_margin_calculation(self):
        """Test profit margin from Stripe + bank data"""
        stripe_data = [
            {"date": datetime(2024, 1, 1), "gross_amount": 5000, "fees": 175},
            {"date": datetime(2024, 1, 15), "gross_amount": 3000, "fees": 105},
        ]
        
        bank_data = [
            {"date": datetime(2024, 1, 2), "amount": 4825},  # 5000 - 175
            {"date": datetime(2024, 1, 16), "amount": 2895},  # 3000 - 105
        ]
        
        report = self.service.calculate_profit_margin_analysis(stripe_data, bank_data)
        
        assert report.total_fees == 280.00
        assert report.net_income == 7420.00
        assert report.profit_margin > 94  # 7420/7700 ≈ 96.36%
    
    def test_income_trend_analysis(self):
        """Test income trend identification"""
        trend_data = [
            {"date": datetime(2024, 1, 1), "amount": 1000},
            {"date": datetime(2024, 1, 15), "amount": 1200},
            {"date": datetime(2024, 2, 1), "amount": 1500},
            {"date": datetime(2024, 2, 15), "amount": 1800},
            {"date": datetime(2024, 3, 1), "amount": 2200},
            {"date": datetime(2024, 3, 15), "amount": 2500},
        ]
        
        report = self.service.analyze_income_trend(trend_data)
        
        assert report.trend_direction == "increasing"
        assert report.monthly_growth_rate > 15  # >15% monthly growth
        assert report.predicted_next_month > 2600  # Trend-based prediction
    
    def test_minimum_income_threshold_detection(self):
        """Test detecting minimum consistent income levels"""
        # Simulate user trying to establish minimum income for loan verification
        threshold_data = [
            {"date": datetime(2024, 1, 1), "amount": 3500},
            {"date": datetime(2024, 1, 15), "amount": 3800},
            {"date": datetime(2024, 2, 1), "amount": 4200},
            {"date": datetime(2024, 2, 15), "amount": 3900},
            {"date": datetime(2024, 3, 1), "amount": 3600},
        ]
        
        report = self.service.calculate_min_guaranteed_income(threshold_data)
        
        assert report.min_consistent_income == 3500.00
        assert report.reliability_score > 80  # High consistency score
        assert report.recommended_minimum == 3500.00
    
    def test_peak_income_month_identification(self):
        """Test identifying peak earning months"""
        yearly_transactions = []
        # Create monthly varying amounts
        for month in range(1, 13):
            base_amount = 2000 + (month * 100)  # Increasing trend
            if month in [11, 12]:  # Holiday boost
                base_amount *= 1.5
            
            for _ in range(3):  # 3 payments per month
                yearly_transactions.append({
                    "date": datetime(2024, month, 10),
                    "amount": base_amount
                })
        
        report = self.service.identify_peak_income_months(yearly_transactions)
        
        assert 12 in report.peak_months  # December should be high
        assert report.year_total == sum(t["amount"] for t in yearly_transactions)
        assert report.highest_month_amount > 3000  # December peak


class TestReportDataValidation:
    """Report calculation validation and edge cases"""
    
    def test_precise_decimal_calculations(self):
        """Test exact decimal calculations"""
        transactions = [
            {"date": datetime(2024, 1, 1), "amount": 1234.56},
            {"date": datetime(2024, 1, 15), "amount": 567.89},
            {"date": datetime(2024, 1, 30), "amount": 999.99},
        ]
        
        report = self.service.calculate_precise_income(transactions)
        
        # Test exact decimal math
        assert str(report.total_income) == "2802.44"  # Exact: 1234.56 + 567.89 + 999.99
        assert str(report.average_transaction) == "934.146666"
    
    def test_zero_transaction_handling(self):
        """Test handling of zero-amount transactions"""
        transactions = [
            {"date": datetime(2024, 1, 1), "amount": 1000.00},
            {"date": datetime(2024, 1, 15), "amount": 0.00},  # Zero amount
            {"date": datetime(2024, 1, 20), "amount": 2000.00},
        ]
        
        report = self.service.calculate_income_report(transactions)
        
        assert report.total_income == 3000.00  # Should skip zero amounts
        assert report.zero_amount_count == 1
        assert report.transaction_count == 2  # Only non-zero included
    
    def test_future_date_rejection(self):
        """Test rejection of future-dated transactions"""
        future_date = datetime.now() + timedelta(days=30)
        transactions = [
            {"date": datetime(2024, 1, 1), "amount": 1000.00},
            {"date": future_date, "amount": 2000.00},  # Future transaction
        ]
        
        report = self.service.calculate_income_report(transactions)
        
        assert report.transaction_count == 1
        assert "invalid_future_dates" in report.warnings
    
    def test_duplicate_transaction_detection(self):
        """Test detection of duplicate/transactions"""
        transactions = [
            {"date": datetime(2024, 1, 1), "amount": 1000.00, "description": "Payment A"},
            {"date": datetime(2024, 1, 1), "amount": 1000.00, "description": "Payment A"},  # Duplicate
            {"date": datetime(2024, 1, 2), "amount": 1500.00, "description": "Payment B"},
        ]
        
        report = self.service.calculate_income_report(transactions)
        
        assert report.total_income == 2500.00  # 1000 + 1500, no duplicate
        assert report.duplicate_transaction_count == 1


class TestReportPerformance:
    """Performance tests for report generation"""
    
    def test_large_dataset_performance(self):
        """Test performance with 1000+ transactions"""
        large_dataset = []
        for i in range(1000):
            large_dataset.append({
                "date": datetime(2024, 1 + (i % 12), 1 + (i % 28)),
                "amount": 1000 + (i % 5000)
            })
        
        start_time = time.time()
        report = self.service.calculate_income_report(large_dataset)
        end_time = time.time()
        
        assert report.transaction_count >= 1000
        assert report.total_income > 0
        assert (end_time - start_time) < 3.0  # Should complete within 3 seconds
    
    def test_concurrent_report_generation(self):
        """Test concurrent report generation for multiple users"""
        def generate_sample_transactions(user_id):
            return [
                {"date": datetime(2024, 1, 1), "amount": 1000 + (user_id * 100)},
                {"date": datetime(2024, 1, 15), "amount": 2000 + (user_id * 100)},
            ]
        
        # Simulate concurrent processing
        reports = []
        for user_id in range(5):
            transactions = generate_sample_transactions(user_id)
            report = self.service.calculate_income_report(transactions)
            reports.append(report)
        
        assert len(reports) == 5
        assert all(r.total_income == (3000 + (i * 200)) for i, r in enumerate(reports))