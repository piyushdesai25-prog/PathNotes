-- =====================================================================
-- AI Banking Analytics Project
-- File: 05_views.sql
-- Purpose: Persist the most frequently used analytical queries as views
--          so BI tools / dashboards / the AI analytics layer can query
--          them directly without repeating complex joins.
-- =====================================================================

USE ai_banking_analytics;

-- ---------------------------------------------------------------------
-- View 1: vw_customer_summary
-- 360-degree view of each customer: balances, accounts, and segment
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_customer_summary AS
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.segment,
    c.kyc_status,
    c.credit_score,
    COUNT(DISTINCT a.account_id)  AS num_accounts,
    SUM(a.balance)                 AS total_balance,
    c.city,
    c.state
FROM customers c
LEFT JOIN accounts a ON a.customer_id = c.customer_id
GROUP BY c.customer_id, customer_name, c.segment, c.kyc_status,
         c.credit_score, c.city, c.state;

-- ---------------------------------------------------------------------
-- View 2: vw_monthly_transaction_summary
-- Monthly transaction volume/value trend, split by channel
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_monthly_transaction_summary AS
SELECT
    DATE_FORMAT(transaction_date, '%Y-%m') AS txn_month,
    channel,
    COUNT(*)             AS txn_count,
    SUM(amount)           AS total_amount,
    ROUND(AVG(amount), 2) AS avg_amount
FROM transactions
WHERE status = 'SUCCESS'
GROUP BY txn_month, channel;

-- ---------------------------------------------------------------------
-- View 3: vw_branch_performance
-- Deposits, account counts, and customer counts per branch
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_branch_performance AS
SELECT
    b.branch_id,
    b.branch_name,
    b.city,
    b.state,
    COUNT(DISTINCT a.customer_id) AS num_customers,
    COUNT(DISTINCT a.account_id)  AS num_accounts,
    SUM(a.balance)                 AS total_deposits
FROM branches b
LEFT JOIN accounts a ON a.branch_id = b.branch_id
GROUP BY b.branch_id, b.branch_name, b.city, b.state;

-- ---------------------------------------------------------------------
-- View 4: vw_fraud_dashboard
-- Consolidated fraud alert view with customer & transaction context,
-- ready to feed a real-time fraud monitoring dashboard
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_fraud_dashboard AS
SELECT
    fa.alert_id,
    fa.risk_score,
    fa.alert_type,
    fa.model_version,
    fa.status         AS alert_status,
    fa.created_at      AS alert_created_at,
    t.transaction_id,
    t.amount,
    t.channel,
    t.transaction_date,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.segment
FROM fraud_alerts fa
JOIN transactions t ON t.transaction_id = fa.transaction_id
JOIN accounts a      ON a.account_id = t.account_id
JOIN customers c      ON c.customer_id = a.customer_id;

-- ---------------------------------------------------------------------
-- View 5: vw_loan_portfolio
-- Loan book summary with borrower details, useful for credit risk
-- reporting and default-prediction model training data
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_loan_portfolio AS
SELECT
    l.loan_id,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.credit_score,
    l.loan_type,
    l.principal_amount,
    l.interest_rate,
    l.tenure_months,
    l.outstanding_amount,
    l.status           AS loan_status,
    b.branch_name
FROM loans l
JOIN customers c ON c.customer_id = l.customer_id
JOIN branches b   ON b.branch_id = l.branch_id;

-- ---------------------------------------------------------------------
-- View 6: vw_customer_rfm
-- Recency / Frequency / Monetary metrics per customer, used as
-- input features for the AI-driven customer segmentation model
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_customer_rfm AS
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name)       AS customer_name,
    DATEDIFF(CURDATE(), MAX(t.transaction_date))  AS recency_days,
    COUNT(t.transaction_id)                       AS frequency,
    SUM(t.amount)                                 AS monetary_value
FROM customers c
JOIN accounts a     ON a.customer_id = c.customer_id
JOIN transactions t ON t.account_id = a.account_id
WHERE t.status = 'SUCCESS'
GROUP BY c.customer_id, customer_name;

-- ---------------------------------------------------------------------
-- View 7: vw_dormant_accounts
-- Accounts with no recent activity — useful for churn-risk scoring
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dormant_accounts AS
SELECT
    a.account_id,
    a.account_number,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    a.status,
    MAX(t.transaction_date)                AS last_transaction_date,
    DATEDIFF(CURDATE(), MAX(t.transaction_date)) AS days_since_last_txn
FROM accounts a
JOIN customers c        ON c.customer_id = a.customer_id
LEFT JOIN transactions t ON t.account_id = a.account_id
GROUP BY a.account_id, a.account_number, c.customer_id, customer_name, a.status
HAVING last_transaction_date IS NULL OR days_since_last_txn > 90;

-- =====================================================================
-- Example usage:
--   SELECT * FROM vw_customer_summary ORDER BY total_balance DESC;
--   SELECT * FROM vw_fraud_dashboard WHERE alert_status = 'OPEN';
--   SELECT * FROM vw_loan_portfolio WHERE loan_status = 'DEFAULTED';
-- =====================================================================
-- End of 05_views.sql
-- =====================================================================
