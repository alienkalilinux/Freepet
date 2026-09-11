from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, max_length=100)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    is_blocked: bool
    is_verified: bool
    is_admin: bool
    oauth_provider: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    demo_code: str | None = None
    demo_hint: str | None = None


class VerifyCode(BaseModel):
    code: str = Field(..., min_length=9, max_length=9)


class ChangeEmail(BaseModel):
    email: str = Field(..., max_length=100)


class UpdateCity(BaseModel):
    city: str = Field(..., min_length=1, max_length=100)


class SendPhoneCode(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)


class VerifyPhone(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class OAuthLogin(BaseModel):
    access_token: str
    provider: str


class PetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: str = Field(..., min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    character: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=100)
    description: str = Field(..., min_length=10, max_length=2000)
    vaccination_info: Optional[str] = Field(None, max_length=1000)
    health_issues: Optional[str] = Field(None, max_length=1000)
    documents: Optional[str] = None


class PetResponse(BaseModel):
    id: int
    user_id: int
    name: str
    species: str
    breed: Optional[str] = None
    character: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int]
    description: str
    vaccination_info: Optional[str]
    health_issues: Optional[str]
    documents: Optional[str]
    image_url: Optional[str]
    status: str
    moderation_status: str
    rejection_reason: Optional[str]
    created_at: datetime
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    pet_id: int


class BookingResponse(BaseModel):
    id: int
    pet_id: int
    user_id: int
    status: str
    created_at: datetime
    pet: Optional[PetResponse] = None

    class Config:
        from_attributes = True


class ModerationResult(BaseModel):
    approved: bool
    reason: Optional[str] = None
    details: Optional[dict] = None
