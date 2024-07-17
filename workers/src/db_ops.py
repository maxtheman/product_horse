from cf_types import D1Database, Employee, FileAccess

############
###DB OPERATIONS - for authorization and authentication
############

async def check_and_insert_employee(db: D1Database[Employee], employee: Employee):
    """Insert an employee into the database."""
    check_if_exists_query = "SELECT * FROM employees WHERE employee_id = ?1 and company_id = ?2"
    check_if_exists_statement = db.prepare(check_if_exists_query)
    check_if_exists_binding = check_if_exists_statement.bind(
        employee.id, employee.company_id
    )
    check_if_exists_result = await check_if_exists_binding.first()
    if check_if_exists_result is not None:
        return False
    query = "INSERT INTO employees (employee_id, company_id, permission_level) VALUES (?1, ?2, ?3)"
    statement = db.prepare(query)
    binding = statement.bind(
        employee.id, employee.company_id, employee.permission_level
    )
    result = await binding.run()
    return result.success


async def insert_file_access(db: D1Database[FileAccess], file_access: FileAccess):
    query = "INSERT INTO file_access (file_id, employee_id, company_id, visibility) VALUES (?1, ?2, ?3, ?4)"
    statement = db.prepare(query)
    binding = statement.bind(
        file_access.id,
        file_access.employee_id,
        file_access.company_id,
        file_access.visibility,
    )
    result = await binding.run()
    return result.success


async def check_file_access(
    db: D1Database[bool], file_name: str, employee: Employee
) -> bool:
    query = """
    Select
     case
        when file.visibility = 'PUBLIC' then true # public
        when file.visibility = 'INTERNAL' and file.company_id = ?3 then true # internal
        when file.visibility = 'PRIVATE' and file.employee_id = ?2 and file.company_id = ?3 then true # private
        else false
     end
    from(
    SELECT *
    FROM files
    WHERE file_name = ?1
    ) as file
    """
    statement = db.prepare(query)
    binding = statement.bind(file_name, employee.id, employee.company_id)
    result: bool | None = await binding.first()
    if result is None:
        return False
    return result


async def remove_file_access(db: D1Database[FileAccess], file_access: FileAccess):
    query = "DELETE FROM file_access WHERE file_id = ?1 and employee_id = ?2 and company_id = ?3"
    statement = db.prepare(query)
    binding = statement.bind(
        file_access.id, file_access.employee_id, file_access.company_id
    )
    result = await binding.run()
    return result.success
