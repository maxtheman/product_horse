from uuid import uuid4, UUID
from sqlalchemy import text
from sqlmodel import Session, select
from passlib.hash import pbkdf2_sha256
from product_horse.db import (  # Replace 'your_module' with the actual module name
    SqlModelDatabase,
    Company,
    Employee,
    PermissionLevel,
    OrgBoundModel,
)

def create_default_company_and_employee(db: SqlModelDatabase) -> tuple[UUID, UUID]:
    with db.get_session_for_employee(public=True) as session:
        # Create default company
        default_company = Company(name="Default Company")
        session.add(default_company)
        session.flush()

        # Create default employee
        default_employee = Employee(
            email="admin@default.com",
            name="Default Admin",
            permission_level=PermissionLevel.ADMIN,
            company_id=default_company.id,
            hashed_password=pbkdf2_sha256.hash("password").encode("utf-8"),
        )
        session.add(default_employee)
        session.commit()

        return default_company.id, default_employee.id

def update_all_records(db: SqlModelDatabase, company_id: UUID, employee_id: UUID):
    with db.get_session_for_employee(public=True) as session:
        # Get all OrgBoundModel subclasses
        for model in SQLModel.__subclasses__():
            if hasattr(model, "__table__") and issubclass(model, OrgBoundModel):
                table_name = model.__table__.name

                # Update company_id and created_by_id for all records
                session.execute(
                    text(f"""
                    UPDATE {table_name}
                    SET company_id = :company_id, created_by_id = :employee_id
                    WHERE company_id IS NULL OR created_by_id IS NULL
                    """),
                    {"company_id": company_id, "employee_id": employee_id}
                )

            session.commit()

def run_one_time_update():
    # Initialize your database connection
    db = SqlModelDatabase(database_url="postgresql://localhost:5432/product_horse")

    # Create default company and employee
    company_id, employee_id = create_default_company_and_employee(db)

    # Update all existing records
    update_all_records(db, company_id, employee_id)

    print("One-time update completed successfully.")

if __name__ == "__main__":
    run_one_time_update()