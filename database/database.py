# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os
from urllib.parse import quote_plus


LOCAL_DATABASE_URL = "sqlite:///./sql_app.db"
DATABASE_URL_SOURCE = "local_sqlite"


def _running_on_railway() -> bool:
    return any(key.startswith("RAILWAY_") for key in os.environ)


def _postgres_url_from_pg_vars() -> str | None:
    user = os.getenv("PGUSER")
    password = os.getenv("PGPASSWORD")
    host = os.getenv("PGHOST")
    port = os.getenv("PGPORT", "5432")
    database = os.getenv("PGDATABASE")

    if not all([user, password, host, database]):
        return None

    return (
        f"postgresql://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{database}"
    )


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _env_presence() -> dict:
    keys = [
        "DATABASE_URL",
        "DATABASE_PRIVATE_URL",
        "DATABASE_PUBLIC_URL",
        "POSTGRES_URL",
        "PGHOST",
        "PGPORT",
        "PGUSER",
        "PGPASSWORD",
        "PGDATABASE",
        "RAILWAY_ENVIRONMENT",
        "RAILWAY_PROJECT_ID",
        "RAILWAY_SERVICE_ID",
    ]
    return {key: bool(os.getenv(key)) for key in keys}


def _resolve_database_url() -> str:
    global DATABASE_URL_SOURCE

    candidates = [
        ("DATABASE_URL", os.getenv("DATABASE_URL")),
        ("DATABASE_PRIVATE_URL", os.getenv("DATABASE_PRIVATE_URL")),
        ("DATABASE_PUBLIC_URL", os.getenv("DATABASE_PUBLIC_URL")),
        ("POSTGRES_URL", os.getenv("POSTGRES_URL")),
        ("PG* variables", _postgres_url_from_pg_vars()),
    ]

    url = None
    for source, candidate in candidates:
        if candidate:
            DATABASE_URL_SOURCE = source
            url = candidate
            break

    if url:
        return _normalize_database_url(url)

    if _running_on_railway():
        raise RuntimeError(
            "Banco de dados não configurado na Railway. "
            "Adicione DATABASE_URL ou conecte as variáveis do serviço PostgreSQL ao serviço web."
        )

    DATABASE_URL_SOURCE = "local_sqlite"
    return LOCAL_DATABASE_URL


SQLALCHEMY_DATABASE_URL = _resolve_database_url()
_url = make_url(SQLALCHEMY_DATABASE_URL)

engine_options = {}
if _url.get_backend_name().startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options["pool_pre_ping"] = True

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def database_public_info() -> dict:
    url = make_url(SQLALCHEMY_DATABASE_URL)
    return {
        "source": DATABASE_URL_SOURCE,
        "dialect": url.get_backend_name(),
        "database": url.database,
        "host": url.host,
        "is_local_sqlite": url.get_backend_name().startswith("sqlite"),
        "env_present": _env_presence(),
    }


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
