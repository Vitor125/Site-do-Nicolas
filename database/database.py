# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

DEFAULT_DATABASE_URL = (
    "postgresql://neondb_owner:npg_tKdjgc52LIus@"
    "ep-spring-king-acjr2vjc-pooler.sa-east-1.aws.neon.tech/"
    "neondb?sslmode=require&channel_binding=require"
)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
