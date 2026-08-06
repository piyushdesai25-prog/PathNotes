-- =====================================================================
-- AI Banking Analytics Project
-- File: 04_queries.sql
-- Purpose: Analytical / reporting queries commonly needed for an
--          AI-powered banking analytics dashboard (customer insights,
--          transaction trends, fraud detection support, loan risk, etc.)
-- =====================================================================

USE ai_banking_analytics;

-- ---------------------------------------------------------------------
-- 1. Total balance held per customer (across all active accounts)
-- ---------------------------------------------------------------------
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.segment,
    COUNT(a.account_id)      AS num_accounts,
    SUM(a.balance)            AS total_balance
FROM customers c
JOIN accounts a ON a.customer_id = c.customer_id
WHERE a.status = 'ACTIVE'
GROUP BY c.customer_id, customer_name, c.segment
ORDER BY total_balance DESC;

-- ---------------------------------------------------------------------
-- 2. Top 10 highest-value customers (by total balance)
-- ---------------------------------------------------------------------
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    SUM(a.balance) AS total_balance
FROM customers c
JOIN accounts a ON a.customer_id = c.customer_id
GROUP BY c.customer_id, customer_name
ORDER BY total_balance DESC
LIMIT 10;

-- ---------------------------------------------------------------------
-- 3. Monthly transaction volume and value trend
-- ---------------------------------------------------------------------
SELECT
    DATE_FORMAT(transaction_date, '%Y-%m') AS txn_month,
    COUNT(*)                                AS txn_count,
    SUM(amount)                             AS total_amount,
    ROUND(AVG(amount), 2)                   AS avg_amount
FROM transactions
WHERE status = 'SUCCESS'
GROUP BY txn_month
ORDER BY txn_month;

-- ---------------------------------------------------------------------
-- 4. Transaction breakdown by channel (ATM, Online, Mobile, POS, Branch)
-- ---------------------------------------------------------------------
SELECT
    channel,
    COUNT(*)              AS txn_count,
    SUM(amount)            AS total_amount,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM transactions), 2) AS pct_of_total
FROM transactions
GROUP BY channel
ORDER BY txn_count DESC;

-- ---------------------------------------------------------------------
-- 5. Flagged / suspicious transactions with customer & fraud alert detail
--    (core input for the fraud detection dashboard)
-- ---------------------------------------------------------------------
SELECT
    t.transaction_id,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    t.amount,
    t.channel,
    t.transaction_date,
    t.status              AS transaction_status,
    fa.risk_score,
    fa.alert_type,
    fa.status              AS alert_status
FROM transactions t
JOIN accounts a          ON a.account_id = t.account_id
JOIN customers c          ON c.customer_id = a.customer_id
LEFT JOIN fraud_alerts fa ON fa.transaction_id = t.transaction_id
WHERE t.status = 'FLAGGED'
ORDER BY fa.risk_score DESC;

-- ---------------------------------------------------------------------
-- 6. Customers with unusually large transactions relative to their
--    own historical average (simple anomaly-detection style query)
-- ---------------------------------------------------------------------
WITH customer_avg AS (
    SELECT
        a.customer_id,
        AVG(t.amount)  AS avg_txn_amount,
        STDDEV(t.amount) AS stddev_txn_amount
    FROM transactions t
    JOIN accounts a ON a.account_id = t.account_id
    WHERE t.status = 'SUCCESS'
    GROUP BY a.customer_id
)
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    t.transaction_id,
    t.amount,
    ca.avg_txn_amount,
    ROUND((t.amount - ca.avg_txn_amount) / NULLIF(ca.stddev_txn_amount, 0), 2) AS z_score
FROM transactions t
JOIN accounts a       ON a.account_id = t.account_id
JOIN customers c       ON c.customer_id = a.customer_id
JOIN customer_avg ca   ON ca.customer_id = a.customer_id
WHERE ca.stddev_txn_amount IS NOT NULL
  AND (t.amount - ca.avg_txn_amount) / NULLIF(ca.stddev_txn_amount, 0) > 2
ORDER BY z_score DESC;

-- ---------------------------------------------------------------------
-- 7. Loan portfolio risk summary by loan type
-- ---------------------------------------------------------------------
SELECT
    loan_type,
    COUNT(*)                                        AS num_loans,
    SUM(principal_amount)                            AS total_disbursed,
    SUM(outstanding_amount)                          AS total_outstanding,
    SUM(CASE WHEN status = 'DEFAULTED' THEN 1 ELSE 0 END) AS defaulted_count,
    ROUND(100.0 * SUM(CASE WHEN status = 'DEFAULTED' THEN 1 ELSE 0 END) / COUNT(*), 2) AS default_rate_pct
FROM loans
GROUP BY loan_type
ORDER BY total_outstanding DESC;

-- ---------------------------------------------------------------------
-- 8. Customers with low credit score AND an active loan
--    (candidate list for credit-risk monitoring)
-- ---------------------------------------------------------------------
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.credit_score,
    l.loan_id,
    l.loan_type,
    l.outstanding_amount,
    l.status
FROM customers c
JOIN loans l ON l.customer_id = c.customer_id
WHERE c.credit_score < 700
  AND l.status = 'ACTIVE'
ORDER BY c.credit_score ASC;

-- ---------------------------------------------------------------------
-- 9. Branch performance: deposits, withdrawals, and customer count
-- ---------------------------------------------------------------------
SELECT
    b.branch_id,
    b.branch_name,
    b.city,
    COUNT(DISTINCT a.customer_id)  AS num_customers,
    COUNT(DISTINCT a.account_id)   AS num_accounts,
    SUM(a.balance)                  AS total_deposits
FROM branches b
JOIN accounts a ON a.branch_id = b.branch_id
GROUP BY b.branch_id, b.branch_name, b.city
ORDER BY total_deposits DESC;

-- ---------------------------------------------------------------------
-- 10. Dormant / low-activity accounts (no transactions in last 90 days)
--     Useful for churn-prediction feature engineering
-- ---------------------------------------------------------------------
SELECT
    a.account_id,
    a.account_number,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    a.status,
    MAX(t.transaction_date) AS last_transaction_date,
    DATEDIFF(CURDATE(), MAX(t.transaction_date)) AS days_since_last_txn
FROM accounts a
JOIN customers c      ON c.customer_id = a.customer_id
LEFT JOIN transactions t ON t.account_id = a.account_id
GROUP BY a.account_id, a.account_number, c.customer_id, customer_name, a.status
HAVING last_transaction_date IS NULL
    OR days_since_last_txn > 90
ORDER BY days_since_last_txn DESC;

-- ---------------------------------------------------------------------
-- 11. Simple customer segmentation (RFM-style):
--     Recency (days since last txn), Frequency (txn count),
--     Monetary (total spend) — feeds a clustering / scoring ML model
-- ---------------------------------------------------------------------
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name)   AS customer_name,
    DATEDIFF(CURDATE(), MAX(t.transaction_date)) AS recency_days,
    COUNT(t.transaction_id)                   AS frequency,
    SUM(t.amount)                             AS monetary_value
FROM customers c
JOIN accounts a       ON a.customer_id = c.customer_id
JOIN transactions t   ON t.account_id = a.account_id
WHERE t.status = 'SUCCESS'
GROUP BY c.customer_id, customer_name
ORDER BY monetary_value DESC;

-- ---------------------------------------------------------------------
-- 12. Credit card utilization (spend vs credit limit) per customer
-- ---------------------------------------------------------------------
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    cd.card_id,
    cd.credit_limit,
    COALESCE(SUM(t.amount), 0)              AS total_spend,
    ROUND(100.0 * COALESCE(SUM(t.amount), 0) / NULLIF(cd.credit_limit, 0), 2) AS utilization_pct
FROM cards cd
JOIN customers c   ON c.customer_id = cd.customer_id
LEFT JOIN transactions t ON t.account_id = cd.account_id AND t.transaction_type = 'POS_PURCHASE'
WHERE cd.card_type = 'CREDIT'
GROUP BY c.customer_id, customer_name, cd.card_id, cd.credit_limit
ORDER BY utilization_pct DESC;

-- ---------------------------------------------------------------------
-- 13. New customer acquisition trend (KYC-verified customers by month)
-- ---------------------------------------------------------------------
SELECT
    DATE_FORMAT(created_at, '%Y-%m') AS signup_month,
    COUNT(*)                          AS new_customers,
    SUM(CASE WHEN kyc_status = 'VERIFIED' THEN 1 ELSE 0 END) AS verified_customers
FROM customers
GROUP BY signup_month
ORDER BY signup_month;

-- ---------------------------------------------------------------------
-- 14. Average account balance and transaction count by customer segment
-- ---------------------------------------------------------------------
SELECT
    c.segment,
    COUNT(DISTINCT c.customer_id)  AS num_customers,
    ROUND(AVG(a.balance), 2)        AS avg_balance,
    COUNT(t.transaction_id)         AS total_transactions
FROM customers c
JOIN accounts a     ON a.customer_id = c.customer_id
LEFT JOIN transactions t ON t.account_id = a.account_id
GROUP BY c.segment
ORDER BY avg_balance DESC;

-- ---------------------------------------------------------------------
-- 15. High-risk open fraud alerts requiring immediate review
-- ---------------------------------------------------------------------
SELECT
    fa.alert_id,
    fa.transaction_id,
    fa.risk_score,
    fa.alert_type,
    fa.status,
    fa.created_at,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    t.amount,
    t.channel
FROM fraud_alerts fa
JOIN transactions t ON t.transaction_id = fa.transaction_id
JOIN accounts a      ON a.account_id = t.account_id
JOIN customers c      ON c.customer_id = a.customer_id
WHERE fa.status = 'OPEN'
  AND fa.risk_score >= 80
ORDER BY fa.risk_score DESC;

-- =====================================================================
-- End of 04_queries.sql
-- Next: run 05_views.sql to persist commonly-used queries as views
-- =====================================================================
