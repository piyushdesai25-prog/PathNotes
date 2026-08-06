-- =====================================================================
-- AI Banking Analytics Project
-- File: 02_create_tables.sql
-- Purpose: Create all core tables for the banking analytics platform
-- =====================================================================

USE ai_banking_analytics;

-- ---------------------------------------------------------------------
-- 1. BRANCHES
-- ---------------------------------------------------------------------
CREATE TABLE branches (
    branch_id       INT AUTO_INCREMENT PRIMARY KEY,
    branch_name     VARCHAR(100) NOT NULL,
    ifsc_code       VARCHAR(15)  UNIQUE NOT NULL,
    city            VARCHAR(60)  NOT NULL,
    state           VARCHAR(60)  NOT NULL,
    opened_date     DATE         NOT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. EMPLOYEES
-- ---------------------------------------------------------------------
CREATE TABLE employees (
    employee_id     INT AUTO_INCREMENT PRIMARY KEY,
    branch_id       INT NOT NULL,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    role            VARCHAR(50) NOT NULL,     -- e.g. Manager, Teller, Loan Officer
    email           VARCHAR(100) UNIQUE,
    hire_date       DATE NOT NULL,
    status          ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    CONSTRAINT fk_employees_branch
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. CUSTOMERS
-- ---------------------------------------------------------------------
CREATE TABLE customers (
    customer_id     INT AUTO_INCREMENT PRIMARY KEY,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          ENUM('M','F','Other') NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    phone           VARCHAR(20)  UNIQUE NOT NULL,
    address         VARCHAR(150),
    city            VARCHAR(60),
    state           VARCHAR(60),
    occupation      VARCHAR(60),
    annual_income   DECIMAL(14,2),
    kyc_status      ENUM('VERIFIED','PENDING','REJECTED') DEFAULT 'PENDING',
    credit_score    INT,                      -- typical 300-900
    segment         ENUM('RETAIL','PREMIUM','CORPORATE','STUDENT') DEFAULT 'RETAIL',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 4. ACCOUNTS
-- ---------------------------------------------------------------------
CREATE TABLE accounts (
    account_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    branch_id       INT NOT NULL,
    account_number  VARCHAR(20) UNIQUE NOT NULL,
    account_type    ENUM('SAVINGS','CURRENT','FIXED_DEPOSIT','SALARY') NOT NULL,
    balance         DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    currency        VARCHAR(5) DEFAULT 'INR',
    status          ENUM('ACTIVE','DORMANT','CLOSED','FROZEN') DEFAULT 'ACTIVE',
    opened_date     DATE NOT NULL,
    closed_date     DATE NULL,
    CONSTRAINT fk_accounts_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_accounts_branch
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

-- ---------------------------------------------------------------------
-- 5. TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id          INT NOT NULL,
    transaction_type    ENUM('DEPOSIT','WITHDRAWAL','TRANSFER_IN','TRANSFER_OUT',
                              'BILL_PAYMENT','POS_PURCHASE','ATM_WITHDRAWAL') NOT NULL,
    amount              DECIMAL(14,2) NOT NULL,
    channel             ENUM('ATM','ONLINE','MOBILE_APP','BRANCH','POS','UPI') NOT NULL,
    merchant_name       VARCHAR(100) NULL,
    transaction_date    DATETIME NOT NULL,
    description         VARCHAR(255),
    status              ENUM('SUCCESS','FAILED','PENDING','FLAGGED') DEFAULT 'SUCCESS',
    balance_after        DECIMAL(14,2),
    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id) REFERENCES accounts(account_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 6. LOANS
-- ---------------------------------------------------------------------
CREATE TABLE loans (
    loan_id             INT AUTO_INCREMENT PRIMARY KEY,
    customer_id         INT NOT NULL,
    branch_id           INT NOT NULL,
    loan_type           ENUM('HOME','AUTO','PERSONAL','EDUCATION','BUSINESS') NOT NULL,
    principal_amount    DECIMAL(14,2) NOT NULL,
    interest_rate       DECIMAL(5,2) NOT NULL,     -- annual %
    tenure_months       INT NOT NULL,
    emi_amount          DECIMAL(12,2),
    disbursed_date      DATE NOT NULL,
    status              ENUM('ACTIVE','CLOSED','DEFAULTED','WRITTEN_OFF') DEFAULT 'ACTIVE',
    outstanding_amount  DECIMAL(14,2),
    CONSTRAINT fk_loans_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_loans_branch
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

-- ---------------------------------------------------------------------
-- 7. CARDS
-- ---------------------------------------------------------------------
CREATE TABLE cards (
    card_id             INT AUTO_INCREMENT PRIMARY KEY,
    customer_id         INT NOT NULL,
    account_id          INT NOT NULL,
    card_type           ENUM('DEBIT','CREDIT') NOT NULL,
    card_network        ENUM('VISA','MASTERCARD','RUPAY','AMEX') NOT NULL,
    card_number_masked  VARCHAR(20) NOT NULL,       -- e.g. **** **** **** 1234
    credit_limit        DECIMAL(12,2) NULL,
    issue_date          DATE NOT NULL,
    expiry_date         DATE NOT NULL,
    status              ENUM('ACTIVE','BLOCKED','EXPIRED') DEFAULT 'ACTIVE',
    CONSTRAINT fk_cards_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_cards_account
        FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);

-- ---------------------------------------------------------------------
-- 8. FRAUD_ALERTS  (AI/ML model output feeds into this table)
-- ---------------------------------------------------------------------
CREATE TABLE fraud_alerts (
    alert_id            INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id      BIGINT NOT NULL,
    risk_score          DECIMAL(5,2) NOT NULL,      -- 0.00 - 100.00 from ML model
    alert_type          ENUM('UNUSUAL_AMOUNT','VELOCITY_CHECK','LOCATION_MISMATCH',
                              'DEVICE_MISMATCH','KNOWN_FRAUD_PATTERN') NOT NULL,
    model_version       VARCHAR(20) DEFAULT 'v1.0',
    status              ENUM('OPEN','REVIEWING','CONFIRMED_FRAUD','FALSE_POSITIVE','CLOSED') DEFAULT 'OPEN',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at         TIMESTAMP NULL,
    CONSTRAINT fk_fraud_transaction
        FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 9. LOAN_PREDICTIONS  (ML model output: default risk / approval score)
-- ---------------------------------------------------------------------
CREATE TABLE loan_predictions (
    prediction_id            INT AUTO_INCREMENT PRIMARY KEY,
    loan_id                  INT NOT NULL,
    model_version            VARCHAR(20) DEFAULT 'v1.0',
    default_probability      DECIMAL(5,4) NOT NULL,     -- 0.0000 - 1.0000
    predicted_risk_band      ENUM('LOW','MEDIUM','HIGH','VERY_HIGH') NOT NULL,
    approval_recommendation  ENUM('APPROVE','REVIEW','REJECT') NOT NULL,
    prediction_date          DATETIME NOT NULL,
    actual_outcome           ENUM('REPAID','DEFAULTED','ACTIVE','UNKNOWN') DEFAULT 'UNKNOWN',
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loan_predictions_loan
        FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 10. CUSTOMER_SEGMENTS  (ML-derived clustering / segmentation output)
-- ---------------------------------------------------------------------
CREATE TABLE customer_segments (
    segment_record_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id            INT NOT NULL,
    model_version           VARCHAR(20) DEFAULT 'v1.0',
    segment_label           ENUM('HIGH_VALUE','LOYAL','AT_RISK','DORMANT_LIKELY',
                                  'PRICE_SENSITIVE','NEW_CUSTOMER') NOT NULL,
    cluster_id              INT,
    lifetime_value_score    DECIMAL(12,2),
    churn_probability       DECIMAL(5,4),             -- 0.0000 - 1.0000
    computed_date           DATE NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_segments_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 11. CREDIT_SCORES  (historical / model-generated credit score log)
-- ---------------------------------------------------------------------
CREATE TABLE credit_scores (
    score_id             INT AUTO_INCREMENT PRIMARY KEY,
    customer_id           INT NOT NULL,
    score_value            INT NOT NULL,               -- typical 300-900
    score_source            ENUM('BUREAU','INTERNAL_MODEL') DEFAULT 'INTERNAL_MODEL',
    model_version           VARCHAR(20) DEFAULT 'v1.0',
    risk_category            ENUM('POOR','FAIR','GOOD','VERY_GOOD','EXCELLENT') NOT NULL,
    score_date               DATE NOT NULL,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_credit_scores_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Helpful indexes for analytics performance
-- ---------------------------------------------------------------------
CREATE INDEX idx_transactions_account_date ON transactions(account_id, transaction_date);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_accounts_customer ON accounts(customer_id);
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_fraud_status ON fraud_alerts(status);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_loan_predictions_loan ON loan_predictions(loan_id);
CREATE INDEX idx_loan_predictions_risk ON loan_predictions(predicted_risk_band);
CREATE INDEX idx_customer_segments_customer ON customer_segments(customer_id);
CREATE INDEX idx_customer_segments_label ON customer_segments(segment_label);
CREATE INDEX idx_credit_scores_customer ON credit_scores(customer_id);
CREATE INDEX idx_credit_scores_date ON credit_scores(score_date);

-- =====================================================================
-- End of 02_create_tables.sql
-- Next: run 03_insert_sample_data.sql
-- =====================================================================
