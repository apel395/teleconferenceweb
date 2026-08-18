from datetime import datetime, timezone
from secrets import token_hex
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload
from .config import get_settings
from .database import Base, engine, get_db
from .models import (
    FollowUp, Service, Submission, SubmissionStatus, Survey, SurveyAnswer,
    SurveyQuestion, SurveyQuestionOption, SurveyResponse, SurveyServiceAssignment,
    Travel, TravelStatus, User, UserRole
)
from .schemas import (
    DashboardSummary, LoginIn, ServiceOut, SubmissionCreate, SubmissionOut,
    SubmissionStatusUpdate, SurveyCreate, SurveyOut, SurveyResponseCreate,
    SurveyResponseOut, SurveySummary, TokenOut, TravelOut, UserCreate, UserOut
)
from .security import create_access_token, get_current_user, hash_password, require_staff, verify_password

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.1.0", docs_url="/docs" if settings.app_env != "production" else None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

SERVICES = [
("pelaporan-travel-umrah","Pelaporan Travel Umrah","PELAPORAN"),
("pelaporan-jemaah-haji-khusus","Pelaporan Jemaah Haji Khusus","PELAPORAN"),
("pelaporan-pemulangan","Pelaporan Pemulangan","PELAPORAN"),
("pemulangan-haji-reguler","Pemulangan Jemaah Haji Reguler","PELAPORAN"),
("pemulangan-petugas-haji","Pemulangan Petugas Haji","PELAPORAN"),
("permasalahan-umrah-haji-khusus","Permasalahan Umrah & Haji Khusus","PELAPORAN"),
("pelaporan-manasik-kab-kota","Pelaporan Manasik Kabupaten/Kota","PELAPORAN"),
("perizinan-ppiu","Pengajuan Perizinan PPIU","PERIZINAN"),
("perizinan-kbihu","Pengajuan Perizinan KBIHU","PERIZINAN"),
("izin-cabang-ppiu","Pelaporan Izin Cabang PPIU","PERIZINAN"),
("direktori-travel","Direktori Travel Umrah","DIREKTORI"),
("fikih-haji","Tanya Jawab Fikih Haji","EDUKASI"),
("tutorial-manasik","Tutorial Manasik","EDUKASI"),
("bacaan-doa","Bacaan Doa","EDUKASI"),
]

@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        for slug, name, category in SERVICES:
            if not db.scalar(select(Service).where(Service.slug == slug)):
                db.add(Service(slug=slug, name=name, category=category, description=f"Layanan {name} Provinsi Riau", is_public=True, is_active=True))
        db.commit()

@app.get("/health")
def health():
    return {"status":"ok","service":settings.app_name,"time":datetime.now(timezone.utc).isoformat()}

@app.post("/api/v1/auth/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email already registered")
    user=User(email=payload.email.lower(), full_name=payload.full_name.strip(), password_hash=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user); return user

@app.post("/api/v1/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user=db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password,user.password_hash):
        raise HTTPException(status_code=401,detail="Email or password is incorrect")
    return TokenOut(access_token=create_access_token(user), user=user)

@app.get("/api/v1/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

@app.get("/api/v1/services", response_model=list[ServiceOut])
def list_services(category: str|None=None, db: Session=Depends(get_db)):
    q=select(Service).where(Service.is_active.is_(True), Service.is_public.is_(True)).order_by(Service.category,Service.name)
    if category: q=q.where(Service.category==category.upper())
    return list(db.scalars(q))

@app.get("/api/v1/travels", response_model=list[TravelOut])
def list_travels(q: str|None=None, city: str|None=None, status_filter: TravelStatus|None=Query(default=None,alias="status"), db: Session=Depends(get_db)):
    stmt=select(Travel).order_by(Travel.name)
    if q: stmt=stmt.where(Travel.name.ilike(f"%{q.strip()}%"))
    if city: stmt=stmt.where(Travel.city.ilike(city.strip()))
    if status_filter: stmt=stmt.where(Travel.status==status_filter)
    return list(db.scalars(stmt.limit(200)))

@app.get("/api/v1/travels/{travel_id}", response_model=TravelOut)
def travel_detail(travel_id:int, db:Session=Depends(get_db)):
    travel=db.get(Travel,travel_id)
    if not travel: raise HTTPException(status_code=404,detail="Travel not found")
    return travel

@app.post("/api/v1/submissions", response_model=SubmissionOut, status_code=201)
def create_submission(payload:SubmissionCreate, db:Session=Depends(get_db)):
    service=db.scalar(select(Service).where(Service.slug==payload.service_slug,Service.is_active.is_(True)))
    if not service: raise HTTPException(status_code=404,detail="Service not found")
    if payload.travel_id and not db.get(Travel,payload.travel_id): raise HTTPException(status_code=404,detail="Travel not found")
    ref=f"RIAU-{datetime.now(timezone.utc):%Y%m%d}-{token_hex(4).upper()}"
    item=Submission(reference_no=ref,service_id=service.id,travel_id=payload.travel_id,reporter_name=payload.reporter_name.strip(),reporter_email=str(payload.reporter_email).lower() if payload.reporter_email else None,reporter_phone=payload.reporter_phone,payload=payload.payload,notes=payload.notes,status=SubmissionStatus.SUBMITTED)
    db.add(item); db.commit(); db.refresh(item); return item

@app.get("/api/v1/submissions/{reference_no}", response_model=SubmissionOut)
def submission_status(reference_no:str, db:Session=Depends(get_db)):
    item=db.scalar(select(Submission).where(Submission.reference_no==reference_no.upper()))
    if not item: raise HTTPException(status_code=404,detail="Submission not found")
    return item

@app.get("/api/v1/surveys/active", response_model=list[SurveyOut])
def active_surveys(service_id:int|None=None, db:Session=Depends(get_db)):
    stmt=(select(Survey).options(selectinload(Survey.questions).selectinload(SurveyQuestion.options)).where(Survey.is_active.is_(True)).order_by(Survey.created_at.desc()))
    surveys=list(db.scalars(stmt).unique())
    if service_id is None:
        return [s for s in surveys if s.applies_to_all_services]
    assigned_ids=set(db.scalars(select(SurveyServiceAssignment.survey_id).where(SurveyServiceAssignment.service_id==service_id)))
    return [s for s in surveys if s.applies_to_all_services or s.id in assigned_ids]

@app.get("/api/v1/surveys/{survey_id}", response_model=SurveyOut)
def survey_detail(survey_id:int, db:Session=Depends(get_db)):
    survey=db.scalar(select(Survey).options(selectinload(Survey.questions).selectinload(SurveyQuestion.options)).where(Survey.id==survey_id,Survey.is_active.is_(True)))
    if not survey: raise HTTPException(status_code=404,detail="Survey not found")
    return survey

@app.post("/api/v1/surveys/{survey_id}/responses", response_model=SurveyResponseOut, status_code=201)
def submit_survey_response(survey_id:int,payload:SurveyResponseCreate,db:Session=Depends(get_db)):
    survey=db.scalar(select(Survey).options(selectinload(Survey.questions)).where(Survey.id==survey_id,Survey.is_active.is_(True)))
    if not survey: raise HTTPException(status_code=404,detail="Survey not found")
    if payload.service_id:
        service=db.get(Service,payload.service_id)
        if not service: raise HTTPException(status_code=404,detail="Service not found")
        if not survey.applies_to_all_services and not db.scalar(select(SurveyServiceAssignment).where(SurveyServiceAssignment.survey_id==survey.id,SurveyServiceAssignment.service_id==payload.service_id)):
            raise HTTPException(status_code=400,detail="Survey is not assigned to this service")
    submission=None
    if payload.submission_id:
        submission=db.get(Submission,payload.submission_id)
        if not submission: raise HTTPException(status_code=404,detail="Submission not found")
        if db.scalar(select(SurveyResponse).where(SurveyResponse.survey_id==survey.id,SurveyResponse.submission_id==submission.id)):
            raise HTTPException(status_code=409,detail="Survey already submitted for this service request")
    questions={q.id:q for q in survey.questions}
    answers={a.question_id:a for a in payload.answers}
    missing=[q.id for q in survey.questions if q.is_required and q.id not in answers]
    if missing: raise HTTPException(status_code=422,detail={"message":"Required survey questions are missing","question_ids":missing})
    unknown=[qid for qid in answers if qid not in questions]
    if unknown: raise HTTPException(status_code=422,detail={"message":"Unknown survey questions","question_ids":unknown})
    response=SurveyResponse(survey_id=survey.id,service_id=payload.service_id or (submission.service_id if submission else None),submission_id=payload.submission_id,respondent_name=payload.respondent_name,respondent_email=str(payload.respondent_email).lower() if payload.respondent_email else None)
    db.add(response); db.flush()
    for item in payload.answers:
        db.add(SurveyAnswer(response_id=response.id,question_id=item.question_id,value=item.value))
    db.commit(); db.refresh(response); return response

@app.get("/api/v1/staff/submissions", response_model=list[SubmissionOut])
def staff_submissions(status_filter:SubmissionStatus|None=Query(default=None,alias="status"), limit:int=Query(50,ge=1,le=200), _:User=Depends(require_staff), db:Session=Depends(get_db)):
    q=select(Submission).order_by(Submission.created_at.desc()).limit(limit)
    if status_filter: q=q.where(Submission.status==status_filter)
    return list(db.scalars(q))

@app.patch("/api/v1/staff/submissions/{submission_id}/status", response_model=SubmissionOut)
def update_submission_status(submission_id:int,payload:SubmissionStatusUpdate,user:User=Depends(require_staff),db:Session=Depends(get_db)):
    item=db.get(Submission,submission_id)
    if not item: raise HTTPException(status_code=404,detail="Submission not found")
    old=item.status.value; item.status=payload.status
    db.add(FollowUp(submission_id=item.id,actor_id=user.id,action="STATUS_CHANGED",note=payload.note,metadata_json={"from":old,"to":payload.status.value}))
    db.commit(); db.refresh(item); return item

@app.get("/api/v1/staff/surveys", response_model=list[SurveyOut])
def staff_surveys(_:User=Depends(require_staff),db:Session=Depends(get_db)):
    stmt=select(Survey).options(selectinload(Survey.questions).selectinload(SurveyQuestion.options)).order_by(Survey.created_at.desc())
    return list(db.scalars(stmt).unique())

@app.post("/api/v1/staff/surveys", response_model=SurveyOut, status_code=201)
def create_survey(payload:SurveyCreate,user:User=Depends(require_staff),db:Session=Depends(get_db)):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403,detail="Administrator role required")
    if not payload.applies_to_all_services and not payload.service_ids:
        raise HTTPException(status_code=422,detail="Choose at least one service or apply the survey to all services")
    valid_ids=set(db.scalars(select(Service.id).where(Service.id.in_(payload.service_ids)))) if payload.service_ids else set()
    if len(valid_ids)!=len(set(payload.service_ids)):
        raise HTTPException(status_code=422,detail="One or more service IDs are invalid")
    survey=Survey(title=payload.title.strip(),description=payload.description,applies_to_all_services=payload.applies_to_all_services,is_active=payload.is_active,created_by_id=user.id)
    db.add(survey); db.flush()
    for position,item in enumerate(payload.questions):
        question=SurveyQuestion(survey_id=survey.id,prompt=item.prompt.strip(),question_type=item.question_type,is_required=item.is_required,position=position,settings=item.settings)
        db.add(question); db.flush()
        for option_position,option in enumerate(item.options):
            db.add(SurveyQuestionOption(question_id=question.id,label=option.label.strip(),value=(option.value or option.label).strip(),position=option_position))
    if not payload.applies_to_all_services:
        for service_id in valid_ids:
            db.add(SurveyServiceAssignment(survey_id=survey.id,service_id=service_id))
    db.commit()
    return db.scalar(select(Survey).options(selectinload(Survey.questions).selectinload(SurveyQuestion.options)).where(Survey.id==survey.id))

@app.patch("/api/v1/staff/surveys/{survey_id}/active", response_model=SurveyOut)
def set_survey_active(survey_id:int,active:bool,user:User=Depends(require_staff),db:Session=Depends(get_db)):
    if user.role != UserRole.ADMIN: raise HTTPException(status_code=403,detail="Administrator role required")
    survey=db.get(Survey,survey_id)
    if not survey: raise HTTPException(status_code=404,detail="Survey not found")
    survey.is_active=active; db.commit()
    return db.scalar(select(Survey).options(selectinload(Survey.questions).selectinload(SurveyQuestion.options)).where(Survey.id==survey.id))

@app.get("/api/v1/staff/surveys/{survey_id}/summary", response_model=SurveySummary)
def survey_summary(survey_id:int,_:User=Depends(require_staff),db:Session=Depends(get_db)):
    survey=db.get(Survey,survey_id)
    if not survey: raise HTTPException(status_code=404,detail="Survey not found")
    responses=db.scalar(select(func.count()).select_from(SurveyResponse).where(SurveyResponse.survey_id==survey.id)) or 0
    return SurveySummary(survey_id=survey.id,title=survey.title,responses=responses,active=survey.is_active)

@app.get("/api/v1/staff/dashboard", response_model=DashboardSummary)
def dashboard(_:User=Depends(require_staff),db:Session=Depends(get_db)):
    def count_status(s): return db.scalar(select(func.count()).select_from(Submission).where(Submission.status==s)) or 0
    return DashboardSummary(total_submissions=db.scalar(select(func.count()).select_from(Submission)) or 0,submitted=count_status(SubmissionStatus.SUBMITTED),in_review=count_status(SubmissionStatus.IN_REVIEW),needs_follow_up=count_status(SubmissionStatus.NEEDS_FOLLOW_UP),completed=count_status(SubmissionStatus.COMPLETED),problematic_travels=db.scalar(select(func.count()).select_from(Travel).where(Travel.status==TravelStatus.PROBLEMATIC)) or 0)
