from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from .models import SubmissionStatus, TravelStatus, UserRole

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    email: EmailStr; full_name: str = Field(min_length=2,max_length=180); password: str = Field(min_length=8,max_length=128)
class UserOut(ORMModel):
    id:int; email:EmailStr; full_name:str; role:UserRole; is_active:bool
class TokenOut(BaseModel):
    access_token:str; token_type:str="bearer"; user:UserOut
class LoginIn(BaseModel):
    email:EmailStr; password:str

class ServiceOut(ORMModel):
    id:int; slug:str; name:str; category:str; description:str; is_public:bool; is_active:bool
class TravelOut(ORMModel):
    id:int; name:str; license_number:str|None; kind:str; city:str|None; address:str|None; phone:str|None; status:TravelStatus; issue_note:str|None

class SubmissionCreate(BaseModel):
    service_slug:str
    travel_id:int|None=None
    reporter_name:str=Field(min_length=2,max_length=180)
    reporter_email:EmailStr|None=None
    reporter_phone:str|None=Field(default=None,max_length=80)
    payload:dict=Field(default_factory=dict)
    notes:str|None=None
class SubmissionOut(ORMModel):
    id:int; reference_no:str; service_id:int; user_id:int|None; travel_id:int|None; reporter_name:str; reporter_email:str|None; reporter_phone:str|None; status:SubmissionStatus; payload:dict; notes:str|None; created_at:datetime; updated_at:datetime
class SubmissionStatusUpdate(BaseModel):
    status:SubmissionStatus; note:str|None=None

class DashboardSummary(BaseModel):
    total_submissions:int; submitted:int; in_review:int; needs_follow_up:int; completed:int; problematic_travels:int
