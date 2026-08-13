from datetime import datetime, timezone
from secrets import token_hex
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .config import get_settings
from .database import Base, engine, get_db
from .models import FollowUp, Service, Submission, SubmissionStatus, Travel, TravelStatus, User
from .schemas import DashboardSummary, LoginIn, ServiceOut, SubmissionCreate, SubmissionOut, SubmissionStatusUpdate, TokenOut, TravelOut, UserCreate, UserOut
from .security import create_access_token, get_current_user, hash_password, require_staff, verify_password

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", docs_url="/docs" if settings.app_env != "production" else None, redoc_url=None)
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

@app.get("/api/v1/staff/dashboard", response_model=DashboardSummary)
def dashboard(_:User=Depends(require_staff),db:Session=Depends(get_db)):
    def count_status(s): return db.scalar(select(func.count()).select_from(Submission).where(Submission.status==s)) or 0
    return DashboardSummary(total_submissions=db.scalar(select(func.count()).select_from(Submission)) or 0,submitted=count_status(SubmissionStatus.SUBMITTED),in_review=count_status(SubmissionStatus.IN_REVIEW),needs_follow_up=count_status(SubmissionStatus.NEEDS_FOLLOW_UP),completed=count_status(SubmissionStatus.COMPLETED),problematic_travels=db.scalar(select(func.count()).select_from(Travel).where(Travel.status==TravelStatus.PROBLEMATIC)) or 0)
