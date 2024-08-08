from cf_types import D1Database, Employee, FileAccess
from typing import Dict, Any, TypeVar


############
###DB OPERATIONS - for authorization and authentication
############

async def does_employee_exist(db: D1Database[Employee], employee_id: str, company_id: str) -> bool:
    check_if_exists_query = "SELECT * FROM employees WHERE id = ?1 and company_id = ?2"
    check_if_exists_statement = db.prepare(check_if_exists_query)
    check_if_exists_binding = check_if_exists_statement.bind(
        employee_id, company_id
    )
    check_if_exists_result = await check_if_exists_binding.first()
    return check_if_exists_result is not None

async def get_employee(db: D1Database[Employee], employee_id: str, company_id: str) -> Employee:
    query = "SELECT * FROM employees WHERE id = ?1 and company_id = ?2"
    statement = db.prepare(query)
    binding = statement.bind(employee_id, company_id)
    result = await binding.first()
    if result is None:
        raise ValueError("Employee not found")
    return result


async def check_and_insert_employee(db: D1Database[Employee], employee: Employee):
    """Insert an employee into the database. Returns whether the employee exists in the database or not."""
    if not employee.id:
        raise ValueError("Employee ID is required")
    if not employee.company_id:
        raise ValueError("Employee company ID is required")
    employee_exists = await does_employee_exist(db, employee.id, employee.company_id)
    if employee_exists:
        return employee_exists
    if not employee_exists:
        try:
            query = "INSERT INTO employees (id, company_id, permission_level) VALUES (?1, ?2, ?3)"
            statement = db.prepare(query)
            binding = statement.bind(
                employee.id, employee.company_id, employee.permission_level
            )
            result = await binding.run()
            return result.success
        except Exception as e:
            raise ValueError(f"Error inserting employee: {e}")


async def insert_file_access(db: D1Database[FileAccess], file_access: FileAccess) -> bool:
    if not all([file_access.key, file_access.employee_id, file_access.company_id, file_access.visibility]):
        for key, value in file_access.__dict__.items():
            if value is None:
                raise ValueError(f"File access {key} is required")
    if not await does_employee_exist(db, file_access.employee_id, file_access.company_id): # type: ignore
        return False
    try:
        query = "INSERT INTO files (id, name, employee_id, company_id, visibility) VALUES (?1, ?2, ?3, ?4, ?5)"
        statement = db.prepare(query)
        binding = statement.bind(
            file_access.key,
            file_access.key,
            file_access.employee_id,
            file_access.company_id,
            file_access.visibility,
        )
        result = await binding.run()
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise ValueError("File access already exists")
        else:
            raise ValueError(f"Failed to insert file due to: {e}")
    return result.success


async def check_file_access(
    db: D1Database[bool], file_name: str, employee: Employee
) -> bool:
    if not file_name:
        raise ValueError("File name is required")
    if not employee.id:
        raise ValueError("Employee ID is required")
    if not employee.company_id:
        raise ValueError("Employee company ID is required")
    if not await does_employee_exist(db, employee.id, employee.company_id): # type: ignore
        return False
    query = """
    select
     case
        when file.visibility = 'PUBLIC' then true # public
        when file.visibility = 'INTERNAL' and file.company_id = ?3 then true # internal
        when file.visibility = 'PRIVATE' and file.employee_id = ?2 and file.company_id = ?3 then true # private
        else false
     end
    from (
        SELECT *
        FROM files
        WHERE files.name = ?1
    ) as file
    """
    statement = db.prepare(query)
    binding = statement.bind(file_name, employee.id, employee.company_id)
    result: bool | None = await binding.first()
    if result is None:
        return False
    return result


T = TypeVar('T')
def make_py(input: T) -> T:
    return input.to_py()

async def check_multiple_file_access(
    db: D1Database[Dict[str, Any]], file_names: list[str], employee: Employee
) -> dict[str, bool]:
    if not file_names or not employee.id or not employee.company_id:
        raise ValueError("File names, employee ID, and company ID are required")
    
    if not await does_employee_exist(db, employee.id, employee.company_id): # type: ignore
        return {file_name: False for file_name in file_names}

    query = """
    SELECT name,
     CASE
        WHEN visibility = 'PUBLIC' THEN 1
        WHEN visibility = 'INTERNAL' AND company_id = ?2 THEN 1
        WHEN visibility = 'PRIVATE' AND employee_id = ?1 AND company_id = ?2 THEN 1
        ELSE 0
     END as has_access
    FROM files
    WHERE name IN ({})
    """.format(','.join(['?'+str(i+3) for i in range(len(file_names))]))

    statement = db.prepare(query)
    binding = statement.bind(employee.id, employee.company_id, *file_names)
    results = make_py(await binding.all())

    return {row['name']: bool(row['has_access']) for row in results['results']}

async def remove_file_access(db: D1Database[FileAccess], file_access: FileAccess):
    query = "DELETE FROM files WHERE file_id = ?1 and employee_id = ?2 and company_id = ?3"
    statement = db.prepare(query)
    binding = statement.bind(
        file_access.key, file_access.employee_id, file_access.company_id
    )
    result = await binding.run()
    return result.success
