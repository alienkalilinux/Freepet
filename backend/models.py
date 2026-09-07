from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_blocked = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    verification_code = Column(String(255), nullable=True)
    verification_code_expires_at = Column(DateTime, nullable=True)
    oauth_provider = Column(String(20), nullable=True)
    oauth_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    pets = relationship("Pet", back_populates="owner")
    bookings = relationship("Booking", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False)
    breed = Column(String(100), nullable=True)
    character = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    vaccination_info = Column(Text, nullable=True)
    health_issues = Column(Text, nullable=True)
    documents = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(String(20), default="pending_moderation")
    moderation_status = Column(String(20), default="pending")
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="pets")
    bookings = relationship("Booking", back_populates="pet")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    pet = relationship("Pet", back_populates="bookings")
    user = relationship("User", back_populates="bookings")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    booking = relationship("Booking")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    reason = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reporter = relationship("User")
    message = relationship("Message")


class UserReport(Base):
    __tablename__ = "user_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
