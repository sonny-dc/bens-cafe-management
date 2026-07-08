CREATE DATABASE IF NOT EXISTS bens_cafe_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bens_cafe_management;

-- ==========================================================
-- RESET TABLES
-- Run this file only when initializing/resetting the database.
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS payroll_entries;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS sales_entries;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS report_email_logs;
DROP TABLE IF EXISTS report_email_schedules;
DROP TABLE IF EXISTS inventory_adjustments;
DROP TABLE IF EXISTS restock_calculation_items;
DROP TABLE IF EXISTS restock_calculations;
DROP TABLE IF EXISTS shift_sessions;
DROP TABLE IF EXISTS staff_messages;
DROP TABLE IF EXISTS inventory_requests;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS inventory_budget_logs;
DROP TABLE IF EXISTS inventory_budget_accounts;
DROP TABLE IF EXISTS employee_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- USERS AND EMPLOYEE PROFILES
-- ==========================================================

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  account_status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employee_profiles (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  job_role VARCHAR(50) NOT NULL,
  default_shift_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  daily_pay DECIMAL(10,2) GENERATED ALWAYS AS (default_shift_hours * hourly_rate) STORED,
  employment_status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_employee_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT chk_employee_profiles_shift_hours CHECK (default_shift_hours >= 0),
  CONSTRAINT chk_employee_profiles_hourly_rate CHECK (hourly_rate >= 0)
) ENGINE=InnoDB;

-- ==========================================================
-- INVENTORY MODULE
-- ==========================================================

CREATE TABLE inventory_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  category ENUM('beverage_ingredients', 'food_ingredients', 'packaging', 'cleaning_supplies', 'other') NOT NULL,
  unit VARCHAR(20) NOT NULL,
  stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  low_threshold DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('in_stock', 'low_stock', 'out_of_stock') NOT NULL DEFAULT 'in_stock',
  user_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_inventory_items_name_category_unit
  UNIQUE (item_name, category, unit),

  CONSTRAINT fk_inventory_items_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_inventory_items_stock_quantity CHECK (stock_quantity >= 0),
  CONSTRAINT chk_inventory_items_low_threshold CHECK (low_threshold >= 0),
  CONSTRAINT chk_inventory_items_unit_cost CHECK (unit_cost >= 0)
) ENGINE=InnoDB;

CREATE TABLE inventory_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  item_id INT NULL,
  requested_quantity DECIMAL(10,2) NOT NULL,
  requested_unit VARCHAR(20) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  request_status ENUM('pending', 'acknowledged') NOT NULL DEFAULT 'pending',
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  updated_at DATETIME NULL DEFAULT NULL,

  CONSTRAINT fk_inventory_requests_employee
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(employee_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_inventory_requests_item
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_inventory_requests_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_inventory_requests_quantity CHECK (requested_quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE inventory_adjustments (
  adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NULL,
  user_id INT NULL,
  adjustment_type ENUM('add', 'deduct', 'correction') NOT NULL,
  quantity_changed DECIMAL(10,2) NOT NULL,
  old_quantity DECIMAL(10,2) NOT NULL,
  new_quantity DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_inventory_adjustments_item
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_inventory_adjustments_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_inventory_adjustments_quantity_changed CHECK (quantity_changed > 0),
  CONSTRAINT chk_inventory_adjustments_old_quantity CHECK (old_quantity >= 0),
  CONSTRAINT chk_inventory_adjustments_new_quantity CHECK (new_quantity >= 0)
) ENGINE=InnoDB;

CREATE TABLE inventory_budget_accounts (
  budget_account_id TINYINT PRIMARY KEY DEFAULT 1,

  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_inventory_budget_accounts_singleton
    CHECK (budget_account_id = 1),

  CONSTRAINT chk_inventory_budget_accounts_balance
    CHECK (current_balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE restock_calculations (
  calculation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  total_estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_restock_calculations_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_restock_calculations_total_cost CHECK (total_estimated_cost >= 0)
) ENGINE=InnoDB;

-- For the inventory budget account, we will initialize it with a default balance of 0.00.
INSERT INTO inventory_budget_accounts (budget_account_id, current_balance)
VALUES (1, 0.00);

CREATE TABLE restock_calculation_items (
  calculation_item_id INT AUTO_INCREMENT PRIMARY KEY,
  calculation_id INT NOT NULL,
  item_id INT NULL,
  quantity_to_buy DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit_cost_snapshot DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estimated_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity_to_buy * unit_cost_snapshot) STORED,

  CONSTRAINT fk_restock_items_calculation
    FOREIGN KEY (calculation_id) REFERENCES restock_calculations(calculation_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_restock_items_inventory_item
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_restock_items_quantity CHECK (quantity_to_buy >= 0),
  CONSTRAINT chk_restock_items_unit_cost CHECK (unit_cost_snapshot >= 0)
) ENGINE=InnoDB;

-- ==========================================================
-- STAFF BOARD AND SHIFT MONITORING
-- ==========================================================

CREATE TABLE staff_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  message_type ENUM('general', 'concern', 'urgent', 'suggestion', 'maintenance', 'customer_feedback', 'other') NOT NULL DEFAULT 'general',
  subject VARCHAR(255) NULL,
  message_text TEXT NOT NULL,
  message_status ENUM('new', 'read', 'acknowledged') NOT NULL DEFAULT 'new',
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL DEFAULT NULL,
  user_id INT NULL,

  CONSTRAINT fk_staff_messages_employee
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(employee_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_staff_messages_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE shift_sessions (
  shift_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  shift_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  start_time DATETIME NOT NULL,
  scheduled_end_time DATETIME NULL DEFAULT NULL,
  end_time DATETIME NULL DEFAULT NULL,
  opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  closing_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  recorded_cash_sales DECIMAL(12,2) NULL DEFAULT NULL,
  cash_variance DECIMAL(12,2) GENERATED ALWAYS AS (closing_cash - (opening_cash + COALESCE(recorded_cash_sales, 0))) STORED,
  shift_status ENUM('in_progress', 'completed', 'archived') NOT NULL DEFAULT 'in_progress',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_shift_sessions_employee
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(employee_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_shift_sessions_opening_cash CHECK (opening_cash >= 0),
  CONSTRAINT chk_shift_sessions_closing_cash CHECK (closing_cash >= 0),
  CONSTRAINT chk_shift_sessions_recorded_cash_sales CHECK (recorded_cash_sales IS NULL OR recorded_cash_sales >= 0)
) ENGINE=InnoDB;

-- ==========================================================
-- SALES, EXPENSES, AND PAYROLL
-- ==========================================================

CREATE TABLE sales_entries (
  sales_entry_id INT AUTO_INCREMENT PRIMARY KEY,
  cash_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  online_card_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  physical_cash_count DECIMAL(12,2) NULL DEFAULT NULL,
  total_revenue DECIMAL(12,2) GENERATED ALWAYS AS (cash_sales + online_card_sales) STORED,
  net_profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  user_id INT NULL,
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sales_entries_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_sales_entries_cash_sales CHECK (cash_sales >= 0),
  CONSTRAINT chk_sales_entries_online_card_sales CHECK (online_card_sales >= 0),
  CONSTRAINT chk_sales_entries_physical_cash_count CHECK (physical_cash_count IS NULL OR physical_cash_count >= 0)
) ENGINE=InnoDB;

CREATE TABLE expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  sales_entry_id INT NOT NULL,
  description VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  user_id INT NULL,
  expense_category ENUM('utilities', 'rent', 'supplies', 'marketing', 'repairs_maintenance', 'transportation', 'miscellaneous') NOT NULL,
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_expenses_sales_entry
    FOREIGN KEY (sales_entry_id) REFERENCES sales_entries(sales_entry_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_expenses_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_expenses_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE payroll_entries (
  payroll_id INT AUTO_INCREMENT PRIMARY KEY,
  sales_entry_id INT NOT NULL,
  employee_id INT NOT NULL,
  gross_pay DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_payroll_entries_sales_entry
    FOREIGN KEY (sales_entry_id) REFERENCES sales_entries(sales_entry_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_payroll_entries_employee
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(employee_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_payroll_entries_gross_pay CHECK (gross_pay >= 0)

) ENGINE=InnoDB;

-- ==========================================================
-- REPORT EMAIL SCHEDULING AND LOGGING
-- ==========================================================

CREATE TABLE report_email_schedules (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_email VARCHAR(100) NOT NULL,
  report_type ENUM('weekly_summary', 'monthly_report') NOT NULL,
  frequency ENUM('weekly', 'monthly') NOT NULL,
  send_day VARCHAR(20) NOT NULL,
  send_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  next_send_at DATETIME NULL DEFAULT NULL,
  user_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_report_email_schedules_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE report_email_logs (
  email_log_id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  sent_to VARCHAR(100) NOT NULL,
  report_type ENUM('weekly_summary', 'monthly_report', 'daily_report') NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  send_status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  error_message TEXT NULL,

  CONSTRAINT fk_report_email_logs_schedule
    FOREIGN KEY (schedule_id) REFERENCES report_email_schedules(schedule_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================================
-- AUDIT LOGS
-- ==========================================================

CREATE TABLE audit_logs (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id INT NOT NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE inventory_budget_logs (
  budget_log_id INT AUTO_INCREMENT PRIMARY KEY,

  budget_account_id TINYINT NOT NULL DEFAULT 1,

  transaction_type ENUM('in', 'out') NOT NULL,

  amount DECIMAL(12,2) NOT NULL,

  source_type ENUM('sales_entry', 'restock_calculation') NOT NULL,

  sales_entry_id INT NULL,
  restock_calculation_id INT NULL,

  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,

  user_id INT NULL,

  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_inventory_budget_logs_account
    FOREIGN KEY (budget_account_id) REFERENCES inventory_budget_accounts(budget_account_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_inventory_budget_logs_sales_entry
    FOREIGN KEY (sales_entry_id) REFERENCES sales_entries(sales_entry_id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,

  CONSTRAINT fk_inventory_budget_logs_restock_calculation
    FOREIGN KEY (restock_calculation_id) REFERENCES restock_calculations(calculation_id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,

  CONSTRAINT fk_inventory_budget_logs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_inventory_budget_logs_amount
    CHECK (amount > 0),

  CONSTRAINT chk_inventory_budget_logs_balance_before
    CHECK (balance_before >= 0),

  CONSTRAINT chk_inventory_budget_logs_balance_after
    CHECK (balance_after >= 0),

    CONSTRAINT chk_inventory_budget_logs_source
    CHECK (
      (
        transaction_type = 'in'
        AND source_type = 'sales_entry'
        AND sales_entry_id IS NOT NULL
        AND restock_calculation_id IS NULL
      )
      OR
      (
        transaction_type = 'out'
        AND source_type = 'restock_calculation'
        AND restock_calculation_id IS NOT NULL
        AND sales_entry_id IS NULL
      )
    ),

  CONSTRAINT chk_inventory_budget_logs_balance_math
    CHECK (
      (
        transaction_type = 'in'
        AND balance_after = balance_before + amount
      )
      OR
      (
        transaction_type = 'out'
        AND balance_after = balance_before - amount
      )
    )
) ENGINE=InnoDB;

-- ======================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ======================================

-- SHIFT SESSIONS INDEXES
CREATE INDEX idx_shift_sessions_start_time ON shift_sessions(start_time);
CREATE INDEX idx_shift_sessions_shift_date ON shift_sessions(shift_date);
CREATE INDEX idx_shift_sessions_shift_status ON shift_sessions(shift_status);
CREATE INDEX idx_shift_sessions_employee_id ON shift_sessions(employee_id);
CREATE INDEX idx_shift_sessions_shift_date_shift_status ON shift_sessions(shift_date, shift_status);
CREATE INDEX idx_shift_sessions_start_time_end_time ON shift_sessions(start_time, end_time);

-- SALES ENTRIES INDEXES
CREATE INDEX idx_sales_entries_posted_at ON sales_entries(posted_at);
CREATE INDEX idx_sales_entries_posted_at_desc ON sales_entries(posted_at DESC);

-- EXPENSES INDEXES
CREATE INDEX idx_expenses_posted_at ON expenses(posted_at);
CREATE INDEX idx_expenses_category ON expenses(expense_category);
CREATE INDEX idx_expenses_posted_at_category ON expenses(posted_at, expense_category);

