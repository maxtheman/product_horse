
from product_horse.db import SqlModelDatabase
from testcontainers.postgres import PostgresContainer
from typing import cast
import os
import subprocess
import urllib.parse
from uuid import UUID
from product_horse.db import Company, Employee, PermissionLevel
from passlib.hash import pbkdf2_sha256
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

def setup_test_db(postgres: PostgresContainer, load_data: bool = True):
    try:
        database_url = cast(str, postgres.get_connection_url())  # type: ignore
        logger.debug(f"Original database URL: {database_url}")

        # Parse the database URL
        url = urllib.parse.urlparse(database_url)
        
        # Set up environment variables for dbmate
        dbmate_url = f"postgresql://{url.username}:{url.password}@{url.hostname}:{url.port}/{url.path[1:]}?sslmode=disable"
        os.environ['TEST_DATABASE_MIGRATION_URL'] = dbmate_url
        logger.debug(f"DBMATE_URL set to: {dbmate_url}")

        # Run dbmate migrations
        try:
            result = subprocess.run(
                ["dbmate", "-s", "../db/schema.sql", "-d", "../db/migrations", "-e", "TEST_DATABASE_MIGRATION_URL", "load"], 
                check=True, 
                capture_output=True, 
                text=True
            )
            logger.debug(f"dbmate output: {result.stdout}")
        except subprocess.CalledProcessError as e:
            logger.error(f"dbmate command failed: {e}")
            logger.error(f"dbmate stderr: {e.stderr}")
            raise

        # Rest of your function...
        with open("../sql_files/enable_rls.sql", "r") as f:
            superuser_database = SqlModelDatabase(database_url=database_url)
            with superuser_database.get_session_for_employee(public=True) as session:
                rls_password = os.environ.get("RLS_USER_PASSWORD")
                if not rls_password:
                    raise ValueError("RLS_USER_PASSWORD environment variable is not set")
                session.execute(text(f"SET app.rls_user_password = '{rls_password}'"))
                session.execute(text(f.read()))
                session.execute(text("reset app.rls_user_password"))
                session.commit()

        if load_data:
            psql_url = f"postgresql://{url.username}:{url.password}@{url.hostname}:{url.port}/{url.path[1:]}"
            subprocess.run(["psql", psql_url, "-f", "../integration-text-data.sql"], check=True)

        database_url = database_url.replace(
            "postgresql+psycopg2://test:test",
            f'postgresql+psycopg2://rls_user:{rls_password}',
        )
        return database_url

    except Exception as e:
        logger.exception("An error occurred in setup_test_db")
        raise

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