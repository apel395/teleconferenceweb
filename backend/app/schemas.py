from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from .models import SubmissionStatus, SurveyQuestionType, TravelStatus, UserRole

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

class SurveyOptionCreate(BaseModel):
    label:str=Field(min_length=1,max_length=255)
    value:str|None=Field(default=None,max_length=255)
class SurveyOptionOut(ORMModel):
    id:int; label:str; value:str; position:int
class SurveyQuestionCreate(BaseModel):
    prompt:str=Field(min_length=2)
    question_type:SurveyQuestionType
    is_required:bool=False
    settings:dict=Field(default_factory=dict)
    options:list[SurveyOptionCreate]=Field(default_factory=list)
class SurveyQuestionOut(ORMModel):
    id:int; prompt:str; question_type:SurveyQuestionType; is_required:bool; position:int; settings:dict; options:list[SurveyOptionOut]=Field(default_factory=list)
class SurveyCreate(BaseModel):
    title:str=Field(min_length=3,max_length=220)
    description:str|None=None
    applies_to_all_services:bool=False
    service_ids:list[int]=Field(default_factory=list)
    is_active:bool=True
    questions:list[SurveyQuestionCreate]=Field(min_length=1)
class SurveyOut(ORMModel):
    id:int; title:str; description:str|None; applies_to_all_services:bool; is_active:bool; questions:list[SurveyQuestionOut]=Field(default_factory=list)
class SurveyAnswerIn(BaseModel):
    question_id:int
    value:dict
class SurveyResponseCreate(BaseModel):
    service_id:int|None=None
    submission_id:int|None=None
    respondent_name:str|None=Field(default=None,max_length=180)
    respondent_email:EmailStr|None=None
    answers:list[SurveyAnswerIn]=Field(min_length=1)
class SurveyResponseOut(ORMModel):
    id:int; survey_id:int; service_id:int|None; submission_id:int|None; respondent_name:str|None; respondent_email:str|None; created_at:datetime
class SurveySummary(BaseModel):
    survey_id:int; title:str; responses:int; active:bool

class DashboardSummary(BaseModel):
    total_submissions:int; submitted:int; in_review:int; needs_follow_up:int; completed:int; problematic_travels:int
