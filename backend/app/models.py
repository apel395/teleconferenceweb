from datetime import datetime
from enum import Enum
from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class UserRole(str, Enum):
    PUBLIC="PUBLIC"; OPERATOR="OPERATOR"; ADMIN="ADMIN"
class SubmissionStatus(str, Enum):
    DRAFT="DRAFT"; SUBMITTED="SUBMITTED"; IN_REVIEW="IN_REVIEW"; NEEDS_FOLLOW_UP="NEEDS_FOLLOW_UP"; COMPLETED="COMPLETED"; CLOSED="CLOSED"
class TravelStatus(str, Enum):
    ACTIVE="ACTIVE"; NEEDS_VERIFICATION="NEEDS_VERIFICATION"; PROBLEMATIC="PROBLEMATIC"; INACTIVE="INACTIVE"

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class User(Base, TimestampMixin):
    __tablename__="users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(180))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.PUBLIC, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Service(Base, TimestampMixin):
    __tablename__="services"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Travel(Base, TimestampMixin):
    __tablename__="travels"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(220), index=True)
    license_number: Mapped[str|None] = mapped_column(String(120), unique=True, nullable=True)
    kind: Mapped[str] = mapped_column(String(30), default="PPIU")
    city: Mapped[str|None] = mapped_column(String(120), nullable=True, index=True)
    address: Mapped[str|None] = mapped_column(Text, nullable=True)
    phone: Mapped[str|None] = mapped_column(String(80), nullable=True)
    status: Mapped[TravelStatus] = mapped_column(SAEnum(TravelStatus), default=TravelStatus.NEEDS_VERIFICATION, index=True)
    issue_note: Mapped[str|None] = mapped_column(Text, nullable=True)

class Submission(Base, TimestampMixin):
    __tablename__="submissions"
    id: Mapped[int] = mapped_column(primary_key=True)
    reference_no: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), index=True)
    user_id: Mapped[int|None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    travel_id: Mapped[int|None] = mapped_column(ForeignKey("travels.id"), nullable=True, index=True)
    reporter_name: Mapped[str] = mapped_column(String(180))
    reporter_email: Mapped[str|None] = mapped_column(String(180), nullable=True)
    reporter_phone: Mapped[str|None] = mapped_column(String(80), nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(SAEnum(SubmissionStatus), default=SubmissionStatus.SUBMITTED, index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    notes: Mapped[str|None] = mapped_column(Text, nullable=True)
    service = relationship("Service")

class Attachment(Base, TimestampMixin):
    __tablename__="attachments"
    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id", ondelete="CASCADE"), index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    object_key: Mapped[str] = mapped_column(String(500), unique=True)
    content_type: Mapped[str|None] = mapped_column(String(120), nullable=True)
    size_bytes: Mapped[int|None] = mapped_column(nullable=True)

class FollowUp(Base, TimestampMixin):
    __tablename__="follow_ups"
    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[int|None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(80))
    note: Mapped[str|None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

class ConsultationRoom(Base, TimestampMixin):
    __tablename__="consultation_rooms"
    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int|None] = mapped_column(ForeignKey("submissions.id"), nullable=True, index=True)
    provider: Mapped[str] = mapped_column(String(50), default="UNASSIGNED")
    external_room_id: Mapped[str|None] = mapped_column(String(255), nullable=True)
    join_url: Mapped[str|None] = mapped_column(Text, nullable=True)
    host_url: Mapped[str|None] = mapped_column(Text, nullable=True)
    starts_at: Mapped[datetime|None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime|None] = mapped_column(DateTime(timezone=True), nullable=True)
