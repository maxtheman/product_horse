-- Create employees table
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    permission_level INTEGER NOT NULL
);

-- Create files table
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    visibility TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Create indexes
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_files_name ON files(name);
CREATE INDEX idx_files_employee ON files(employee_id);
CREATE INDEX idx_files_company ON files(company_id);