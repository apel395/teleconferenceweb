from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from .config import get_settings

settings = get_settings()

# Lambda execution environments may scale horizontally. Keep the per-process
# PostgreSQL pool intentionally tiny so a burst cannot exhaust the small VPS DB.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=900,
    pool_size=1,
    max_overflow=0,
    pool_timeout=5,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
