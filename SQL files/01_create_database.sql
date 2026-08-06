-- =====================================================================
-- AI Banking Analytics Project
-- File: 01_create_database.sql
-- Purpose: Create the database used for banking analytics
-- Compatible with: MySQL 8.0+ (adjust syntax slightly for PostgreSQL/SQL Server)
-- =====================================================================

-- Drop database if it already exists (use with caution in production)
DROP DATABASE IF EXISTS ai_banking_analytics;

-- Create the database
CREATE DATABASE ai_banking_analytics
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Select the database for subsequent scripts
USE ai_banking_analytics;

-- =====================================================================
-- End of 01_create_database.sql
-- Next: run 02_create_tables.sql
-- =====================================================================
