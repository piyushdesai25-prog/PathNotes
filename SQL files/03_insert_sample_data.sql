-- =====================================================================
-- AI Banking Analytics Project
-- File: 03_insert_sample_data.sql
-- Purpose: Populate tables with representative sample data for testing
--          analytics queries, dashboards, and ML feature pipelines.
-- =====================================================================

USE ai_banking_analytics;

-- ---------------------------------------------------------------------
-- BRANCHES
-- ---------------------------------------------------------------------
INSERT INTO branches (branch_name, ifsc_code, city, state, opened_date) VALUES
('Pune Camp Branch',      'AIBK0001001', 'Pune',      'Maharashtra', '2010-04-01'),
('Mumbai Fort Branch',    'AIBK0001002', 'Mumbai',    'Maharashtra', '2008-06-15'),
('Bengaluru MG Road',     'AIBK0001003', 'Bengaluru', 'Karnataka',   '2012-01-20'),
('Delhi Connaught Place', 'AIBK0001004', 'Delhi',     'Delhi',       '2011-09-10'),
('Hyderabad Banjara Hills','AIBK0001005','Hyderabad', 'Telangana',   '2015-03-05');

-- ---------------------------------------------------------------------
-- EMPLOYEES
-- ---------------------------------------------------------------------
INSERT INTO employees (branch_id, first_name, last_name, role, email, hire_date, status) VALUES
(1, 'Aarav',   'Sharma',  'Branch Manager', 'aarav.sharma@aibank.com',  '2011-05-01', 'ACTIVE'),
(1, 'Priya',   'Nair',    'Teller',         'priya.nair@aibank.com',    '2016-07-12', 'ACTIVE'),
(2, 'Rohan',   'Mehta',   'Loan Officer',   'rohan.mehta@aibank.com',   '2013-03-22', 'ACTIVE'),
(2, 'Sneha',   'Iyer',    'Branch Manager', 'sneha.iyer@aibank.com',    '2009-11-10', 'ACTIVE'),
(3, 'Kabir',   'Reddy',   'Teller',         'kabir.reddy@aibank.com',   '2018-01-15', 'ACTIVE'),
(4, 'Ananya',  'Kapoor',  'Loan Officer',   'ananya.kapoor@aibank.com', '2014-08-19', 'ACTIVE'),
(5, 'Vivaan',  'Rao',     'Branch Manager', 'vivaan.rao@aibank.com',    '2015-04-02', 'ACTIVE');

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------
INSERT INTO customers
(first_name, last_name, date_of_birth, gender, email, phone, address, city, state,
 occupation, annual_income, kyc_status, credit_score, segment) VALUES
('Rahul',   'Verma',    '1985-02-14', 'M', 'rahul.verma@mail.com',    '9800000001', '12 MG Road',        'Pune',      'Maharashtra', 'Software Engineer', 1450000.00, 'VERIFIED', 782, 'PREMIUM'),
('Sara',    'Khan',     '1992-07-30', 'F', 'sara.khan@mail.com',      '9800000002', '45 Park Street',    'Mumbai',    'Maharashtra', 'Doctor',            2100000.00, 'VERIFIED', 810, 'PREMIUM'),
('Aditya',  'Singh',    '1998-11-05', 'M', 'aditya.singh@mail.com',   '9800000003', '9 Lake View',       'Bengaluru', 'Karnataka',   'Student',             80000.00, 'VERIFIED', 640, 'STUDENT'),
('Neha',    'Joshi',    '1989-03-21', 'F', 'neha.joshi@mail.com',     '9800000004', '78 Green Avenue',   'Delhi',     'Delhi',       'Marketing Manager', 980000.00, 'VERIFIED', 705, 'RETAIL'),
('Vikram',  'Chopra',   '1975-09-17', 'M', 'vikram.chopra@mail.com',  '9800000005', '22 Hill Road',      'Hyderabad', 'Telangana',   'Business Owner',   5200000.00, 'VERIFIED', 760, 'CORPORATE'),
('Isha',    'Malhotra', '1995-05-09', 'F', 'isha.malhotra@mail.com',  '9800000006', '5 River Side',      'Pune',      'Maharashtra', 'Analyst',           650000.00, 'VERIFIED', 690, 'RETAIL'),
('Karan',   'Gupta',    '1988-12-25', 'M', 'karan.gupta@mail.com',    '9800000007', '31 Sunrise Colony', 'Mumbai',    'Maharashtra', 'Chartered Accountant',1650000.00,'VERIFIED', 745, 'PREMIUM'),
('Divya',   'Menon',    '2000-01-18', 'F', 'divya.menon@mail.com',    '9800000008', '14 College Road',  'Bengaluru', 'Karnataka',   'Student',             40000.00, 'PENDING',  600, 'STUDENT'),
('Arjun',   'Patel',    '1980-06-02', 'M', 'arjun.patel@mail.com',    '9800000009', '2 Textile Market',  'Delhi',     'Delhi',       'Trader',           3100000.00, 'VERIFIED', 700, 'CORPORATE'),
('Meera',   'Iyer',     '1993-10-11', 'F', 'meera.iyer@mail.com',     '9800000010', '19 Palm Grove',     'Hyderabad', 'Telangana',   'Teacher',           520000.00, 'VERIFIED', 670, 'RETAIL'),
('Yash',    'Kulkarni', '1997-08-08', 'M', 'yash.kulkarni@mail.com',  '9800000011', '8 Station Road',    'Pune',      'Maharashtra', 'Data Scientist',   1250000.00, 'VERIFIED', 720, 'PREMIUM'),
('Pooja',   'Desai',    '1991-04-27', 'F', 'pooja.desai@mail.com',    '9800000012', '55 Marine Drive',   'Mumbai',    'Maharashtra', 'HR Manager',        890000.00, 'VERIFIED', 715, 'RETAIL'),
('Rohit',   'Bhatt',    '1984-01-30', 'M', 'rohit.bhatt@mail.com',    '9800000013', '3 Silicon Avenue',  'Bengaluru', 'Karnataka',   'Product Manager',  1750000.00, 'VERIFIED', 735, 'PREMIUM'),
('Anjali',  'Saxena',   '1999-02-19', 'F', 'anjali.saxena@mail.com',  '9800000014', '67 Karol Bagh',     'Delhi',     'Delhi',       'Freelancer',        310000.00, 'PENDING',  610, 'RETAIL'),
('Suresh',  'Naidu',    '1970-12-03', 'M', 'suresh.naidu@mail.com',   '9800000015', '11 Jubilee Hills',  'Hyderabad', 'Telangana',   'Retired',           600000.00, 'VERIFIED', 690, 'RETAIL');

-- ---------------------------------------------------------------------
-- ACCOUNTS
-- ---------------------------------------------------------------------
INSERT INTO accounts (customer_id, branch_id, account_number, account_type, balance, status, opened_date) VALUES
(1, 1, 'AC10000001', 'SAVINGS',       185000.50, 'ACTIVE', '2015-06-10'),
(1, 1, 'AC10000002', 'FIXED_DEPOSIT', 500000.00, 'ACTIVE', '2020-01-15'),
(2, 2, 'AC10000003', 'SAVINGS',       420000.75, 'ACTIVE', '2016-03-22'),
(3, 3, 'AC10000004', 'SAVINGS',        15500.00, 'ACTIVE', '2019-08-01'),
(4, 4, 'AC10000005', 'CURRENT',        75200.00, 'ACTIVE', '2014-11-05'),
(5, 5, 'AC10000006', 'CURRENT',      1250000.00, 'ACTIVE', '2012-02-18'),
(5, 5, 'AC10000007', 'SAVINGS',       320000.00, 'ACTIVE', '2012-02-18'),
(6, 1, 'AC10000008', 'SAVINGS',        62000.00, 'ACTIVE', '2018-05-19'),
(7, 2, 'AC10000009', 'SAVINGS',       210000.00, 'ACTIVE', '2013-09-09'),
(8, 3, 'AC10000010', 'SAVINGS',         8200.00, 'DORMANT','2021-01-11'),
(9, 4, 'AC10000011', 'CURRENT',       890000.00, 'ACTIVE', '2011-07-03'),
(10,5, 'AC10000012', 'SAVINGS',        45000.00, 'ACTIVE', '2017-10-25'),
(11,1, 'AC10000013', 'SAVINGS',       130000.00, 'ACTIVE', '2019-02-14'),
(12,2, 'AC10000014', 'SALARY',         38000.00, 'ACTIVE', '2020-06-01'),
(13,3, 'AC10000015', 'SAVINGS',       275000.00, 'ACTIVE', '2016-12-12'),
(14,4, 'AC10000016', 'SAVINGS',        12000.00, 'ACTIVE', '2022-03-03'),
(15,5, 'AC10000017', 'SAVINGS',       410000.00, 'ACTIVE', '2010-08-08'),
(3, 3, 'AC10000018', 'SAVINGS',         2000.00, 'CLOSED', '2019-01-01');

-- ---------------------------------------------------------------------
-- TRANSACTIONS
-- ---------------------------------------------------------------------
INSERT INTO transactions
(account_id, transaction_type, amount, channel, merchant_name, transaction_date, description, status, balance_after) VALUES
(1, 'DEPOSIT',         50000.00, 'BRANCH',      NULL,             '2026-06-01 09:15:00', 'Salary credit',        'SUCCESS', 185000.50),
(1, 'ATM_WITHDRAWAL',   5000.00, 'ATM',         NULL,             '2026-06-03 18:20:00', 'Cash withdrawal',      'SUCCESS', 180000.50),
(1, 'POS_PURCHASE',     3200.00, 'POS',         'Big Bazaar',     '2026-06-05 12:40:00', 'Grocery shopping',     'SUCCESS', 176800.50),
(3, 'DEPOSIT',        120000.00, 'ONLINE',      NULL,             '2026-06-02 10:05:00', 'Client payment',       'SUCCESS', 420000.75),
(3, 'TRANSFER_OUT',    25000.00, 'MOBILE_APP',  NULL,             '2026-06-06 20:10:00', 'Transfer to family',   'SUCCESS', 395000.75),
(4, 'DEPOSIT',         10000.00, 'BRANCH',      NULL,             '2026-06-01 11:00:00', 'Pocket money deposit', 'SUCCESS', 15500.00),
(4, 'POS_PURCHASE',     1200.00, 'POS',         'Campus Cafe',    '2026-06-07 13:15:00', 'Food court',           'SUCCESS', 14300.00),
(5, 'BILL_PAYMENT',    18000.00, 'ONLINE',      'Electricity Board','2026-06-04 09:00:00','Utility bill',        'SUCCESS', 75200.00),
(6, 'TRANSFER_IN',    300000.00, 'BRANCH',      NULL,             '2026-06-01 15:00:00', 'Business inflow',      'SUCCESS', 1250000.00),
(6, 'TRANSFER_OUT',   150000.00, 'ONLINE',      NULL,             '2026-06-08 17:45:00', 'Vendor payment',       'SUCCESS', 1100000.00),
(7, 'ATM_WITHDRAWAL',  20000.00, 'ATM',         NULL,             '2026-06-09 08:30:00', 'Cash withdrawal',      'SUCCESS', 300000.00),
(8, 'POS_PURCHASE',     4500.00, 'POS',         'Reliance Trends','2026-06-02 16:20:00', 'Clothing purchase',    'SUCCESS', 62000.00),
(9, 'DEPOSIT',         45000.00, 'BRANCH',      NULL,             '2026-06-03 09:40:00', 'Consulting fee',       'SUCCESS', 210000.00),
(9, 'TRANSFER_OUT',   200000.00, 'ONLINE',      NULL,             '2026-06-15 23:58:00', 'Unusual late transfer','FLAGGED', 10000.00),
(10,'ATM_WITHDRAWAL',   1000.00, 'ATM',         NULL,             '2026-06-05 10:10:00', 'Cash withdrawal',      'SUCCESS', 8200.00),
(11,'TRANSFER_IN',    500000.00, 'BRANCH',      NULL,             '2026-06-01 14:00:00', 'Business revenue',     'SUCCESS', 890000.00),
(11,'TRANSFER_OUT',   450000.00, 'ONLINE',      NULL,             '2026-06-16 02:14:00', 'Large night transfer', 'FLAGGED', 440000.00),
(12,'DEPOSIT',         45000.00, 'BRANCH',      NULL,             '2026-06-01 09:00:00', 'Salary credit',        'SUCCESS', 45000.00),
(13,'POS_PURCHASE',     8900.00, 'POS',         'Croma',          '2026-06-06 19:20:00', 'Electronics purchase', 'SUCCESS', 130000.00),
(14,'DEPOSIT',         38000.00, 'BRANCH',      NULL,             '2026-06-01 09:00:00', 'Salary credit',        'SUCCESS', 38000.00),
(15,'BILL_PAYMENT',     6000.00, 'ONLINE',      'Water Board',    '2026-06-04 11:30:00', 'Utility bill',         'SUCCESS', 275000.00),
(16,'POS_PURCHASE',      950.00, 'POS',         'Local Store',    '2026-06-07 17:00:00', 'Groceries',            'SUCCESS', 12000.00),
(17,'DEPOSIT',         15000.00, 'BRANCH',      NULL,             '2026-06-02 10:15:00', 'Pension credit',       'SUCCESS', 410000.00),
(1, 'POS_PURCHASE',     2999.99, 'POS',         'Amazon',         '2026-06-20 22:47:00', 'Online shopping',      'SUCCESS', 173800.51),
(6, 'ATM_WITHDRAWAL',  99000.00, 'ATM',         NULL,             '2026-06-21 03:12:00', 'Suspicious ATM withdrawal', 'FLAGGED', 1001000.00),
(3, 'POS_PURCHASE',     1500.00, 'POS',         'Cafe Coffee Day','2026-06-22 08:30:00', 'Coffee purchase',      'SUCCESS', 393500.75);

-- ---------------------------------------------------------------------
-- LOANS
-- ---------------------------------------------------------------------
INSERT INTO loans
(customer_id, branch_id, loan_type, principal_amount, interest_rate, tenure_months, emi_amount, disbursed_date, status, outstanding_amount) VALUES
(1, 1, 'HOME',       4500000.00, 8.50, 240, 39100.00, '2018-05-01', 'ACTIVE',    3200000.00),
(2, 2, 'AUTO',        800000.00, 9.20, 60,  16700.00, '2022-01-15', 'ACTIVE',    350000.00),
(4, 4, 'PERSONAL',    250000.00,13.50, 36,  8500.00,  '2023-03-10', 'ACTIVE',    120000.00),
(5, 5, 'BUSINESS',   6000000.00,10.00, 84,  99000.00, '2019-07-20', 'ACTIVE',    2900000.00),
(7, 2, 'HOME',       3200000.00, 8.75, 180, 32000.00, '2020-09-01', 'ACTIVE',    2500000.00),
(9, 4, 'BUSINESS',   4000000.00, 9.75, 120, 52000.00, '2015-04-11', 'DEFAULTED', 1800000.00),
(11,1, 'EDUCATION',   900000.00, 7.50, 84,  14000.00, '2021-08-01', 'ACTIVE',    650000.00),
(13,3, 'AUTO',        650000.00, 9.00, 48,  16200.00, '2022-11-05', 'CLOSED',    0.00);

-- ---------------------------------------------------------------------
-- CARDS
-- ---------------------------------------------------------------------
INSERT INTO cards
(customer_id, account_id, card_type, card_network, card_number_masked, credit_limit, issue_date, expiry_date, status) VALUES
(1, 1,  'DEBIT',  'RUPAY',      '**** **** **** 1001', NULL,      '2021-01-10', '2027-01-31', 'ACTIVE'),
(1, 1,  'CREDIT', 'VISA',       '**** **** **** 1002', 300000.00, '2021-01-10', '2027-01-31', 'ACTIVE'),
(2, 3,  'DEBIT',  'MASTERCARD', '**** **** **** 1003', NULL,      '2020-05-15', '2026-05-31', 'ACTIVE'),
(3, 4,  'DEBIT',  'RUPAY',      '**** **** **** 1004', NULL,      '2022-06-01', '2028-06-30', 'ACTIVE'),
(5, 6,  'CREDIT', 'AMEX',       '**** **** **** 1005', 1000000.00,'2018-02-20', '2026-02-28', 'ACTIVE'),
(7, 9,  'CREDIT', 'VISA',       '**** **** **** 1006', 500000.00, '2019-09-09', '2025-09-30', 'EXPIRED'),
(9, 11, 'DEBIT',  'MASTERCARD', '**** **** **** 1007', NULL,      '2017-07-03', '2027-07-31', 'ACTIVE'),
(11,13, 'DEBIT',  'RUPAY',      '**** **** **** 1008', NULL,      '2020-02-14', '2026-02-28', 'ACTIVE'),
(13,15, 'CREDIT', 'MASTERCARD', '**** **** **** 1009', 400000.00, '2021-12-12', '2027-12-31', 'ACTIVE'),
(15,17, 'DEBIT',  'VISA',       '**** **** **** 1010', NULL,      '2015-08-08', '2027-08-31', 'BLOCKED');

-- ---------------------------------------------------------------------
-- FRAUD_ALERTS (linked to FLAGGED transactions above)
-- ---------------------------------------------------------------------
INSERT INTO fraud_alerts (transaction_id, risk_score, alert_type, model_version, status, created_at) VALUES
(14, 92.50, 'VELOCITY_CHECK',    'v1.2', 'REVIEWING',       '2026-06-16 00:05:00'),
(17, 88.10, 'UNUSUAL_AMOUNT',    'v1.2', 'CONFIRMED_FRAUD', '2026-06-16 02:20:00'),
(25, 95.75, 'LOCATION_MISMATCH', 'v1.2', 'OPEN',            '2026-06-21 03:15:00');

-- =====================================================================
-- End of 03_insert_sample_data.sql
-- Next: run 04_queries.sql for analytics, then 05_views.sql for views
-- =====================================================================
