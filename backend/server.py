"""
═══════════════════════════════════════════════════════════════════════════
 OEH WIRTSCHAFT - BACKEND API
 News & Admin System | Johannes-Kepler-Universitaet Linz
═══════════════════════════════════════════════════════════════════════════

 BESCHREIBUNG:
 FastAPI Backend mit PostgreSQL Datenbank.
 Verwaltet News, Events, Team, LVAs, Partner, und mehr.

───────────────────────────────────────────────────────────────────────────
 Entwickelt von:     Raphael Boehmer
 Unternehmen:        Astra Capital e.U.
 Website:            https://astra-capital.eu
═══════════════════════════════════════════════════════════════════════════
"""

import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.header import Header
from email.utils import formataddr
from email import encoders
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from contextlib import contextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form as FastAPIForm, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt

from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import enum
import html as html_module
import json
import re
import threading
import time

# ─── LOGIN RATE LIMITING ────────────────────────────────────────────────────
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 180

_login_attempts = {}
_login_lock = threading.Lock()

def _cleanup_expired_lockouts():
    now = time.time()
    expired = [k for k, v in _login_attempts.items() if v["locked_until"] and now >= v["locked_until"]]
    for k in expired:
        del _login_attempts[k]

def check_login_rate_limit(identifier: str):
    now = time.time()
    with _login_lock:
        _cleanup_expired_lockouts()
        entry = _login_attempts.get(identifier)
        if entry and entry["locked_until"] and now < entry["locked_until"]:
            remaining = int(entry["locked_until"] - now)
            raise HTTPException(
                status_code=429,
                detail=f"Zu viele Anmeldeversuche. Bitte warte {remaining} Sekunden."
            )

def record_failed_login(identifier: str):
    now = time.time()
    with _login_lock:
        entry = _login_attempts.get(identifier, {"count": 0, "locked_until": None})
        entry["count"] += 1
        if entry["count"] >= LOGIN_MAX_ATTEMPTS:
            entry["locked_until"] = now + LOGIN_LOCKOUT_SECONDS
        _login_attempts[identifier] = entry

def clear_login_attempts(identifier: str):
    with _login_lock:
        _login_attempts.pop(identifier, None)

# ─── GENERAL RATE LIMITING ──────────────────────────────────────────────────
_rate_limit_store = {}
_rate_limit_lock = threading.Lock()

def _cleanup_rate_limits():
    now = time.time()
    expired = [k for k, v in _rate_limit_store.items() if now >= v["expires_at"]]
    for k in expired:
        del _rate_limit_store[k]

def check_rate_limit(category: str, identifier: str, max_requests: int, window_seconds: int):
    key = f"{category}:{identifier}"
    now = time.time()
    with _rate_limit_lock:
        _cleanup_rate_limits()
        entry = _rate_limit_store.get(key)
        if entry:
            if now < entry["expires_at"]:
                if entry["count"] >= max_requests:
                    remaining = int(entry["expires_at"] - now)
                    raise HTTPException(
                        status_code=429,
                        detail=f"Zu viele Anfragen. Bitte warte {remaining} Sekunden."
                    )
                entry["count"] += 1
            else:
                _rate_limit_store[key] = {"count": 1, "expires_at": now + window_seconds}
        else:
            _rate_limit_store[key] = {"count": 1, "expires_at": now + window_seconds}

def get_client_ip(request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"

# ─── CONFIGURATION ──────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./oeh_wirtschaft.db")
SECRET_KEY = os.environ.get("SECRET_KEY", "")
MASTER_ADMIN_USERNAME = os.environ.get("MASTER_ADMIN_USERNAME", "")
MASTER_ADMIN_PASSWORD = os.environ.get("MASTER_ADMIN_PASSWORD", "")
MASTER_ADMIN_EMAIL = os.environ.get("MASTER_ADMIN_EMAIL", "")

TESTMODE = os.environ.get("TESTMODE", "false").lower() == "true"
TESTMODE_PASSWORD = os.environ.get("TESTMODE_PASSWORD", "")

_required_env_vars = {
    "SECRET_KEY": SECRET_KEY,
    "MASTER_ADMIN_USERNAME": MASTER_ADMIN_USERNAME,
    "MASTER_ADMIN_PASSWORD": MASTER_ADMIN_PASSWORD,
    "MASTER_ADMIN_EMAIL": MASTER_ADMIN_EMAIL,
}
_missing = [k for k, v in _required_env_vars.items() if not v]
if TESTMODE and not TESTMODE_PASSWORD:
    _missing.append("TESTMODE_PASSWORD (weil TESTMODE=true)")
if _missing:
    print("=" * 60)
    print("FATAL: Fehlende Umgebungsvariablen - Server kann nicht starten!")
    print(f"  Fehlend: {', '.join(_missing)}")
    print("Bitte setze diese Variablen in der .env oder docker-compose.yml")
    print("=" * 60)
    import sys
    sys.exit(1)

# Port Configuration
INTERNAL_PORT = int(os.environ.get("BACKEND_INTERNAL_PORT", 8000))
EXTERNAL_PORT = int(os.environ.get("BACKEND_PORT", 8242))
BACKEND_HOST = os.environ.get("BACKEND_HOST", "localhost")

# SMTP Configuration
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", "") or SMTP_USER  # Falls leer, nimm SMTP_USER
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "ÖH Wirtschaft JKU")
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"

# Allowed Email Domains (comma-separated, e.g. "@students.jku.at,@jku.at")
ALLOWED_EMAIL_DOMAINS_RAW = os.environ.get("ALLOWED_EMAIL_DOMAINS", "@students.jku.at")
ALLOWED_EMAIL_DOMAINS = [d.strip() for d in ALLOWED_EMAIL_DOMAINS_RAW.split(",") if d.strip()]

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# ─── DATABASE SETUP ─────────────────────────────────────────────────────────
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ─── ENUMS ──────────────────────────────────────────────────────────────────
class NewsPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NewsColor(str, enum.Enum):
    BLUE = "blue"
    GOLD = "gold"
    GREEN = "green"
    RED = "red"
    PURPLE = "purple"
    SLATE = "slate"

class AdminRole(str, enum.Enum):
    MASTER = "master"
    ADMIN = "admin"
    EDITOR = "editor"

class EventColor(str, enum.Enum):
    BLUE = "blue"
    GOLD = "gold"
    GREEN = "green"
    RED = "red"
    PURPLE = "purple"
    PINK = "pink"
    TEAL = "teal"
    ORANGE = "orange"

# ─── DATABASE MODELS ────────────────────────────────────────────────────────
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(Text, nullable=False, default="{}")
    color = Column(String(20), default="blue")
    is_system = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    admins = relationship("Admin", back_populates="custom_role")

    def get_permissions(self):
        try:
            return json.loads(self.permissions)
        except:
            return {}

    def set_permissions(self, perms):
        self.permissions = json.dumps(perms)

    def has_permission(self, section, action="view"):
        perms = self.get_permissions()
        section_perms = perms.get(section, {})
        return section_perms.get(action, False)

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(AdminRole), default=AdminRole.ADMIN)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_master = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)

    custom_role = relationship("Role", back_populates="admins")
    news_posts = relationship("News", back_populates="author")
    activity_logs = relationship("ActivityLog", back_populates="admin")

    def has_permission(self, section, action="view"):
        if self.is_master:
            return True
        if self.custom_role:
            return self.custom_role.has_permission(section, action)
        return False

class News(Base):
    __tablename__ = "news"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(String(300), nullable=True)
    priority = Column(SQLEnum(NewsPriority), default=NewsPriority.MEDIUM)
    color = Column(SQLEnum(NewsColor), default=NewsColor.BLUE)
    is_published = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    author_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    published_at = Column(DateTime, nullable=True)
    
    author = relationship("Admin", back_populates="news_posts")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    action = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    admin = relationship("Admin", back_populates="activity_logs")

class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ParticipationType(str, enum.Enum):
    YES = "yes"
    MAYBE = "maybe"

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    all_day = Column(Boolean, default=False)
    location = Column(String(200), nullable=True)
    color = Column(SQLEnum(EventColor), default=EventColor.BLUE)
    tags = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=True)
    registration_required = Column(Boolean, default=False)
    max_participants = Column(Integer, nullable=True)
    registration_deadline = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = relationship("Admin")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("calendar_events.id"), nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    study_program = Column(String(200), nullable=True)
    participation_type = Column(SQLEnum(ParticipationType), default=ParticipationType.YES)
    status = Column(SQLEnum(RegistrationStatus), default=RegistrationStatus.PENDING)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    event = relationship("CalendarEvent", back_populates="registrations")

# ─── STUDIENGANG MODELS ─────────────────────────────────────────────────────
class StudyCategory(Base):
    """Kategorien/Bereiche von Studiengängen (Bachelor, Master, MBA, ULG)"""
    __tablename__ = "study_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), default="blue")  # blue, gold, green, etc.
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    programs = relationship("StudyProgram", back_populates="category", cascade="all, delete-orphan")

class StudyProgram(Base):
    """Einzelne Studiengänge innerhalb einer Kategorie"""
    __tablename__ = "study_programs"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("study_categories.id"), nullable=False)
    name = Column(String(200), nullable=False)
    short_name = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    category = relationship("StudyCategory", back_populates="programs")
    updates = relationship("StudyUpdate", back_populates="program", cascade="all, delete-orphan")

class StudyUpdate(Base):
    """Updates/News für einzelne Studiengänge"""
    __tablename__ = "study_updates"
    
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("study_programs.id"), nullable=False)
    content = Column(Text, nullable=False)
    semester = Column(String(50), nullable=True)  # z.B. "Wintersemester 2025/26"
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    program = relationship("StudyProgram", back_populates="updates")
    creator = relationship("Admin")

# ─── LVA (LEHRVERANSTALTUNG) MODELS ─────────────────────────────────────────
class LVA(Base):
    """Lehrveranstaltungen (Courses)"""
    __tablename__ = "lvas"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    ratings = relationship("LVARating", back_populates="lva", cascade="all, delete-orphan")

class LVARating(Base):
    """Bewertungen für LVAs"""
    __tablename__ = "lva_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    lva_id = Column(Integer, ForeignKey("lvas.id"), nullable=False)
    effort_rating = Column(Integer, nullable=False)  # 1-5 (Aufwand)
    difficulty_rating = Column(Integer, nullable=False)  # 1-5 (Schwierigkeit)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    lva = relationship("LVA", back_populates="ratings")

class VerificationCode(Base):
    """Verifizierungscodes für LVA-Bewertungen"""
    __tablename__ = "verification_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), nullable=True)  # Nullable for admin-created codes
    code = Column(String(10), nullable=False)
    name = Column(String(100), nullable=True)  # Optional name/description for admin codes
    lva_id = Column(Integer, ForeignKey("lvas.id"), nullable=True)  # Nullable for universal codes
    is_used = Column(Boolean, default=False)
    max_uses = Column(Integer, default=1)  # How many times the code can be used
    use_count = Column(Integer, default=0)  # How many times it has been used
    is_admin_code = Column(Boolean, default=False)  # True if created by admin
    created_by_admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AppSettings(Base):
    """App-Einstellungen (z.B. Kontakt-E-Mail-Empfänger)"""
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class PartnerType(str, enum.Enum):
    PARTNER = "partner"
    SPONSOR = "sponsor"

class Partner(Base):
    """Partnerunternehmen für Partner/Sponsoren-Bereich"""
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    logo_url = Column(Text, nullable=False)
    website_url = Column(String(500), nullable=False)
    partner_type = Column(SQLEnum(PartnerType), default=PartnerType.PARTNER, nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def get_partner_type_value(self):
        """Safe getter for partner_type that handles missing column"""
        try:
            if self.partner_type:
                return self.partner_type.value
        except:
            pass
        return "partner"

# ─── APP ASSETS MODEL ────────────────────────────────────────────────────────
class AppAsset(Base):
    """Static assets stored in database for portability"""
    __tablename__ = "app_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_key = Column(Text, unique=True, nullable=False, index=True)
    filename = Column(Text, nullable=False)
    mime_type = Column(Text, nullable=False)
    data = Column(Text, nullable=False)
    category = Column(Text, nullable=False, default='misc')
    alt_text = Column(Text, nullable=True)
    file_hash = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# ─── SURVEY MODELS ───────────────────────────────────────────────────────────
class SurveyQuestionType(str, enum.Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    DROPDOWN = "dropdown"
    SCALE = "scale"
    DATE = "date"
    EMAIL = "email"
    NUMBER = "number"

class Survey(Base):
    """Umfrage-Formular"""
    __tablename__ = "surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    title_de = Column(String(300), nullable=False)
    title_en = Column(String(300), nullable=True)
    description_de = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    show_banner = Column(Boolean, default=True)
    banner_text_de = Column(String(200), nullable=True)
    banner_text_en = Column(String(200), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    raffle_enabled = Column(Boolean, default=False)
    raffle_description_de = Column(Text, nullable=True)
    raffle_description_en = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    questions = relationship("SurveyQuestion", back_populates="survey", cascade="all, delete-orphan", order_by="SurveyQuestion.sort_order")
    responses = relationship("SurveyResponse", back_populates="survey", cascade="all, delete-orphan")

class SurveyQuestion(Base):
    """Frage in einer Umfrage"""
    __tablename__ = "survey_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    question_de = Column(Text, nullable=False)
    question_en = Column(Text, nullable=True)
    question_type = Column(SQLEnum(SurveyQuestionType), default=SurveyQuestionType.TEXT)
    is_required = Column(Boolean, default=False)
    options = Column(JSON, nullable=True)  # For choice questions: [{value, label_de, label_en}]
    settings = Column(JSON, nullable=True)  # min, max, placeholder, etc.
    condition = Column(JSON, nullable=True)  # {question_id, operator, value} for conditional display
    sort_order = Column(Integer, default=0)
    
    survey = relationship("Survey", back_populates="questions")
    answers = relationship("SurveyAnswer", back_populates="question", cascade="all, delete-orphan")

class SurveyResponse(Base):
    """Einreichung einer Umfrage"""
    __tablename__ = "survey_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    participant_email = Column(String(200), nullable=True)
    raffle_participated = Column(Boolean, default=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ip_hash = Column(String(64), nullable=True)  # Anonymized for duplicate prevention
    
    survey = relationship("Survey", back_populates="responses")
    answers = relationship("SurveyAnswer", back_populates="response", cascade="all, delete-orphan")

class SurveyAnswer(Base):
    """Einzelne Antwort auf eine Frage"""
    __tablename__ = "survey_answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("survey_responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("survey_questions.id"), nullable=False)
    answer_value = Column(Text, nullable=True)  # JSON for multiple choice

    response = relationship("SurveyResponse", back_populates="answers")
    question = relationship("SurveyQuestion", back_populates="answers")

class DeveloperChangelog(Base):
    """Changelog/History entries managed by Master Admin"""
    __tablename__ = "developer_changelog"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    changes = Column(JSON, nullable=True)
    changelog_type = Column(String(20), default="website")
    release_date = Column(DateTime, nullable=False)
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = relationship("Admin")

class AdminNotification(Base):
    """Admin Benachrichtigungen fur Dashboard"""
    __tablename__ = "admin_notifications"

    id = Column(Integer, primary_key=True, index=True)
    section = Column(String(50), nullable=False)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    read_status = relationship("NotificationReadStatus", back_populates="notification", cascade="all, delete-orphan")

class NotificationReadStatus(Base):
    """Gelesen-Status pro Admin pro Notification"""
    __tablename__ = "notification_read_status"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("admin_notifications.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    read_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    notification = relationship("AdminNotification", back_populates="read_status")
    admin = relationship("Admin")

# ─── KANBAN MODELS ───────────────────────────────────────────────────────────
class KanbanTaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class KanbanBoard(Base):
    __tablename__ = "kanban_boards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), default="blue")
    is_private = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("Admin")
    columns = relationship("KanbanColumn", back_populates="board", cascade="all, delete-orphan", order_by="KanbanColumn.sort_order")
    members = relationship("KanbanBoardMember", back_populates="board", cascade="all, delete-orphan")
    labels = relationship("KanbanLabel", back_populates="board", cascade="all, delete-orphan")

class KanbanBoardMember(Base):
    __tablename__ = "kanban_board_members"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("kanban_boards.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    can_edit = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    board = relationship("KanbanBoard", back_populates="members")
    admin = relationship("Admin")

class KanbanColumn(Base):
    __tablename__ = "kanban_columns"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("kanban_boards.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="slate")
    sort_order = Column(Integer, default=0)
    wip_limit = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    board = relationship("KanbanBoard", back_populates="columns")
    tasks = relationship("KanbanTask", back_populates="column", cascade="all, delete-orphan", order_by="KanbanTask.sort_order")

class KanbanLabel(Base):
    __tablename__ = "kanban_labels"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("kanban_boards.id"), nullable=False)
    name = Column(String(50), nullable=False)
    color = Column(String(20), default="blue")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    board = relationship("KanbanBoard", back_populates="labels")

class KanbanTask(Base):
    __tablename__ = "kanban_tasks"

    id = Column(Integer, primary_key=True, index=True)
    column_id = Column(Integer, ForeignKey("kanban_columns.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SQLEnum(KanbanTaskPriority), default=KanbanTaskPriority.MEDIUM)
    due_date = Column(DateTime, nullable=True)
    sort_order = Column(Integer, default=0)
    labels = Column(Text, default="[]")
    assignee_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    column = relationship("KanbanColumn", back_populates="tasks")
    assignee = relationship("Admin", foreign_keys=[assignee_id])
    creator = relationship("Admin", foreign_keys=[created_by])
    comments = relationship("KanbanComment", back_populates="task", cascade="all, delete-orphan", order_by="KanbanComment.created_at.desc()")
    checklist_items = relationship("KanbanChecklist", back_populates="task", cascade="all, delete-orphan", order_by="KanbanChecklist.sort_order")

    def get_labels(self):
        try:
            return json.loads(self.labels)
        except:
            return []

    def set_labels(self, label_ids):
        self.labels = json.dumps(label_ids)

class KanbanComment(Base):
    __tablename__ = "kanban_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("kanban_tasks.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    task = relationship("KanbanTask", back_populates="comments")
    admin = relationship("Admin")

class KanbanChecklist(Base):
    __tablename__ = "kanban_checklists"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("kanban_tasks.id"), nullable=False)
    text = Column(String(500), nullable=False)
    is_completed = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    task = relationship("KanbanTask", back_populates="checklist_items")

# ─── PYDANTIC SCHEMAS ───────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    admin: dict

class RoleCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: dict
    color: str = "blue"

class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[dict] = None
    color: Optional[str] = None

class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    permissions: dict
    color: str
    is_system: bool
    sort_order: int
    created_at: datetime
    user_count: int = 0

class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str
    role_id: Optional[int] = None

class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class AdminResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: str
    role: str
    role_id: Optional[int]
    role_name: Optional[str]
    role_color: Optional[str]
    permissions: dict
    is_active: bool
    is_master: bool
    created_at: datetime
    last_login: Optional[datetime]

class NewsCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    priority: NewsPriority = NewsPriority.MEDIUM
    color: NewsColor = NewsColor.BLUE
    is_published: bool = False
    is_pinned: bool = False

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    priority: Optional[NewsPriority] = None
    color: Optional[NewsColor] = None
    is_published: Optional[bool] = None
    is_pinned: Optional[bool] = None

class NewsResponse(BaseModel):
    id: int
    title: str
    content: str
    excerpt: Optional[str]
    priority: str
    color: str
    is_published: bool
    is_pinned: bool
    views: int
    author_id: int
    author_name: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]

class StatsResponse(BaseModel):
    total_news: int
    published_news: int
    draft_news: int
    total_views: int
    total_admins: int
    active_admins: int
    news_by_priority: dict
    recent_activity: list
    total_events: int = 0
    total_registrations: int = 0
    total_lva_ratings: int = 0
    total_survey_responses: int = 0

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    bereich: str = ""
    subject: Optional[str] = ""
    message: str = ""
    studium: Optional[str] = None
    anliegen: Optional[str] = None
    semester: Optional[str] = None
    nachricht: Optional[str] = None
    lv_name: Optional[str] = None
    beschreibung: Optional[str] = None
    lehrperson_name: Optional[str] = None
    lehrveranstaltung: Optional[str] = None

# Study Program Schemas
class StudyCategoryCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    color: str = "blue"
    sort_order: int = 0

class StudyCategoryUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None

class StudyProgramCreate(BaseModel):
    category_id: int
    name: str
    short_name: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True

class StudyProgramUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class StudyUpdateCreate(BaseModel):
    program_id: int
    content: str
    semester: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class StudyUpdateUpdate(BaseModel):
    program_id: Optional[int] = None
    content: Optional[str] = None
    semester: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

# Survey Schemas
class SurveyQuestionCreate(BaseModel):
    question_de: str
    question_en: Optional[str] = None
    question_type: str = "text"
    is_required: bool = False
    options: Optional[list] = None
    settings: Optional[dict] = None
    condition: Optional[dict] = None
    sort_order: int = 0

class SurveyQuestionUpdate(BaseModel):
    question_de: Optional[str] = None
    question_en: Optional[str] = None
    question_type: Optional[str] = None
    is_required: Optional[bool] = None
    options: Optional[list] = None
    settings: Optional[dict] = None
    condition: Optional[dict] = None
    sort_order: Optional[int] = None

class SurveyCreate(BaseModel):
    title_de: str
    title_en: Optional[str] = None
    description_de: Optional[str] = None
    description_en: Optional[str] = None
    banner_text_de: Optional[str] = None
    banner_text_en: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    raffle_enabled: bool = False
    raffle_description_de: Optional[str] = None
    raffle_description_en: Optional[str] = None
    questions: List[SurveyQuestionCreate] = []

class SurveyUpdate(BaseModel):
    title_de: Optional[str] = None
    title_en: Optional[str] = None
    description_de: Optional[str] = None
    description_en: Optional[str] = None
    is_active: Optional[bool] = None
    show_banner: Optional[bool] = None
    banner_text_de: Optional[str] = None
    banner_text_en: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    raffle_enabled: Optional[bool] = None
    raffle_description_de: Optional[str] = None
    raffle_description_en: Optional[str] = None

class SurveySubmit(BaseModel):
    answers: dict = {}
    email: Optional[str] = None
    participate_raffle: Optional[bool] = False

    class Config:
        extra = "ignore"

# LVA Schemas
class LVACreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class LVAUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class LVAResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    rating_count: int
    avg_effort: Optional[float]
    avg_difficulty: Optional[float]
    avg_total: Optional[float]
    effort_text: Optional[str]
    effort_color: Optional[str]
    difficulty_text: Optional[str]
    difficulty_color: Optional[str]
    total_text: Optional[str]
    total_color: Optional[str]

class RequestCodeRequest(BaseModel):
    email: EmailStr
    lva_id: int

class VerifyCodeRequest(BaseModel):
    email: Optional[str] = None  # Optional for admin codes
    code: str
    lva_id: int

class SubmitRatingRequest(BaseModel):
    email: Optional[str] = None  # Optional for admin codes
    code: str
    lva_id: int
    effort_rating: int
    difficulty_rating: int

# Calendar Event Schemas
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    all_day: bool = False
    location: Optional[str] = None
    color: EventColor = EventColor.BLUE
    tags: Optional[str] = None
    is_public: bool = True
    registration_required: bool = False
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    color: Optional[EventColor] = None
    tags: Optional[str] = None
    is_public: Optional[bool] = None
    registration_required: Optional[bool] = None
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    all_day: bool
    location: Optional[str]
    color: str
    tags: Optional[str]
    is_public: bool
    registration_required: bool = False
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    registration_count: int = 0
    created_by: int
    creator_name: str
    created_at: datetime
    updated_at: datetime

class EventRegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    study_program: Optional[str] = None
    participation_type: str = "yes"

class EventRegistrationUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class EventRegistrationResponse(BaseModel):
    id: int
    event_id: int
    event_title: str
    name: str
    email: str
    study_program: Optional[str]
    participation_type: str
    status: str
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

class NotificationResponse(BaseModel):
    id: int
    section: str
    title: str
    message: str
    details: Optional[dict]
    created_at: datetime
    is_read: bool = False

class NotificationMarkRead(BaseModel):
    notification_id: int

# Kanban Schemas
class KanbanBoardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "blue"
    is_private: bool = False

class KanbanBoardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_private: Optional[bool] = None
    is_archived: Optional[bool] = None

class KanbanColumnCreate(BaseModel):
    name: str
    color: str = "slate"
    wip_limit: Optional[int] = None

class KanbanColumnUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    wip_limit: Optional[int] = None

class KanbanTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None
    labels: List[int] = []
    assignee_id: Optional[int] = None

class KanbanTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    labels: Optional[List[int]] = None
    assignee_id: Optional[int] = None
    column_id: Optional[int] = None
    sort_order: Optional[int] = None
    is_completed: Optional[bool] = None

class KanbanTaskMove(BaseModel):
    column_id: int
    sort_order: int

class KanbanLabelCreate(BaseModel):
    name: str
    color: str = "blue"

class KanbanLabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class KanbanCommentCreate(BaseModel):
    content: str

class KanbanChecklistCreate(BaseModel):
    text: str

class KanbanChecklistUpdate(BaseModel):
    text: Optional[str] = None
    is_completed: Optional[bool] = None
    sort_order: Optional[int] = None

class KanbanBoardMemberAdd(BaseModel):
    admin_id: int
    can_edit: bool = True

class KanbanColumnsReorder(BaseModel):
    column_ids: List[int]

class KanbanTasksReorder(BaseModel):
    task_orders: List[dict]

# ─── FASTAPI APP ────────────────────────────────────────────────────────────
app = FastAPI(title="ÖH Wirtschaft API", version="2.0.0")

ALLOWED_ORIGINS = [
    "https://oehwirtschaft.at",
    "https://www.oehwirtschaft.at",
    "https://api.oehwirtschaft.at",
    "http://localhost:1237",
    "http://localhost:3000",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler that ensures CORS headers are always sent"""
    from fastapi.responses import JSONResponse
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
        }

    error_msg = str(exc)
    print(f"Global exception: {error_msg}")

    if hasattr(exc, 'status_code'):
        status_code = exc.status_code
        client_msg = error_msg
    else:
        status_code = 500
        client_msg = "Ein interner Serverfehler ist aufgetreten."

    return JSONResponse(
        status_code=status_code,
        content={"detail": client_msg},
        headers=headers
    )

# ─── DATABASE DEPENDENCY ────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── AUTO-MIGRATION FOR NEW COLUMNS (PostgreSQL only) ───────────────────────
def run_migrations():
    """Automatically add new columns to existing tables - PostgreSQL only"""
    from sqlalchemy import text

    if 'postgresql' not in DATABASE_URL:
        print("Migrations skipped (SQLite mode)")
        return

    print("Running PostgreSQL migrations...")

    migrations = [
        ("create roles table", """
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                permissions TEXT NOT NULL DEFAULT '{}',
                color VARCHAR(20) DEFAULT 'blue',
                is_system BOOLEAN DEFAULT FALSE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create app_settings table", """
            CREATE TABLE IF NOT EXISTS app_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create study_categories table", """
            CREATE TABLE IF NOT EXISTS study_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(200) NOT NULL,
                description TEXT,
                color VARCHAR(20) DEFAULT 'blue',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create study_programs table", """
            CREATE TABLE IF NOT EXISTS study_programs (
                id SERIAL PRIMARY KEY,
                category_id INTEGER NOT NULL REFERENCES study_categories(id) ON DELETE CASCADE,
                name VARCHAR(200) NOT NULL,
                short_name VARCHAR(50),
                description TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create study_updates table", """
            CREATE TABLE IF NOT EXISTS study_updates (
                id SERIAL PRIMARY KEY,
                program_id INTEGER NOT NULL REFERENCES study_programs(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                semester VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                sort_order INTEGER DEFAULT 0,
                created_by INTEGER NOT NULL REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create lvas table", """
            CREATE TABLE IF NOT EXISTS lvas (
                id SERIAL PRIMARY KEY,
                name VARCHAR(300) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create lva_ratings table", """
            CREATE TABLE IF NOT EXISTS lva_ratings (
                id SERIAL PRIMARY KEY,
                lva_id INTEGER NOT NULL REFERENCES lvas(id) ON DELETE CASCADE,
                effort_rating INTEGER NOT NULL,
                difficulty_rating INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create verification_codes table", """
            CREATE TABLE IF NOT EXISTS verification_codes (
                id SERIAL PRIMARY KEY,
                email VARCHAR(200),
                code VARCHAR(10) NOT NULL,
                name VARCHAR(100),
                lva_id INTEGER REFERENCES lvas(id),
                is_used BOOLEAN DEFAULT FALSE,
                max_uses INTEGER DEFAULT 1,
                use_count INTEGER DEFAULT 0,
                is_admin_code BOOLEAN DEFAULT FALSE,
                created_by_admin_id INTEGER,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create partners table", """
            CREATE TABLE IF NOT EXISTS partners (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                logo_url TEXT NOT NULL,
                website_url VARCHAR(500) NOT NULL,
                partner_type VARCHAR(20) DEFAULT 'partner',
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create surveys table", """
            CREATE TABLE IF NOT EXISTS surveys (
                id SERIAL PRIMARY KEY,
                title_de VARCHAR(300) NOT NULL,
                title_en VARCHAR(300),
                description_de TEXT,
                description_en TEXT,
                is_active BOOLEAN DEFAULT FALSE,
                show_banner BOOLEAN DEFAULT TRUE,
                banner_text_de VARCHAR(200),
                banner_text_en VARCHAR(200),
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                raffle_enabled BOOLEAN DEFAULT FALSE,
                raffle_description_de TEXT,
                raffle_description_en TEXT,
                created_by INTEGER NOT NULL REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create survey_questions table", """
            CREATE TABLE IF NOT EXISTS survey_questions (
                id SERIAL PRIMARY KEY,
                survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
                question_de TEXT NOT NULL,
                question_en TEXT,
                question_type VARCHAR(20) DEFAULT 'text',
                is_required BOOLEAN DEFAULT FALSE,
                options JSONB,
                settings JSONB,
                condition JSONB,
                sort_order INTEGER DEFAULT 0
            )
        """),
        ("create survey_responses table", """
            CREATE TABLE IF NOT EXISTS survey_responses (
                id SERIAL PRIMARY KEY,
                survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
                participant_email VARCHAR(200),
                raffle_participated BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_hash VARCHAR(64)
            )
        """),
        ("create survey_answers table", """
            CREATE TABLE IF NOT EXISTS survey_answers (
                id SERIAL PRIMARY KEY,
                response_id INTEGER NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
                question_id INTEGER NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
                answer_value TEXT
            )
        """),
        ("create developer_changelog table", """
            CREATE TABLE IF NOT EXISTS developer_changelog (
                id SERIAL PRIMARY KEY,
                version VARCHAR(50) NOT NULL,
                title VARCHAR(300) NOT NULL,
                description TEXT,
                changes JSONB,
                changelog_type VARCHAR(20) DEFAULT 'website',
                release_date TIMESTAMP NOT NULL,
                created_by INTEGER NOT NULL REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("add changelog_type column to developer_changelog", """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'developer_changelog' AND column_name = 'changelog_type'
                ) THEN
                    ALTER TABLE developer_changelog ADD COLUMN changelog_type VARCHAR(20) DEFAULT 'website';
                END IF;
            END $$;
        """),
        ("create event_registrations table", """
            CREATE TABLE IF NOT EXISTS event_registrations (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
                name VARCHAR(200) NOT NULL,
                email VARCHAR(200) NOT NULL,
                study_program VARCHAR(200),
                participation_type VARCHAR(20) DEFAULT 'yes',
                status VARCHAR(20) DEFAULT 'pending',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("verification_codes max_uses", "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1"),
        ("verification_codes use_count", "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0"),
        ("verification_codes is_admin_code", "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS is_admin_code BOOLEAN DEFAULT FALSE"),
        ("verification_codes created_by_admin_id", "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER"),
        ("verification_codes name", "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS name VARCHAR(100)"),
        ("verification_codes email nullable", "ALTER TABLE verification_codes ALTER COLUMN email DROP NOT NULL"),
        ("verification_codes lva_id nullable", "ALTER TABLE verification_codes ALTER COLUMN lva_id DROP NOT NULL"),
        ("admins role_id", "ALTER TABLE admins ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id)"),
        ("calendar_events registration_required", "ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT FALSE"),
        ("calendar_events max_participants", "ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS max_participants INTEGER"),
        ("calendar_events registration_deadline", "ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP"),
        ("partners logo_url to text", "ALTER TABLE partners ALTER COLUMN logo_url TYPE TEXT"),
        ("partners partner_type column", "ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type VARCHAR(20) DEFAULT 'partner'"),
        ("create admin_notifications table", """
            CREATE TABLE IF NOT EXISTS admin_notifications (
                id SERIAL PRIMARY KEY,
                section VARCHAR(50) NOT NULL,
                title VARCHAR(300) NOT NULL,
                message TEXT NOT NULL,
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create notification_read_status table", """
            CREATE TABLE IF NOT EXISTS notification_read_status (
                id SERIAL PRIMARY KEY,
                notification_id INTEGER NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
                admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(notification_id, admin_id)
            )
        """),
        ("create kanban_boards table", """
            CREATE TABLE IF NOT EXISTS kanban_boards (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                color VARCHAR(20) DEFAULT 'blue',
                is_private BOOLEAN DEFAULT FALSE,
                owner_id INTEGER NOT NULL REFERENCES admins(id),
                is_archived BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create kanban_board_members table", """
            CREATE TABLE IF NOT EXISTS kanban_board_members (
                id SERIAL PRIMARY KEY,
                board_id INTEGER NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
                admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
                can_edit BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(board_id, admin_id)
            )
        """),
        ("create kanban_columns table", """
            CREATE TABLE IF NOT EXISTS kanban_columns (
                id SERIAL PRIMARY KEY,
                board_id INTEGER NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(20) DEFAULT 'slate',
                sort_order INTEGER DEFAULT 0,
                wip_limit INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create kanban_labels table", """
            CREATE TABLE IF NOT EXISTS kanban_labels (
                id SERIAL PRIMARY KEY,
                board_id INTEGER NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
                name VARCHAR(50) NOT NULL,
                color VARCHAR(20) DEFAULT 'blue',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create kanban_tasks table", """
            CREATE TABLE IF NOT EXISTS kanban_tasks (
                id SERIAL PRIMARY KEY,
                column_id INTEGER NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
                title VARCHAR(300) NOT NULL,
                description TEXT,
                priority VARCHAR(20) DEFAULT 'medium',
                due_date TIMESTAMP,
                sort_order INTEGER DEFAULT 0,
                labels TEXT DEFAULT '[]',
                assignee_id INTEGER REFERENCES admins(id),
                created_by INTEGER NOT NULL REFERENCES admins(id),
                is_completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create kanban_comments table", """
            CREATE TABLE IF NOT EXISTS kanban_comments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
                admin_id INTEGER NOT NULL REFERENCES admins(id),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create kanban_checklists table", """
            CREATE TABLE IF NOT EXISTS kanban_checklists (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
                text VARCHAR(500) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("create app_assets table", """
            CREATE TABLE IF NOT EXISTS app_assets (
                id SERIAL PRIMARY KEY,
                asset_key TEXT UNIQUE NOT NULL,
                filename TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                data TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'misc',
                alt_text TEXT,
                file_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """),
        ("app_assets add file_hash column", "ALTER TABLE app_assets ADD COLUMN IF NOT EXISTS file_hash TEXT"),
    ]

    for name, migration in migrations:
        try:
            with engine.connect() as conn:
                conn.execute(text(migration))
                conn.commit()
                print(f"  + Migration: {name}")
        except Exception as e:
            if "already exists" not in str(e).lower() and "duplicate" not in str(e).lower():
                print(f"  - Migration {name} skipped: {str(e)[:50]}")

    print("Migrations completed")

TABLES_WITH_SERIAL = [
    "admins", "roles", "news", "activity_logs", "calendar_events",
    "event_registrations", "study_categories", "study_programs",
    "study_updates", "lvas", "lva_ratings", "verification_codes",
    "app_settings", "partners", "surveys", "survey_questions",
    "survey_responses", "survey_answers", "developer_changelog",
    "admin_notifications", "notification_read_status", "app_assets",
    "kanban_boards", "kanban_board_members", "kanban_columns",
    "kanban_labels", "kanban_tasks", "kanban_comments", "kanban_checklists",
]

_SAFE_IDENTIFIER_RE = re.compile(r'^[a-z_][a-z0-9_]*$')

def _validate_table_name(table_name: str):
    if table_name not in TABLES_WITH_SERIAL or not _SAFE_IDENTIFIER_RE.match(table_name):
        raise ValueError(f"Invalid table name: {table_name}")
    return table_name

def fix_sequence(db: Session, table_name: str):
    from sqlalchemy import text
    if 'postgresql' not in DATABASE_URL:
        return
    safe_table = _validate_table_name(table_name)
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f'SELECT MAX(id) FROM "{safe_table}"'))
            max_id = result.scalar()
            if max_id is not None:
                seq_name = f"{safe_table}_id_seq"
                conn.execute(text(f"SELECT setval('{seq_name}', :max_id, true)"), {"max_id": max_id})
                conn.commit()
    except Exception as e:
        print(f"fix_sequence error for {safe_table}: {e}")

def reset_all_sequences():
    from sqlalchemy import text
    if 'postgresql' not in DATABASE_URL:
        return
    try:
        with engine.connect() as conn:
            for table in TABLES_WITH_SERIAL:
                try:
                    safe_table = _validate_table_name(table)
                    result = conn.execute(text(f'SELECT MAX(id) FROM "{safe_table}"'))
                    max_id = result.scalar()
                    if max_id is not None:
                        seq_name = f"{safe_table}_id_seq"
                        conn.execute(text(f"SELECT setval('{seq_name}', :max_id, true)"), {"max_id": max_id})
                except Exception:
                    pass
            conn.commit()
            print("  + All sequences synchronized")
    except Exception as e:
        print(f"  - Sequence reset error: {str(e)[:80]}")

def safe_add_and_commit(db: Session, obj, table_name: str):
    """Safely add an object and commit, auto-fixing sequence on duplicate key error."""
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy.orm import make_transient

    fix_sequence(db, table_name)
    for attempt in range(10):
        try:
            db.add(obj)
            db.commit()
            return True
        except IntegrityError as e:
            db.rollback()
            error_str = str(e).lower()
            if "duplicate key" in error_str or "uniqueviolation" in error_str or "unique constraint" in error_str:
                fix_sequence(db, table_name)
                make_transient(obj)
                obj.id = None
                continue
            raise
    raise Exception(f"Failed to insert into {table_name} after 10 attempts")

# ─── ASSET SYNC FROM FILES ──────────────────────────────────────────────────
import hashlib
import base64
import mimetypes
from pathlib import Path

# Define all assets to sync from filesystem
ASSETS_TO_SYNC = [
    {"path": "logo.png", "key": "logo", "category": "logo", "alt": "OeH Wirtschaft Logo"},
    {"path": "oehli-logo.png", "key": "oehli-logo", "category": "logo", "alt": "OeHli Chatbot Logo"},
    {"path": "background/hero-main.jpg", "key": "background/hero-main", "category": "background", "alt": "Hero Hauptbild"},
    {"path": "background/hero-small1.jpg", "key": "background/hero-small1", "category": "background", "alt": "Hero Klein 1"},
    {"path": "background/hero-small2.jpg", "key": "background/hero-small2", "category": "background", "alt": "Hero Klein 2"},
    {"path": "background/about-main.jpg", "key": "background/about-main", "category": "background", "alt": "Ueber uns Hauptbild"},
    {"path": "background/about-small.jpg", "key": "background/about-small", "category": "background", "alt": "Ueber uns Klein"},
    {"path": "background/slide-1.jpg", "key": "background/slide-1", "category": "background", "alt": "Slider Bild 1"},
    {"path": "background/slide-2.jpg", "key": "background/slide-2", "category": "background", "alt": "Slider Bild 2"},
    {"path": "background/slide-3.jpg", "key": "background/slide-3", "category": "background", "alt": "Slider Bild 3"},
    {"path": "background/slide-4.jpg", "key": "background/slide-4", "category": "background", "alt": "Slider Bild 4"},
    {"path": "background/slide-5.jpg", "key": "background/slide-5", "category": "background", "alt": "Slider Bild 5"},
    {"path": "background/bg-1.jpg", "key": "background/bg-1", "category": "background", "alt": "Hintergrund 1"},
    {"path": "background/bg-2.jpg", "key": "background/bg-2", "category": "background", "alt": "Hintergrund 2"},
    {"path": "background/bg-3.jpg", "key": "background/bg-3", "category": "background", "alt": "Hintergrund 3"},
    {"path": "background/bg-4.jpg", "key": "background/bg-4", "category": "background", "alt": "Hintergrund 4"},
    {"path": "background/bg-5.jpg", "key": "background/bg-5", "category": "background", "alt": "Hintergrund 5"},
    {"path": "background/bg-6.jpg", "key": "background/bg-6", "category": "background", "alt": "Hintergrund 6"},
    {"path": "background/bg-7.jpg", "key": "background/bg-7", "category": "background", "alt": "Hintergrund 7"},
    {"path": "background/bg-8.jpg", "key": "background/bg-8", "category": "background", "alt": "Hintergrund 8"},
    {"path": "background/gallery-1.jpg", "key": "background/gallery-1", "category": "background", "alt": "Galerie 1"},
    {"path": "background/gallery-2.jpg", "key": "background/gallery-2", "category": "background", "alt": "Galerie 2"},
    {"path": "background/gallery-3.jpg", "key": "background/gallery-3", "category": "background", "alt": "Galerie 3"},
    {"path": "background/gallery-4.jpg", "key": "background/gallery-4", "category": "background", "alt": "Galerie 4"},
    {"path": "background/gallery-5.jpg", "key": "background/gallery-5", "category": "background", "alt": "Galerie 5"},
    {"path": "background/gallery-2-alt.jpg", "key": "background/gallery-2-alt", "category": "background", "alt": "Galerie 2 Alt"},
    {"path": "background/gallery-3-alt.jpg", "key": "background/gallery-3-alt", "category": "background", "alt": "Galerie 3 Alt"},
    {"path": "background/gallery-4-test.jpg", "key": "background/gallery-4-test", "category": "background", "alt": "Galerie 4 Test"},
    {"path": "background/gallery-5-test.jpg", "key": "background/gallery-5-test", "category": "background", "alt": "Galerie 5 Test"},
    {"path": "background/slide-2-alt.jpg", "key": "background/slide-2-alt", "category": "background", "alt": "Slider 2 Alt"},
    {"path": "background/slide-3-alt.jpg", "key": "background/slide-3-alt", "category": "background", "alt": "Slider 3 Alt"},
    {"path": "background/slide-4-alt.jpg", "key": "background/slide-4-alt", "category": "background", "alt": "Slider 4 Alt"},
    {"path": "team/Maximilian-Pilsner.png", "key": "team/maximilian-pilsner", "category": "team", "alt": "Maximilian Pilsner"},
    {"path": "team/Lucia-Schoisswohl.png", "key": "team/lucia-schoisswohl", "category": "team", "alt": "Lucia Schoisswohl"},
    {"path": "team/Stefan-Gstoettenmayer.png", "key": "team/stefan-gstoettenmayer", "category": "team", "alt": "Stefan Gstoettenmayer"},
    {"path": "team/Sebastian-Jensen.png", "key": "team/sebastian-jensen", "category": "team", "alt": "Sebastian Jensen"},
    {"path": "team/Carolina-Goetsch.png", "key": "team/carolina-goetsch", "category": "team", "alt": "Carolina Goetsch"},
    {"path": "team/Simon-Plangger.png", "key": "team/simon-plangger", "category": "team", "alt": "Simon Plangger"},
    {"path": "team/Matej-Kromka.png", "key": "team/matej-kromka", "category": "team", "alt": "Matej Kromka"},
    {"path": "team/Florian-Zimmermann.png", "key": "team/florian-zimmermann", "category": "team", "alt": "Florian Zimmermann"},
    {"path": "team/Maxim-Tafincev.png", "key": "team/maxim-tafincev", "category": "team", "alt": "Maxim Tafincev"},
    {"path": "team/Simon-Reisinger.png", "key": "team/simon-reisinger", "category": "team", "alt": "Simon Reisinger"},
    {"path": "team/Paul-Mairleitner.png", "key": "team/paul-mairleitner", "category": "team", "alt": "Paul Mairleitner"},
    {"path": "team/Sarika-Bimanaviona.png", "key": "team/sarika-bimanaviona", "category": "team", "alt": "Sarika Bimanaviona"},
    {"path": "team/Thomas-Kreilinger.png", "key": "team/thomas-kreilinger", "category": "team", "alt": "Thomas Kreilinger"},
    {"path": "team/Lilli-Huber.png", "key": "team/lilli-huber", "category": "team", "alt": "Lilli Huber"},
    {"path": "team/Theresa-Kloibhofer.png", "key": "team/theresa-kloibhofer", "category": "team", "alt": "Theresa Kloibhofer"},
    {"path": "team/Philipp-Bergsmann.png", "key": "team/philipp-bergsmann", "category": "team", "alt": "Philipp Bergsmann"},
    {"path": "team/Paul-Hamminger.png", "key": "team/paul-hamminger", "category": "team", "alt": "Paul Hamminger"},
    {"path": "team/Alex-Sighireanu.png", "key": "team/alex-sighireanu", "category": "team", "alt": "Alex Sighireanu"},
    {"path": "team/Victoria-Riener.png", "key": "team/victoria-riener", "category": "team", "alt": "Victoria Riener"},
    {"path": "team/placeholder-missing.png", "key": "team/placeholder-missing", "category": "team", "alt": "Platzhalter"},
    {"path": "Portraits/Maximilian-Pilsner-trans.png", "key": "portrait/maximilian-pilsner", "category": "portrait", "alt": "Maximilian Pilsner Portrait"},
    {"path": "Portraits/Lucia-Schoisswohl-trans.png", "key": "portrait/lucia-schoisswohl", "category": "portrait", "alt": "Lucia Schoisswohl Portrait"},
    {"path": "Portraits/Stefan-Gstoettenmayr-trans.png", "key": "portrait/stefan-gstoettenmayr", "category": "portrait", "alt": "Stefan Gstoettenmayer Portrait"},
    {"path": "Portraits/Theresa-Kloibhofer-trans.png", "key": "portrait/theresa-kloibhofer", "category": "portrait", "alt": "Theresa Kloibhofer Portrait"},
    {"path": "Portraits/Michael-Tremetzberger-trans.png", "key": "portrait/michael-tremetzberger", "category": "portrait", "alt": "Michael Tremetzberger Portrait"},
    {"path": "Portraits/team-transparent.png", "key": "portrait/team-transparent", "category": "portrait", "alt": "Team Portrait"},
]

def get_images_dir():
    """Get the path to the images directory - handles both local dev and Docker"""
    current_dir = Path(__file__).parent
    
    # Priority order for finding images
    possible_paths = [
        current_dir / "images",  # /app/backend/images (Docker - images copied into backend)
        current_dir.parent / "frontend" / "public" / "images",  # Local dev
    ]
    
    # Also check env var if set
    env_path = os.environ.get("IMAGES_PATH")
    if env_path:
        possible_paths.insert(0, Path(env_path))
    
    for p in possible_paths:
        if p.exists():
            print(f"  Found images at: {p}")
            return p.resolve()
    
    # Return first path even if not exists (for error message)
    return possible_paths[0]

def compute_file_hash(filepath: Path) -> str:
    """Compute MD5 hash of a file for change detection"""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            hasher.update(chunk)
    return hasher.hexdigest()

def get_mime_type(filepath: str) -> str:
    """Get MIME type for a file"""
    mime, _ = mimetypes.guess_type(filepath)
    return mime or "application/octet-stream"

def read_and_encode_image(filepath: Path) -> tuple:
    """Read image file and return base64 data URL and mime type"""
    with open(filepath, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode("utf-8")
    mime = get_mime_type(str(filepath))
    return f"data:{mime};base64,{b64}", mime

def sync_assets_from_files(db: Session):
    """
    Synchronize assets from filesystem to database.
    - If asset doesn't exist in DB: insert it
    - If asset exists but file changed (different hash): update it
    - Called on every server restart to keep DB in sync with files
    """
    from sqlalchemy import text
    
    images_dir = get_images_dir()
    print(f"  Syncing assets from: {images_dir}")
    
    if not images_dir.exists():
        print(f"  ! Images directory not found: {images_dir}")
        return
    
    synced = 0
    updated = 0
    skipped = 0
    errors = []
    
    for asset_info in ASSETS_TO_SYNC:
        filepath = images_dir / asset_info["path"]
        asset_key = asset_info["key"]
        
        if not filepath.exists():
            skipped += 1
            continue
        
        try:
            # Compute current file hash
            current_hash = compute_file_hash(filepath)
            
            # Check if asset exists in DB and get its hash
            check_sql = text("SELECT id, file_hash FROM app_assets WHERE asset_key = :key")
            existing = db.execute(check_sql, {"key": asset_key}).fetchone()
            
            if existing:
                existing_id, existing_hash = existing
                # Only update if hash changed (file was modified)
                if existing_hash == current_hash:
                    continue  # No change, skip
                
                # File changed - update it
                data_url, mime_type = read_and_encode_image(filepath)
                update_sql = text("""
                    UPDATE app_assets
                    SET data = :data, mime_type = :mime, file_hash = :hash,
                        alt_text = :alt, updated_at = CURRENT_TIMESTAMP
                    WHERE asset_key = :key
                """)
                db.execute(update_sql, {
                    "key": asset_key,
                    "data": data_url,
                    "mime": mime_type,
                    "hash": current_hash,
                    "alt": asset_info.get("alt")
                })
                updated += 1
            else:
                # New asset - insert it
                data_url, mime_type = read_and_encode_image(filepath)
                filename = asset_info["path"].split("/")[-1]
                
                insert_sql = text("""
                    INSERT INTO app_assets (asset_key, filename, mime_type, data, category, alt_text, file_hash)
                    VALUES (:key, :filename, :mime, :data, :category, :alt, :hash)
                """)
                db.execute(insert_sql, {
                    "key": asset_key,
                    "filename": filename,
                    "mime": mime_type,
                    "data": data_url,
                    "category": asset_info["category"],
                    "alt": asset_info.get("alt"),
                    "hash": current_hash
                })
                synced += 1
                
        except Exception as e:
            errors.append(f"{asset_key}: {str(e)[:50]}")
    
    db.commit()
    
    if synced > 0 or updated > 0:
        print(f"  + Assets synced: {synced} new, {updated} updated")
    if skipped > 0:
        print(f"  - Assets skipped (file not found): {skipped}")
    if errors:
        print(f"  ! Asset sync errors: {len(errors)}")
        for err in errors[:5]:  # Show first 5 errors
            print(f"    - {err}")

# ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 8 Zeichen lang sein.")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Passwort muss mindestens einen Grossbuchstaben enthalten.")
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Passwort muss mindestens einen Kleinbuchstaben enthalten.")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Passwort muss mindestens eine Zahl enthalten.")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise credentials_exception
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is deactivated")
    return admin

def log_activity(db: Session, admin_id: int, action: str, description: str, target_type: str = None, target_id: int = None):
    log = ActivityLog(
        admin_id=admin_id,
        action=action,
        description=description,
        target_type=target_type,
        target_id=target_id
    )
    try:
        safe_add_and_commit(db, log, "activity_logs")
    except Exception:
        pass

DEFAULT_PERMISSIONS_ALL = {
    "events": {"view": True, "edit": True},
    "news": {"view": True, "edit": True},
    "team": {"view": True, "edit": True},
    "email": {"view": True, "edit": True},
    "sgu": {"view": True, "edit": True},
    "lva": {"view": True, "edit": True},
    "kanban": {"view": True, "edit": True},
    "partners": {"view": True, "edit": True},
    "sites": {"view": True, "edit": True},
    "misc": {"view": True, "edit": True},
    "users": {"view": True, "edit": True},
    "verwaltung": {"view": True, "edit": True},
}

DEFAULT_ROLES = [
    {
        "name": "admin",
        "display_name": "Administrator",
        "description": "Voller Zugriff auf alle Bereiche ausser Verwaltung",
        "color": "blue",
        "is_system": True,
        "sort_order": 1,
        "permissions": {
            "events": {"view": True, "edit": True},
            "news": {"view": True, "edit": True},
            "team": {"view": True, "edit": True},
            "email": {"view": True, "edit": True},
            "sgu": {"view": True, "edit": True},
            "lva": {"view": True, "edit": True},
            "kanban": {"view": True, "edit": True},
            "partners": {"view": True, "edit": True},
            "sites": {"view": True, "edit": True},
            "misc": {"view": True, "edit": True},
            "users": {"view": True, "edit": False},
            "verwaltung": {"view": False, "edit": False},
        }
    },
    {
        "name": "redakteur",
        "display_name": "Redakteur",
        "description": "Kann News und Events verwalten",
        "color": "green",
        "is_system": True,
        "sort_order": 2,
        "permissions": {
            "events": {"view": True, "edit": True},
            "news": {"view": True, "edit": True},
            "team": {"view": True, "edit": False},
            "email": {"view": False, "edit": False},
            "sgu": {"view": True, "edit": False},
            "lva": {"view": True, "edit": False},
            "kanban": {"view": True, "edit": True},
            "partners": {"view": True, "edit": False},
            "sites": {"view": True, "edit": False},
            "misc": {"view": False, "edit": False},
            "users": {"view": False, "edit": False},
            "verwaltung": {"view": False, "edit": False},
        }
    },
    {
        "name": "moderator",
        "display_name": "Moderator",
        "description": "Kann Team, SGU und LVA verwalten",
        "color": "gold",
        "is_system": True,
        "sort_order": 3,
        "permissions": {
            "events": {"view": True, "edit": False},
            "news": {"view": True, "edit": False},
            "team": {"view": True, "edit": True},
            "email": {"view": False, "edit": False},
            "sgu": {"view": True, "edit": True},
            "lva": {"view": True, "edit": True},
            "kanban": {"view": True, "edit": True},
            "partners": {"view": True, "edit": False},
            "sites": {"view": True, "edit": False},
            "misc": {"view": False, "edit": False},
            "users": {"view": False, "edit": False},
            "verwaltung": {"view": False, "edit": False},
        }
    },
]

def ensure_default_roles(db: Session):
    """Ensure default roles exist"""
    for role_data in DEFAULT_ROLES:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            role = Role(
                name=role_data["name"],
                display_name=role_data["display_name"],
                description=role_data["description"],
                permissions=json.dumps(role_data["permissions"]),
                color=role_data["color"],
                is_system=role_data["is_system"],
                sort_order=role_data["sort_order"]
            )
            db.add(role)
            print(f"  + Rolle erstellt: {role_data['display_name']}")
    db.commit()

def ensure_master_admin(db: Session):
    """Ensure master admin exists and is synced with ENV variables"""
    ensure_default_roles(db)

    admin_role = db.query(Role).filter(Role.name == "admin").first()

    master = db.query(Admin).filter(Admin.is_master == True).first()

    if master:
        master.username = MASTER_ADMIN_USERNAME
        master.email = MASTER_ADMIN_EMAIL
        master.hashed_password = get_password_hash(MASTER_ADMIN_PASSWORD)
        db.commit()
        print("Master admin updated")
    else:
        master = Admin(
            username=MASTER_ADMIN_USERNAME,
            email=MASTER_ADMIN_EMAIL,
            hashed_password=get_password_hash(MASTER_ADMIN_PASSWORD),
            display_name="Master Administrator",
            role=AdminRole.MASTER,
            is_master=True,
            is_active=True
        )
        db.add(master)
        db.commit()
        print(f"Master admin created: {MASTER_ADMIN_USERNAME}")

    for admin in db.query(Admin).filter(Admin.role_id == None, Admin.is_master == False).all():
        if admin_role:
            admin.role_id = admin_role.id
    db.commit()

    return master

# ─── STARTUP EVENT ──────────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    run_migrations()  # Auto-add new columns to existing tables
    db = SessionLocal()
    try:
        ensure_master_admin(db)
        seed_study_data(db)
        seed_lvas(db)  # Auto-seed LVAs beim ersten Start
        seed_default_settings(db)
        sync_assets_from_files(db)  # Sync images from filesystem to DB on every restart
    finally:
        db.close()
    reset_all_sequences()  # Fix sequences after seeding to prevent duplicate key errors
    print("═" * 50)
    print("ÖH Wirtschaft API started!")
    print(f"   Internal Port: {INTERNAL_PORT}")
    print(f"   External Port: {EXTERNAL_PORT}")
    print(f"   Host: {BACKEND_HOST}")
    print("═" * 50)

# ─── HEALTH CHECK ───────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}

@app.get("/api/testmode/status")
def get_testmode_status():
    return {"enabled": TESTMODE}

@app.post("/api/testmode/verify")
def verify_testmode_password(raw_request: Request, password: str = FastAPIForm(...)):
    if not TESTMODE:
        return {"success": True}

    client_ip = get_client_ip(raw_request)
    check_rate_limit("testmode", client_ip, max_requests=5, window_seconds=300)

    if password == TESTMODE_PASSWORD:
        return {"success": True}

    raise HTTPException(status_code=401, detail="Falsches Passwort")

def get_admin_permissions(admin: Admin) -> dict:
    """Get permissions for an admin based on their role"""
    if admin.is_master:
        return DEFAULT_PERMISSIONS_ALL
    if admin.custom_role:
        return admin.custom_role.get_permissions()
    return {}

def build_admin_response(admin: Admin) -> dict:
    """Build standardized admin response dict"""
    permissions = get_admin_permissions(admin)
    return {
        "id": admin.id,
        "username": admin.username,
        "email": admin.email,
        "display_name": admin.display_name,
        "role": admin.role.value,
        "role_id": admin.role_id,
        "role_name": admin.custom_role.display_name if admin.custom_role else ("Master" if admin.is_master else None),
        "role_color": admin.custom_role.color if admin.custom_role else ("red" if admin.is_master else None),
        "permissions": permissions,
        "is_master": admin.is_master,
        "is_active": admin.is_active,
        "created_at": admin.created_at,
        "last_login": admin.last_login
    }

# ─── AUTH ENDPOINTS ─────────────────────────────────────────────────────────
@app.post("/api/auth/login", response_model=TokenResponse)
def login(request: LoginRequest, raw_request: Request, db: Session = Depends(get_db)):
    identifier = request.username.lower().strip()
    client_ip = get_client_ip(raw_request)
    check_login_rate_limit(identifier)
    check_rate_limit("login_ip", client_ip, max_requests=10, window_seconds=300)

    admin = db.query(Admin).filter(
        (Admin.username == request.username) | (Admin.email == request.username)
    ).first()

    if not admin or not verify_password(request.password, admin.hashed_password):
        record_failed_login(identifier)
        raise HTTPException(status_code=401, detail="Ungueltige Anmeldedaten")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Account ist deaktiviert")

    clear_login_attempts(identifier)

    admin.last_login = datetime.now(timezone.utc)
    db.commit()

    log_activity(db, admin.id, "LOGIN", f"{admin.display_name} hat sich angemeldet")

    access_token = create_access_token(data={"sub": admin.username})
    admin_data = build_admin_response(admin)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": admin_data
    }

@app.get("/api/auth/me")
def get_me(current_admin: Admin = Depends(get_current_admin)):
    return build_admin_response(current_admin)

@app.post("/api/auth/change-password")
def change_password(request: PasswordChange, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Master-Admin darf sein Passwort nicht über das Admin-Panel ändern
    if current_admin.is_master:
        raise HTTPException(
            status_code=403, 
            detail="Der Master admin ist nicht befugt sein Passwort zu ändern. Verwaltung liegt bei Astra Capital e.U."
        )
    
    if not verify_password(request.current_password, current_admin.hashed_password):
        raise HTTPException(status_code=400, detail="Aktuelles Passwort ist falsch")

    validate_password_strength(request.new_password)
    current_admin.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    log_activity(db, current_admin.id, "PASSWORD_CHANGE", f"{current_admin.display_name} hat das Passwort geändert")
    
    return {"message": "Passwort erfolgreich geändert"}

# ─── ADMIN MANAGEMENT ENDPOINTS ─────────────────────────────────────────────
@app.get("/api/admins")
def get_admins(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not current_admin.is_master and not current_admin.has_permission("users", "view"):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    admins = db.query(Admin).all()
    return [build_admin_response(a) for a in admins]

@app.post("/api/admins")
def create_admin(request: AdminCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Benutzer erstellen")

    if db.query(Admin).filter(Admin.username == request.username).first():
        raise HTTPException(status_code=400, detail="Benutzername bereits vergeben")
    if db.query(Admin).filter(Admin.email == request.email).first():
        raise HTTPException(status_code=400, detail="E-Mail bereits vergeben")

    validate_password_strength(request.password)

    if request.role_id:
        role = db.query(Role).filter(Role.id == request.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Rolle nicht gefunden")

    admin = Admin(
        username=request.username,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        display_name=request.display_name,
        role=AdminRole.ADMIN,
        role_id=request.role_id,
        is_master=False
    )
    safe_add_and_commit(db, admin, "admins")
    db.refresh(admin)

    log_activity(db, current_admin.id, "USER_CREATE", f"Benutzer '{admin.display_name}' erstellt", "admin", admin.id)

    return build_admin_response(admin)

@app.put("/api/admins/{admin_id}")
def update_admin(admin_id: int, request: AdminUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    if not current_admin.is_master and current_admin.id != admin_id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    if admin.is_master and request.is_active == False:
        raise HTTPException(status_code=400, detail="Master-Admin kann nicht deaktiviert werden")

    if request.email is not None:
        admin.email = request.email
    if request.display_name is not None:
        admin.display_name = request.display_name
    if request.role_id is not None and current_admin.is_master and not admin.is_master:
        role = db.query(Role).filter(Role.id == request.role_id).first()
        if role:
            admin.role_id = request.role_id
    if request.is_active is not None and current_admin.is_master and not admin.is_master:
        admin.is_active = request.is_active

    db.commit()
    db.refresh(admin)

    log_activity(db, current_admin.id, "USER_UPDATE", f"Benutzer '{admin.display_name}' aktualisiert", "admin", admin.id)

    return build_admin_response(admin)

@app.delete("/api/admins/{admin_id}")
def delete_admin(admin_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Benutzer loeschen")

    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    if admin.is_master:
        raise HTTPException(status_code=400, detail="Master-Admin kann nicht geloescht werden")

    display_name = admin.display_name
    db.delete(admin)
    db.commit()

    log_activity(db, current_admin.id, "USER_DELETE", f"Benutzer '{display_name}' geloescht")

    return {"message": "Benutzer erfolgreich geloescht"}

# ─── ROLE MANAGEMENT ENDPOINTS ───────────────────────────────────────────────
@app.get("/api/roles")
def get_roles(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all roles - master admin only"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Rollen verwalten")

    roles = db.query(Role).order_by(Role.sort_order).all()
    result = []
    for r in roles:
        user_count = db.query(Admin).filter(Admin.role_id == r.id).count()
        result.append({
            "id": r.id,
            "name": r.name,
            "display_name": r.display_name,
            "description": r.description,
            "permissions": r.get_permissions(),
            "color": r.color,
            "is_system": r.is_system,
            "sort_order": r.sort_order,
            "created_at": r.created_at,
            "user_count": user_count
        })
    return result

@app.get("/api/roles/available")
def get_available_roles(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get roles for assignment dropdown - any admin with user permission"""
    roles = db.query(Role).order_by(Role.sort_order).all()
    return [{
        "id": r.id,
        "name": r.name,
        "display_name": r.display_name,
        "color": r.color
    } for r in roles]

@app.post("/api/roles")
def create_role(request: RoleCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Create a new role - master admin only"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Rollen erstellen")

    if db.query(Role).filter(Role.name == request.name).first():
        raise HTTPException(status_code=400, detail="Rollenname bereits vergeben")

    max_order = db.query(Role).count()
    role = Role(
        name=request.name.lower().replace(" ", "_"),
        display_name=request.display_name,
        description=request.description,
        permissions=json.dumps(request.permissions),
        color=request.color,
        is_system=False,
        sort_order=max_order
    )
    safe_add_and_commit(db, role, "roles")
    db.refresh(role)

    log_activity(db, current_admin.id, "ROLE_CREATE", f"Rolle '{role.display_name}' erstellt")

    return {
        "id": role.id,
        "name": role.name,
        "display_name": role.display_name,
        "description": role.description,
        "permissions": role.get_permissions(),
        "color": role.color,
        "is_system": role.is_system,
        "sort_order": role.sort_order,
        "created_at": role.created_at,
        "user_count": 0
    }

@app.put("/api/roles/{role_id}")
def update_role(role_id: int, request: RoleUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Update a role - master admin only"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Rollen bearbeiten")

    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rolle nicht gefunden")

    if request.display_name is not None:
        role.display_name = request.display_name
    if request.description is not None:
        role.description = request.description
    if request.permissions is not None:
        role.permissions = json.dumps(request.permissions)
    if request.color is not None:
        role.color = request.color

    db.commit()
    db.refresh(role)

    log_activity(db, current_admin.id, "ROLE_UPDATE", f"Rolle '{role.display_name}' aktualisiert")

    user_count = db.query(Admin).filter(Admin.role_id == role.id).count()
    return {
        "id": role.id,
        "name": role.name,
        "display_name": role.display_name,
        "description": role.description,
        "permissions": role.get_permissions(),
        "color": role.color,
        "is_system": role.is_system,
        "sort_order": role.sort_order,
        "created_at": role.created_at,
        "user_count": user_count
    }

@app.delete("/api/roles/{role_id}")
def delete_role(role_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Delete a role - master admin only, cannot delete system roles"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Rollen loeschen")

    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rolle nicht gefunden")

    if role.is_system:
        raise HTTPException(status_code=400, detail="System-Rollen koennen nicht geloescht werden")

    user_count = db.query(Admin).filter(Admin.role_id == role.id).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail=f"Rolle wird noch von {user_count} Benutzer(n) verwendet")

    display_name = role.display_name
    db.delete(role)
    db.commit()

    log_activity(db, current_admin.id, "ROLE_DELETE", f"Rolle '{display_name}' geloescht")

    return {"message": f"Rolle '{display_name}' wurde geloescht"}

@app.get("/api/roles/permissions-template")
def get_permissions_template(current_admin: Admin = Depends(get_current_admin)):
    """Get the default permissions template for creating new roles"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    return {
        "sections": [
            {"id": "events", "label": "Veranstaltungen", "description": "Kalender und Events"},
            {"id": "news", "label": "News", "description": "Neuigkeiten und Ankuendigungen"},
            {"id": "team", "label": "Team", "description": "Team-Mitglieder"},
            {"id": "email", "label": "E-Mail", "description": "E-Mail-Einstellungen"},
            {"id": "sgu", "label": "SGU", "description": "Studiengang-Uebersicht"},
            {"id": "lva", "label": "LVA", "description": "Lehrveranstaltungen"},
            {"id": "partners", "label": "Partner", "description": "Partner und Sponsoren"},
            {"id": "sites", "label": "Sites", "description": "Website-Inhalte"},
            {"id": "misc", "label": "Sonstiges", "description": "Weitere Einstellungen"},
            {"id": "users", "label": "Benutzer", "description": "Benutzerverwaltung"},
            {"id": "verwaltung", "label": "Verwaltung", "description": "Rollen und System"},
        ],
        "default_permissions": {k: {"view": False, "edit": False} for k in [
            "events", "news", "team", "email", "sgu", "lva", "partners", "sites", "misc", "users", "verwaltung"
        ]}
    }

# ─── FILE VALIDATION HELPERS ─────────────────────────────────────────────────
MAGIC_BYTES = {
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/jpg": [b"\xff\xd8\xff"],
    "image/webp": [b"RIFF"],
    "image/gif": [b"GIF87a", b"GIF89a"],
    "application/pdf": [b"%PDF"],
}

BLOCKED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".pif", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".wsh", ".ps1", ".psm1", ".sh", ".bash", ".dll",
    ".sys", ".reg", ".inf", ".hta", ".cpl", ".msp", ".mst",
}

def validate_file_content(file_data: bytes, claimed_type: str, filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower() if filename else ""
    if ext in BLOCKED_EXTENSIONS:
        return False
    if claimed_type == "image/svg+xml":
        return True
    signatures = MAGIC_BYTES.get(claimed_type)
    if not signatures:
        return True
    return any(file_data[:len(sig)] == sig for sig in signatures)

def sanitize_svg(svg_data: bytes) -> bytes:
    text = svg_data.decode("utf-8", errors="replace")
    text = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"\bon\w+\s*=\s*[\"'][^\"']*[\"']", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\bon\w+\s*=\s*[^\s>]+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"javascript\s*:", "", text, flags=re.IGNORECASE)
    text = re.sub(r"data\s*:\s*text/html", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<foreignObject[^>]*>.*?</foreignObject>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<iframe[^>]*>.*?</iframe>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<embed[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<object[^>]*>.*?</object>", "", text, flags=re.DOTALL | re.IGNORECASE)
    return text.encode("utf-8")

def escape_html(value: str) -> str:
    return html_module.escape(str(value)) if value else ""

# ─── CONTACT ENDPOINT ────────────────────────────────────────────────────────
CONTACT_FIELD_LABELS = {
    "name": "Name",
    "email": "E-Mail",
    "studium": "Studium",
    "anliegen": "Anliegen",
    "semester": "Semester",
    "nachricht": "Nachricht",
    "lv_name": "Lehrveranstaltung",
    "beschreibung": "Beschreibung",
    "lehrperson_name": "Name der Lehrperson",
    "lehrveranstaltung": "Lehrveranstaltung (optional)",
}

def send_contact_email(to_email: str, fields: dict, file_data: bytes = None, file_name: str = None) -> bool:
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL]):
        print("SMTP not configured - contact form not sent")
        return False

    try:
        msg = MIMEMultipart('mixed')
        anliegen = fields.get('anliegen', 'Kontaktanfrage')
        msg['Subject'] = Header(f'[{anliegen}] Neue Kontaktanfrage', 'utf-8')
        msg['From'] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg['To'] = to_email
        msg['Reply-To'] = fields.get('email', '')

        fields_html = ""
        fields_text = ""
        for key in ["name", "email", "studium", "anliegen", "semester", "lv_name",
                     "lehrperson_name", "lehrveranstaltung", "nachricht", "beschreibung"]:
            val = fields.get(key)
            if not val:
                continue
            label = CONTACT_FIELD_LABELS.get(key, key)
            safe_val = escape_html(val)
            if key == "email":
                fields_html += f"""
                    <div class="field">
                        <div class="field-label">{label}</div>
                        <div class="field-value"><a href="mailto:{safe_val}" style="color: #3b82f6; text-decoration: none;">{safe_val}</a></div>
                    </div>"""
            elif key in ("nachricht", "beschreibung"):
                fields_html += f"""
                    <div class="message-box">
                        <div class="field-label" style="margin-bottom: 10px;">{label}</div>
                        <p>{safe_val}</p>
                    </div>"""
            else:
                fields_html += f"""
                    <div class="field">
                        <div class="field-label">{label}</div>
                        <div class="field-value">{safe_val}</div>
                    </div>"""
            fields_text += f"{label}: {val}\n"

        if file_name:
            safe_file_name = escape_html(file_name)
            fields_html += f"""
                    <div class="field">
                        <div class="field-label">Dateianhang</div>
                        <div class="field-value">{safe_file_name}</div>
                    </div>"""
            fields_text += f"Dateianhang: {file_name}\n"

        sender_name = escape_html(fields.get('name', 'Absender'))

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .header p {{ color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 14px; }}
                .content {{ padding: 30px; }}
                .field {{ margin-bottom: 20px; }}
                .field-label {{ font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }}
                .field-value {{ font-size: 15px; color: #1e293b; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #3b82f6; }}
                .message-box {{ background: #f1f5f9; padding: 20px; border-radius: 12px; margin-top: 20px; }}
                .message-box p {{ margin: 0; color: #334155; line-height: 1.6; white-space: pre-wrap; }}
                .footer {{ background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }}
                .footer p {{ color: #64748b; font-size: 12px; margin: 5px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Neue Kontaktanfrage</h1>
                    <p>ÖH Wirtschaft Kontaktformular</p>
                </div>
                <div class="content">
                    {fields_html}
                </div>
                <div class="footer">
                    <p>Diese E-Mail wurde automatisch generiert.</p>
                    <p>Du kannst direkt auf diese E-Mail antworten, um {sender_name} zu kontaktieren.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"Neue Kontaktanfrage - ÖH Wirtschaft Kontaktformular\n\n{fields_text}\n---\nDiese E-Mail wurde automatisch generiert.\nAntworten Sie direkt auf diese E-Mail, um {sender_name} zu kontaktieren.\n"

        alt_part = MIMEMultipart('alternative')
        alt_part.attach(MIMEText(text_content, 'plain', 'utf-8'))
        alt_part.attach(MIMEText(html_content, 'html', 'utf-8'))
        msg.attach(alt_part)

        if file_data and file_name:
            attachment = MIMEBase('application', 'octet-stream')
            attachment.set_payload(file_data)
            encoders.encode_base64(attachment)
            attachment.add_header('Content-Disposition', f'attachment; filename="{file_name}"')
            msg.attach(attachment)

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()

        print("Contact email sent successfully")
        return True

    except Exception as e:
        print(f"Failed to send contact email: {e}")
        return False

def send_confirmation_email(customer_email: str, customer_name: str, fields: dict) -> bool:
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL]):
        print("SMTP not configured - confirmation email not sent")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = Header('Deine Anfrage bei der ÖH Wirtschaft JKU ist eingegangen', 'utf-8')
        msg['From'] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg['To'] = customer_email

        fields_html = ""
        fields_text = ""
        for key in ["name", "email", "studium", "anliegen", "semester", "lv_name",
                     "lehrperson_name", "lehrveranstaltung", "nachricht", "beschreibung"]:
            val = fields.get(key)
            if not val:
                continue
            label = CONTACT_FIELD_LABELS.get(key, key)
            safe_val = escape_html(val)
            if key in ("nachricht", "beschreibung"):
                fields_html += f"""
                    <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">{label}</div>
                        <p style="margin: 0; color: #334155; line-height: 1.6; white-space: pre-wrap;">{safe_val}</p>
                    </div>"""
            else:
                fields_html += f"""
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">{label}</div>
                        <div style="font-size: 14px; color: #1e293b; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #3b82f6;">{safe_val}</div>
                    </div>"""
            fields_text += f"{label}: {val}\n"

        safe_customer_name = escape_html(customer_name)

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 22px;">Anfrage eingegangen</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Wir haben deine Nachricht erhalten</p>
                </div>
                <div style="padding: 30px;">
                    <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                        Hallo {safe_customer_name},
                    </p>
                    <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                        vielen Dank für deine Anfrage! Wir haben diese erfolgreich erhalten und werden uns
                        <strong>innerhalb von 2 Werktagen</strong> bei dir melden.
                    </p>
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                        <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 500;">
                            Bitte habe etwas Geduld &ndash; wir bearbeiten alle Anfragen so schnell wie möglich.
                        </p>
                    </div>
                    <h3 style="color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
                        Deine Angaben im Überblick
                    </h3>
                    {fields_html}
                </div>
                <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 4px 0;">Diese E-Mail wurde automatisch generiert.</p>
                    <p style="color: #64748b; font-size: 12px; margin: 4px 0;">Bei dringenden Fragen erreichst du uns unter <a href="mailto:wirtschaft@oeh.jku.at" style="color: #3b82f6; text-decoration: none;">wirtschaft@oeh.jku.at</a></p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0;">ÖH Wirtschaft JKU</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = (
            f"Hallo {customer_name},\n\n"
            f"vielen Dank für deine Anfrage! Wir haben diese erfolgreich erhalten und werden uns innerhalb von 2 Werktagen bei dir melden.\n\n"
            f"Deine Angaben im Überblick:\n{fields_text}\n"
            f"---\nDiese E-Mail wurde automatisch generiert.\n"
            f"Bei dringenden Fragen erreichst du uns unter wirtschaft@oeh.jku.at\n"
        )

        msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, customer_email, msg.as_string())
        server.quit()

        print("Confirmation email sent successfully")
        return True

    except Exception as e:
        print(f"Failed to send confirmation email: {e}")
        return False

@app.post("/api/contact")
async def send_contact_message(
    request: Request,
    name: str = FastAPIForm(...),
    email: str = FastAPIForm(...),
    studium: str = FastAPIForm(...),
    anliegen: str = FastAPIForm(...),
    semester: Optional[str] = FastAPIForm(None),
    nachricht: Optional[str] = FastAPIForm(None),
    lv_name: Optional[str] = FastAPIForm(None),
    beschreibung: Optional[str] = FastAPIForm(None),
    lehrperson_name: Optional[str] = FastAPIForm(None),
    lehrveranstaltung: Optional[str] = FastAPIForm(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    client_ip = get_client_ip(request)
    check_rate_limit("contact", client_ip, max_requests=3, window_seconds=300)
    fields = {
        "name": name, "email": email, "studium": studium, "anliegen": anliegen,
    }
    if semester:
        fields["semester"] = semester
    if nachricht:
        fields["nachricht"] = nachricht
    if lv_name:
        fields["lv_name"] = lv_name
    if beschreibung:
        fields["beschreibung"] = beschreibung
    if lehrperson_name:
        fields["lehrperson_name"] = lehrperson_name
    if lehrveranstaltung:
        fields["lehrveranstaltung"] = lehrveranstaltung

    file_data = None
    file_name = None
    if file and file.filename:
        allowed_types = ["application/pdf", "image/jpeg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Nur PDF, JPG und PNG Dateien sind erlaubt.")
        file_data = await file.read()
        if len(file_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Die Datei darf maximal 10 MB groß sein.")
        if not validate_file_content(file_data, file.content_type, file.filename):
            raise HTTPException(status_code=400, detail="Die Datei ist ungueltig oder hat ein nicht erlaubtes Format.")
        file_name = file.filename

    setting = db.query(AppSettings).filter(AppSettings.key == "contact_emails").first()
    recipient_emails = []
    if setting and setting.value:
        recipient_emails = [e.strip() for e in setting.value.split(',') if e.strip()]

    emails_sent = 0
    if recipient_emails:
        for recipient in recipient_emails:
            if send_contact_email(recipient, fields, file_data, file_name):
                emails_sent += 1

    confirmation_sent = send_confirmation_email(email, name, fields)

    print(f"Kontaktanfrage [{anliegen}] - E-Mails gesendet: {emails_sent}/{len(recipient_emails)}, Bestätigung: {'ja' if confirmation_sent else 'nein'}")

    create_notification(
        db, "email",
        f"Neue Kontaktanfrage: {anliegen}",
        f"{name} hat eine Kontaktanfrage gesendet.",
        {
            "name": name,
            "email": email,
            "studium": studium,
            "anliegen": anliegen,
            "semester": semester,
            "nachricht": nachricht,
            "has_attachment": file_name is not None
        }
    )

    return {
        "success": True,
        "message": "Nachricht erfolgreich gesendet" if emails_sent > 0 else "Nachricht wurde empfangen",
        "email_sent": emails_sent > 0,
        "recipients_count": emails_sent,
        "confirmation_sent": confirmation_sent
    }

# ─── NEWS ENDPOINTS ─────────────────────────────────────────────────────────
@app.get("/api/news", response_model=List[NewsResponse])
def get_news(published_only: bool = True, db: Session = Depends(get_db)):
    """Get news - public endpoint for published news"""
    query = db.query(News)
    if published_only:
        query = query.filter(News.is_published == True)
    
    news_list = query.order_by(News.is_pinned.desc(), News.published_at.desc().nullsfirst(), News.created_at.desc()).all()
    
    return [NewsResponse(
        id=n.id,
        title=n.title,
        content=n.content,
        excerpt=n.excerpt,
        priority=n.priority.value,
        color=n.color.value,
        is_published=n.is_published,
        is_pinned=n.is_pinned,
        views=n.views,
        author_id=n.author_id,
        author_name=n.author.display_name if n.author else "Unbekannt",
        created_at=n.created_at,
        updated_at=n.updated_at,
        published_at=n.published_at
    ) for n in news_list]

@app.get("/api/news/all", response_model=List[NewsResponse])
def get_all_news(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all news including drafts - admin only"""
    news_list = db.query(News).order_by(News.created_at.desc()).all()
    
    return [NewsResponse(
        id=n.id,
        title=n.title,
        content=n.content,
        excerpt=n.excerpt,
        priority=n.priority.value,
        color=n.color.value,
        is_published=n.is_published,
        is_pinned=n.is_pinned,
        views=n.views,
        author_id=n.author_id,
        author_name=n.author.display_name if n.author else "Unbekannt",
        created_at=n.created_at,
        updated_at=n.updated_at,
        published_at=n.published_at
    ) for n in news_list]

@app.get("/api/news/{news_id}", response_model=NewsResponse)
def get_news_by_id(news_id: int, db: Session = Depends(get_db)):
    news = db.query(News).filter(News.id == news_id, News.is_published == True).first()
    if not news:
        raise HTTPException(status_code=404, detail="News nicht gefunden")
    
    # Increment views
    news.views += 1
    db.commit()
    
    return NewsResponse(
        id=news.id,
        title=news.title,
        content=news.content,
        excerpt=news.excerpt,
        priority=news.priority.value,
        color=news.color.value,
        is_published=news.is_published,
        is_pinned=news.is_pinned,
        views=news.views,
        author_id=news.author_id,
        author_name=news.author.display_name if news.author else "Unbekannt",
        created_at=news.created_at,
        updated_at=news.updated_at,
        published_at=news.published_at
    )

@app.post("/api/news", response_model=NewsResponse)
def create_news(request: NewsCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    news = News(
        title=request.title,
        content=request.content,
        excerpt=request.excerpt or request.content[:200] + "..." if len(request.content) > 200 else request.content,
        priority=request.priority,
        color=request.color,
        is_published=request.is_published,
        is_pinned=request.is_pinned,
        author_id=current_admin.id,
        published_at=datetime.now(timezone.utc) if request.is_published else None
    )
    safe_add_and_commit(db, news, "news")
    db.refresh(news)

    log_activity(db, current_admin.id, "NEWS_CREATE", f"News '{news.title}' erstellt", "news", news.id)

    create_notification(
        db, "news",
        f"Neue News: {news.title}",
        f"{current_admin.display_name} hat eine News erstellt." + (" (Veroeffentlicht)" if news.is_published else " (Entwurf)"),
        {
            "news_id": news.id,
            "title": news.title,
            "author": current_admin.display_name,
            "is_published": news.is_published,
            "priority": news.priority.value
        }
    )

    return NewsResponse(
        id=news.id,
        title=news.title,
        content=news.content,
        excerpt=news.excerpt,
        priority=news.priority.value,
        color=news.color.value,
        is_published=news.is_published,
        is_pinned=news.is_pinned,
        views=news.views,
        author_id=news.author_id,
        author_name=current_admin.display_name,
        created_at=news.created_at,
        updated_at=news.updated_at,
        published_at=news.published_at
    )

@app.put("/api/news/{news_id}", response_model=NewsResponse)
def update_news(news_id: int, request: NewsUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News nicht gefunden")
    
    # Only author or master can edit
    if news.author_id != current_admin.id and current_admin.role != AdminRole.MASTER:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    if request.title is not None:
        news.title = request.title
    if request.content is not None:
        news.content = request.content
    if request.excerpt is not None:
        news.excerpt = request.excerpt
    if request.priority is not None:
        news.priority = request.priority
    if request.color is not None:
        news.color = request.color
    if request.is_published is not None:
        news.is_published = request.is_published
        if request.is_published and not news.published_at:
            news.published_at = datetime.now(timezone.utc)
    if request.is_pinned is not None:
        news.is_pinned = request.is_pinned
    
    db.commit()
    db.refresh(news)
    
    log_activity(db, current_admin.id, "NEWS_UPDATE", f"News '{news.title}' aktualisiert", "news", news.id)
    
    return NewsResponse(
        id=news.id,
        title=news.title,
        content=news.content,
        excerpt=news.excerpt,
        priority=news.priority.value,
        color=news.color.value,
        is_published=news.is_published,
        is_pinned=news.is_pinned,
        views=news.views,
        author_id=news.author_id,
        author_name=news.author.display_name if news.author else "Unbekannt",
        created_at=news.created_at,
        updated_at=news.updated_at,
        published_at=news.published_at
    )

@app.delete("/api/news/{news_id}")
def delete_news(news_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News nicht gefunden")
    
    # Only author or master can delete
    if news.author_id != current_admin.id and current_admin.role != AdminRole.MASTER:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    title = news.title
    db.delete(news)
    db.commit()
    
    log_activity(db, current_admin.id, "NEWS_DELETE", f"News '{title}' gelöscht")
    
    return {"message": "News erfolgreich gelöscht"}

# ─── STATS ENDPOINT ─────────────────────────────────────────────────────────
@app.get("/api/stats", response_model=StatsResponse)
def get_stats(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_news = db.query(News).count()
    published_news = db.query(News).filter(News.is_published == True).count()
    draft_news = total_news - published_news
    
    # Sum all views
    from sqlalchemy import func
    total_views = db.query(func.sum(News.views)).scalar() or 0
    
    total_admins = db.query(Admin).count()
    active_admins = db.query(Admin).filter(Admin.is_active == True).count()
    
    # News by priority
    news_by_priority = {
        "low": db.query(News).filter(News.priority == NewsPriority.LOW).count(),
        "medium": db.query(News).filter(News.priority == NewsPriority.MEDIUM).count(),
        "high": db.query(News).filter(News.priority == NewsPriority.HIGH).count(),
        "urgent": db.query(News).filter(News.priority == NewsPriority.URGENT).count(),
    }
    
    # Recent activity
    recent_logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(10).all()
    recent_activity = [
        {
            "id": log.id,
            "action": log.action,
            "description": log.description,
            "admin_name": log.admin.display_name if log.admin else "System",
            "created_at": log.created_at.isoformat()
        }
        for log in recent_logs
    ]
    
    total_events = db.query(CalendarEvent).count()
    total_registrations = db.query(EventRegistration).count()
    total_lva_ratings = db.query(LVARating).count()
    total_survey_responses = db.query(SurveyResponse).count()

    return StatsResponse(
        total_news=total_news,
        published_news=published_news,
        draft_news=draft_news,
        total_views=total_views,
        total_admins=total_admins,
        active_admins=active_admins,
        news_by_priority=news_by_priority,
        recent_activity=recent_activity,
        total_events=total_events,
        total_registrations=total_registrations,
        total_lva_ratings=total_lva_ratings,
        total_survey_responses=total_survey_responses
    )

# ─── VISITOR STATS ENDPOINT ─────────────────────────────────────────────────
@app.get("/api/stats/visitors-24h")
def get_visitors_24h(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get estimated visitor count from the last 24 hours"""
    from sqlalchemy import func

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    recent_activity = db.query(func.count(ActivityLog.id)).filter(
        ActivityLog.created_at >= cutoff
    ).scalar() or 0

    total_views = db.query(func.sum(News.views)).scalar() or 0

    visitor_estimate = max(recent_activity // 3, min(total_views // 10, 50))

    return {"count": visitor_estimate}

# ─── ACTIVITY LOG ENDPOINT ──────────────────────────────────────────────────
@app.get("/api/activity")
def get_activity_logs(limit: int = 50, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    if current_admin.role not in [AdminRole.MASTER, AdminRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "action": log.action,
            "description": log.description,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "admin_name": log.admin.display_name if log.admin else "System",
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]

# ─── CALENDAR EVENT ENDPOINTS ───────────────────────────────────────────────
@app.get("/api/events")
def get_events(
    month: Optional[int] = None, 
    year: Optional[int] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all public events with optional filters"""
    query = db.query(CalendarEvent).filter(CalendarEvent.is_public == True)
    
    # Filter by month/year
    if month and year:
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        query = query.filter(CalendarEvent.start_date >= start, CalendarEvent.start_date < end)
    elif year:
        start = datetime(year, 1, 1, tzinfo=timezone.utc)
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        query = query.filter(CalendarEvent.start_date >= start, CalendarEvent.start_date < end)
    
    # Filter by tag
    if tag:
        query = query.filter(CalendarEvent.tags.ilike(f"%{tag}%"))
    
    # Search in title/description
    if search:
        query = query.filter(
            (CalendarEvent.title.ilike(f"%{search}%")) | 
            (CalendarEvent.description.ilike(f"%{search}%"))
        )
    
    events = query.order_by(CalendarEvent.start_date.asc()).all()

    result = []
    now = datetime.utcnow()
    for e in events:
        approved_count = len([r for r in e.registrations if r.status == RegistrationStatus.APPROVED]) if e.registrations else 0
        registration_open = True
        if e.registration_deadline:
            deadline = e.registration_deadline.replace(tzinfo=None) if e.registration_deadline.tzinfo else e.registration_deadline
            if deadline < now:
                registration_open = False
        if e.max_participants and approved_count >= e.max_participants:
            registration_open = False
        result.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "start_date": e.start_date.isoformat(),
            "end_date": e.end_date.isoformat() if e.end_date else None,
            "all_day": e.all_day,
            "location": e.location,
            "color": e.color.value,
            "tags": e.tags,
            "is_public": e.is_public,
            "registration_required": e.registration_required,
            "max_participants": e.max_participants,
            "registration_deadline": e.registration_deadline.isoformat() if e.registration_deadline else None,
            "registration_count": approved_count,
            "registration_open": registration_open,
            "created_by": e.created_by,
            "creator_name": e.creator.display_name if e.creator else "Unbekannt",
            "created_at": e.created_at.isoformat(),
            "updated_at": e.updated_at.isoformat()
        })
    return result

@app.get("/api/events/tags")
def get_event_tags(db: Session = Depends(get_db)):
    """Get all unique tags from events"""
    events = db.query(CalendarEvent).filter(CalendarEvent.tags != None, CalendarEvent.tags != "").all()
    all_tags = set()
    for e in events:
        if e.tags:
            for tag in e.tags.split(","):
                all_tags.add(tag.strip())
    return sorted(list(all_tags))

@app.get("/api/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    approved_count = len([r for r in event.registrations if r.status == RegistrationStatus.APPROVED]) if event.registrations else 0
    registration_open = True
    now = datetime.utcnow()
    if event.registration_deadline:
        deadline = event.registration_deadline.replace(tzinfo=None) if event.registration_deadline.tzinfo else event.registration_deadline
        if deadline < now:
            registration_open = False
    if event.max_participants and approved_count >= event.max_participants:
        registration_open = False

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date.isoformat(),
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "all_day": event.all_day,
        "location": event.location,
        "color": event.color.value,
        "tags": event.tags,
        "is_public": event.is_public,
        "registration_required": event.registration_required,
        "max_participants": event.max_participants,
        "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
        "registration_count": approved_count,
        "registration_open": registration_open,
        "created_by": event.created_by,
        "creator_name": event.creator.display_name if event.creator else "Unbekannt",
        "created_at": event.created_at.isoformat(),
        "updated_at": event.updated_at.isoformat()
    }

# ─── ADMIN CALENDAR ENDPOINTS ───────────────────────────────────────────────
@app.get("/api/admin/events")
def get_all_events_admin(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all events (including non-public) for admin"""
    events = db.query(CalendarEvent).order_by(CalendarEvent.start_date.desc()).all()

    result = []
    for e in events:
        total_regs = len(e.registrations) if e.registrations else 0
        approved_count = len([r for r in e.registrations if r.status == RegistrationStatus.APPROVED]) if e.registrations else 0
        pending_count = len([r for r in e.registrations if r.status == RegistrationStatus.PENDING]) if e.registrations else 0
        result.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "start_date": e.start_date.isoformat(),
            "end_date": e.end_date.isoformat() if e.end_date else None,
            "all_day": e.all_day,
            "location": e.location,
            "color": e.color.value,
            "tags": e.tags,
            "is_public": e.is_public,
            "registration_required": e.registration_required,
            "max_participants": e.max_participants,
            "registration_deadline": e.registration_deadline.isoformat() if e.registration_deadline else None,
            "registration_count": approved_count,
            "pending_registrations": pending_count,
            "total_registrations": total_regs,
            "created_by": e.created_by,
            "creator_name": e.creator.display_name if e.creator else "Unbekannt",
            "created_at": e.created_at.isoformat(),
            "updated_at": e.updated_at.isoformat()
        })
    return result

@app.post("/api/admin/events", response_model=EventResponse)
def create_event(request: EventCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    event = CalendarEvent(
        title=request.title,
        description=request.description,
        start_date=request.start_date,
        end_date=request.end_date,
        all_day=request.all_day,
        location=request.location,
        color=request.color,
        tags=request.tags,
        is_public=request.is_public,
        registration_required=request.registration_required,
        max_participants=request.max_participants,
        registration_deadline=request.registration_deadline,
        created_by=current_admin.id
    )
    safe_add_and_commit(db, event, "calendar_events")
    db.refresh(event)

    log_activity(db, current_admin.id, "EVENT_CREATE", f"Event '{event.title}' erstellt", "event", event.id)

    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        all_day=event.all_day,
        location=event.location,
        color=event.color.value,
        tags=event.tags,
        is_public=event.is_public,
        registration_required=event.registration_required,
        max_participants=event.max_participants,
        registration_deadline=event.registration_deadline,
        registration_count=0,
        created_by=event.created_by,
        creator_name=current_admin.display_name,
        created_at=event.created_at,
        updated_at=event.updated_at
    )

@app.put("/api/admin/events/{event_id}", response_model=EventResponse)
def update_event(event_id: int, request: EventUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")
    
    # Only creator or master can edit
    if event.created_by != current_admin.id and current_admin.role != AdminRole.MASTER:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
    
    db.commit()
    db.refresh(event)
    
    log_activity(db, current_admin.id, "EVENT_UPDATE", f"Event '{event.title}' aktualisiert", "event", event.id)
    
    approved_count = len([r for r in event.registrations if r.status == RegistrationStatus.APPROVED]) if event.registrations else 0
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        all_day=event.all_day,
        location=event.location,
        color=event.color.value,
        tags=event.tags,
        is_public=event.is_public,
        registration_required=event.registration_required,
        max_participants=event.max_participants,
        registration_deadline=event.registration_deadline,
        registration_count=approved_count,
        created_by=event.created_by,
        creator_name=event.creator.display_name if event.creator else "Unbekannt",
        created_at=event.created_at,
        updated_at=event.updated_at
    )

@app.delete("/api/admin/events/{event_id}")
def delete_event(event_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")
    
    # Only creator or master can delete
    if event.created_by != current_admin.id and current_admin.role != AdminRole.MASTER:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    title = event.title
    db.delete(event)
    db.commit()
    
    log_activity(db, current_admin.id, "EVENT_DELETE", f"Event '{title}' gelöscht")
    
    return {"message": "Event erfolgreich gelöscht"}

# ─── EVENT REGISTRATION ENDPOINTS ────────────────────────────────────────────
@app.post("/api/events/{event_id}/register")
def register_for_event(event_id: int, request: EventRegistrationCreate, raw_request: Request, db: Session = Depends(get_db)):
    """Public endpoint to register for an event"""
    client_ip = get_client_ip(raw_request)
    check_rate_limit(f"event_reg:{event_id}", client_ip, max_requests=1, window_seconds=900)
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    if not event.registration_required:
        raise HTTPException(status_code=400, detail="Anmeldung für dieses Event nicht erforderlich")

    if event.registration_deadline:
        now = datetime.utcnow()
        deadline = event.registration_deadline.replace(tzinfo=None) if event.registration_deadline.tzinfo else event.registration_deadline
        if deadline < now:
            raise HTTPException(status_code=400, detail="Anmeldefrist abgelaufen")

    approved_count = len([r for r in event.registrations if r.status == RegistrationStatus.APPROVED])
    if event.max_participants and approved_count >= event.max_participants:
        raise HTTPException(status_code=400, detail="Maximale Teilnehmerzahl erreicht")

    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.email == request.email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Diese E-Mail ist bereits für dieses Event angemeldet")

    registration = EventRegistration(
        event_id=event_id,
        name=request.name,
        email=request.email,
        study_program=request.study_program,
        participation_type=ParticipationType(request.participation_type) if request.participation_type in ["yes", "maybe"] else ParticipationType.YES,
        status=RegistrationStatus.PENDING
    )
    safe_add_and_commit(db, registration, "event_registrations")
    db.refresh(registration)

    reg_data = {
        "id": registration.id,
        "name": registration.name,
        "email": registration.email,
        "study_program": registration.study_program,
        "participation_type": registration.participation_type.value,
    }
    event_data = {
        "title": event.title,
        "start_date": event.start_date,
        "all_day": event.all_day,
        "location": event.location,
    }

    def send_emails_async():
        try:
            send_registration_confirmation_email_async(reg_data, event_data)
            send_registration_admin_notification_async(reg_data, event_data)
        except Exception as e:
            print(f"Async email error: {e}")

    email_thread = threading.Thread(target=send_emails_async)
    email_thread.start()

    create_notification(
        db, "events",
        f"Neue Anmeldung: {event.title}",
        f"{request.name} hat sich fur das Event angemeldet.",
        {
            "event_id": event_id,
            "event_title": event.title,
            "registration_id": registration.id,
            "name": request.name,
            "email": request.email,
            "study_program": request.study_program,
            "participation_type": request.participation_type
        }
    )

    return {
        "id": registration.id,
        "message": "Anmeldung erfolgreich eingereicht. Du erhältst eine Bestätigungsmail.",
        "status": registration.status.value
    }

@app.get("/api/events/{event_id}/registrations")
def get_event_registrations_public(event_id: int, db: Session = Depends(get_db)):
    """Get basic registration stats for an event (public)"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    approved_count = len([r for r in event.registrations if r.status == RegistrationStatus.APPROVED])
    return {
        "registration_required": event.registration_required,
        "max_participants": event.max_participants,
        "registration_count": approved_count,
        "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
        "spots_available": (event.max_participants - approved_count) if event.max_participants else None
    }

@app.get("/api/admin/registrations")
def get_all_registrations(
    status: Optional[str] = None,
    event_id: Optional[int] = None,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all event registrations for admin"""
    query = db.query(EventRegistration).join(CalendarEvent)

    if status:
        query = query.filter(EventRegistration.status == status)
    if event_id:
        query = query.filter(EventRegistration.event_id == event_id)

    registrations = query.order_by(EventRegistration.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "event_id": r.event_id,
            "event_title": r.event.title,
            "event_date": r.event.start_date.isoformat(),
            "name": r.name,
            "email": r.email,
            "study_program": r.study_program,
            "participation_type": r.participation_type.value,
            "status": r.status.value,
            "admin_notes": r.admin_notes,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat()
        }
        for r in registrations
    ]

@app.get("/api/admin/registrations/stats")
def get_registration_stats(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get registration statistics"""
    total = db.query(EventRegistration).count()
    pending = db.query(EventRegistration).filter(EventRegistration.status == RegistrationStatus.PENDING).count()
    approved = db.query(EventRegistration).filter(EventRegistration.status == RegistrationStatus.APPROVED).count()
    rejected = db.query(EventRegistration).filter(EventRegistration.status == RegistrationStatus.REJECTED).count()

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }

@app.get("/api/admin/events/{event_id}/registrations")
def get_event_registrations_admin(event_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all registrations for a specific event (admin)"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    registrations = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).order_by(EventRegistration.created_at.desc()).all()

    return {
        "event": {
            "id": event.id,
            "title": event.title,
            "max_participants": event.max_participants,
            "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None
        },
        "registrations": [
            {
                "id": r.id,
                "name": r.name,
                "email": r.email,
                "study_program": r.study_program,
                "participation_type": r.participation_type.value,
                "status": r.status.value,
                "admin_notes": r.admin_notes,
                "created_at": r.created_at.isoformat()
            }
            for r in registrations
        ],
        "stats": {
            "total": len(registrations),
            "pending": len([r for r in registrations if r.status == RegistrationStatus.PENDING]),
            "approved": len([r for r in registrations if r.status == RegistrationStatus.APPROVED]),
            "rejected": len([r for r in registrations if r.status == RegistrationStatus.REJECTED])
        }
    }

@app.put("/api/admin/registrations/{registration_id}")
def update_registration(
    registration_id: int,
    request: EventRegistrationUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update registration status (approve/reject)"""
    registration = db.query(EventRegistration).filter(EventRegistration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Anmeldung nicht gefunden")

    old_status = registration.status
    new_status = RegistrationStatus(request.status) if request.status in ["pending", "approved", "rejected"] else registration.status

    if new_status == RegistrationStatus.APPROVED and registration.event.max_participants:
        approved_count = len([r for r in registration.event.registrations if r.status == RegistrationStatus.APPROVED and r.id != registration_id])
        if approved_count >= registration.event.max_participants:
            raise HTTPException(status_code=400, detail="Maximale Teilnehmerzahl bereits erreicht")

    registration.status = new_status
    if request.admin_notes is not None:
        registration.admin_notes = request.admin_notes

    reg_data = {
        "name": registration.name,
        "email": registration.email,
    }
    event_data = {
        "title": registration.event.title,
        "start_date": registration.event.start_date,
        "all_day": registration.event.all_day,
        "location": registration.event.location,
    }
    status_value = new_status.value

    db.commit()
    db.refresh(registration)

    if old_status != new_status:
        def send_status_email_async():
            try:
                send_registration_status_email_async(reg_data, event_data, status_value)
            except Exception as e:
                print(f"Async status email error: {e}")

        email_thread = threading.Thread(target=send_status_email_async)
        email_thread.start()
        log_activity(db, current_admin.id, "REGISTRATION_UPDATE", f"Anmeldung von {registration.name} für '{registration.event.title}' auf {new_status.value} gesetzt")

    return {
        "id": registration.id,
        "status": registration.status.value,
        "message": f"Anmeldung erfolgreich auf '{registration.status.value}' gesetzt"
    }

@app.delete("/api/admin/registrations/{registration_id}")
def delete_registration(registration_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Delete a registration"""
    registration = db.query(EventRegistration).filter(EventRegistration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Anmeldung nicht gefunden")

    name = registration.name
    event_title = registration.event.title
    db.delete(registration)
    db.commit()

    log_activity(db, current_admin.id, "REGISTRATION_DELETE", f"Anmeldung von {name} für '{event_title}' gelöscht")

    return {"message": "Anmeldung gelöscht"}

def send_registration_confirmation_email(registration: EventRegistration, event: CalendarEvent):
    """Send confirmation email to registrant"""
    if not SMTP_HOST or not SMTP_USER:
        print("SMTP not configured, skipping registration confirmation email")
        return

    try:
        event_date = event.start_date.strftime("%d.%m.%Y")
        event_time = "" if event.all_day else f" um {event.start_date.strftime('%H:%M')} Uhr"
        location = f" | Ort: {event.location}" if event.location else ""

        safe_name = escape_html(registration.name)
        safe_title = escape_html(event.title)
        safe_location = escape_html(event.location) if event.location else ""

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1e40af; margin: 0;">ÖH Wirtschaft JKU</h1>
                </div>
                <h2 style="color: #1e40af;">Anmeldung eingegangen</h2>
                <p>Hallo {safe_name},</p>
                <p>vielen Dank für deine Anmeldung zum Event:</p>
                <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">{safe_title}</h3>
                    <p style="margin: 5px 0;"><strong>Datum:</strong> {event_date}{event_time}</p>
                    {f'<p style="margin: 5px 0;"><strong>Ort:</strong> {safe_location}</p>' if event.location else ''}
                    <p style="margin: 5px 0;"><strong>Teilnahme:</strong> {"Ja" if registration.participation_type.value == "yes" else "Vielleicht"}</p>
                </div>
                <p>Deine Anmeldung wird geprüft. Du erhältst eine weitere E-Mail, sobald deine Anmeldung bestätigt oder abgelehnt wurde.</p>
                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                    Bei Fragen kannst du uns jederzeit kontaktieren.<br>
                    Dein ÖH Wirtschaft Team
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Anmeldung eingegangen: {event.title}"
        msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg["To"] = registration.email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        try:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print("Registration confirmation sent successfully")
        finally:
            server.quit()
    except Exception as e:
        print(f"Failed to send registration confirmation: {e}")

def send_registration_admin_notification(registration: EventRegistration, event: CalendarEvent):
    """Send notification to admin about new registration"""
    admin_email = os.environ.get("CONTACT_EMAIL", SMTP_FROM_EMAIL)
    if not SMTP_HOST or not SMTP_USER or not admin_email:
        print("SMTP not configured, skipping admin notification")
        return

    try:
        event_date = event.start_date.strftime("%d.%m.%Y")

        safe_title = escape_html(event.title)
        safe_name = escape_html(registration.name)
        safe_email = escape_html(registration.email)
        safe_program = escape_html(registration.study_program) if registration.study_program else "Nicht angegeben"

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1e40af;">Neue Event-Anmeldung</h2>
                <p>Es gibt eine neue Anmeldung für das Event:</p>
                <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">{safe_title}</h3>
                    <p style="margin: 5px 0;"><strong>Datum:</strong> {event_date}</p>
                </div>
                <h3>Anmeldedaten:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Name:</strong> {safe_name}</li>
                    <li><strong>E-Mail:</strong> {safe_email}</li>
                    <li><strong>Studiengang:</strong> {safe_program}</li>
                    <li><strong>Teilnahme:</strong> {"Ja" if registration.participation_type.value == "yes" else "Vielleicht"}</li>
                </ul>
                <p style="margin-top: 20px;">
                    <a href="https://oehwirtschaft.at/admin" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Im Admin-Panel prüfen</a>
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Neue Anmeldung: {event.title} - {registration.name}"
        msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg["To"] = admin_email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        try:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print("Admin notification sent successfully")
        finally:
            server.quit()
    except Exception as e:
        print(f"Failed to send admin notification: {e}")

def send_registration_confirmation_email_async(reg_data: dict, event_data: dict):
    """Send confirmation email to registrant (async/threaded version)"""
    if not SMTP_HOST or not SMTP_USER:
        print("SMTP not configured, skipping registration confirmation email")
        return

    try:
        event_date = event_data["start_date"].strftime("%d.%m.%Y")
        event_time = "" if event_data["all_day"] else f" um {event_data['start_date'].strftime('%H:%M')} Uhr"

        safe_name = escape_html(reg_data["name"])
        safe_title = escape_html(event_data["title"])
        safe_location = escape_html(event_data["location"]) if event_data.get("location") else ""

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1e40af; margin: 0;">ÖH Wirtschaft JKU</h1>
                </div>
                <h2 style="color: #1e40af;">Anmeldung eingegangen</h2>
                <p>Hallo {safe_name},</p>
                <p>vielen Dank für deine Anmeldung zum Event:</p>
                <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">{safe_title}</h3>
                    <p style="margin: 5px 0;"><strong>Datum:</strong> {event_date}{event_time}</p>
                    {f'<p style="margin: 5px 0;"><strong>Ort:</strong> {safe_location}</p>' if event_data.get("location") else ''}
                    <p style="margin: 5px 0;"><strong>Teilnahme:</strong> {"Ja" if reg_data["participation_type"] == "yes" else "Vielleicht"}</p>
                </div>
                <p>Deine Anmeldung wird geprüft. Du erhältst eine weitere E-Mail, sobald deine Anmeldung bestätigt oder abgelehnt wurde.</p>
                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                    Bei Fragen kannst du uns jederzeit kontaktieren.<br>
                    Dein ÖH Wirtschaft Team
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Anmeldung eingegangen: {event_data['title']}"
        msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg["To"] = reg_data["email"]
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        try:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print("Registration confirmation sent successfully")
        finally:
            server.quit()
    except Exception as e:
        print(f"Failed to send registration confirmation: {e}")

def send_registration_admin_notification_async(reg_data: dict, event_data: dict):
    """Send notification to admin about new registration (async/threaded version)"""
    admin_email = os.environ.get("CONTACT_EMAIL", SMTP_FROM_EMAIL)
    if not SMTP_HOST or not SMTP_USER or not admin_email:
        print("SMTP not configured, skipping admin notification")
        return

    try:
        event_date = event_data["start_date"].strftime("%d.%m.%Y")

        safe_title = escape_html(event_data["title"])
        safe_name = escape_html(reg_data["name"])
        safe_email = escape_html(reg_data["email"])
        safe_program = escape_html(reg_data.get("study_program")) if reg_data.get("study_program") else "Nicht angegeben"

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1e40af;">Neue Event-Anmeldung</h2>
                <p>Es gibt eine neue Anmeldung für das Event:</p>
                <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">{safe_title}</h3>
                    <p style="margin: 5px 0;"><strong>Datum:</strong> {event_date}</p>
                </div>
                <h3>Anmeldedaten:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Name:</strong> {safe_name}</li>
                    <li><strong>E-Mail:</strong> {safe_email}</li>
                    <li><strong>Studiengang:</strong> {safe_program}</li>
                    <li><strong>Teilnahme:</strong> {"Ja" if reg_data["participation_type"] == "yes" else "Vielleicht"}</li>
                </ul>
                <p style="margin-top: 20px;">
                    <a href="https://oehwirtschaft.at/admin" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Im Admin-Panel prüfen</a>
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Neue Anmeldung: {event_data['title']} - {reg_data['name']}"
        msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg["To"] = admin_email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        try:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print("Admin notification sent successfully")
        finally:
            server.quit()
    except Exception as e:
        print(f"Failed to send admin notification: {e}")

def send_registration_status_email(registration: EventRegistration):
    """Send status update email to registrant"""
    if not SMTP_HOST or not SMTP_USER:
        print("SMTP not configured, skipping status email")
        return

    try:
        event = registration.event
        event_date = event.start_date.strftime("%d.%m.%Y")
        event_time = "" if event.all_day else f" um {event.start_date.strftime('%H:%M')} Uhr"

        if registration.status == RegistrationStatus.APPROVED:
            subject = f"Anmeldung bestätigt: {event.title}"
            status_text = "bestätigt"
            status_color = "#16a34a"
            additional_info = """
                <p>Wir freuen uns auf deine Teilnahme! Solltest du doch nicht kommen können, gib uns bitte rechtzeitig Bescheid.</p>
            """
        else:
            subject = f"Anmeldung abgelehnt: {event.title}"
            status_text = "leider abgelehnt"
            status_color = "#dc2626"
            additional_info = """
                <p>Leider konnten wir deine Anmeldung nicht berücksichtigen. Bei Fragen kannst du dich gerne an uns wenden.</p>
            """

        safe_name = escape_html(registration.name)
        safe_title = escape_html(event.title)
        safe_location = escape_html(event.location) if event.location else ""

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1e40af; margin: 0;">ÖH Wirtschaft JKU</h1>
                </div>
                <h2 style="color: {status_color};">Anmeldung {status_text}</h2>
                <p>Hallo {safe_name},</p>
                <p>deine Anmeldung zum folgenden Event wurde <strong style="color: {status_color};">{status_text}</strong>:</p>
                <div style="background: #f8fafc; border-left: 4px solid {status_color}; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">{safe_title}</h3>
                    <p style="margin: 5px 0;"><strong>Datum:</strong> {event_date}{event_time}</p>
                    {f'<p style="margin: 5px 0;"><strong>Ort:</strong> {safe_location}</p>' if event.location else ''}
                </div>
                {additional_info}
                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                    Liebe Grüße,<br>
                    Dein ÖH Wirtschaft Team
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg["To"] = registration.email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        try:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print("Status email sent successfully")
        finally:
            server.quit()
    except Exception as e:
        print(f"Failed to send status email: {e}")

def send_registration_status_email_async(reg_data: dict, event_data: dict, status: str):
    """Send status update email (async/threaded version)"""
    if not SMTP_HOST or not SMTP_USER:
        print("SMTP not configured, skipping status email")
        return

    try:
        event_date = event_data["start_date"].strftime("%d.%m.%Y")
        event_time = "" if event_data["all_day"] else f" um {event_data['start_date'].strftime('%H:%M')} Uhr"

        if status == "approved":
            subject = f"Anmeldung bestätigt: {event_data['title']}"
            status_text = "bestätigt"
            status_color = "#16a34a"
            additional_info = """
                <p>Wir freuen uns auf deine Teilnahme! Solltest du doch nicht kommen können, gib uns bitte rechtzeitig Bescheid.</p>
            """
        else:
            subject = f"Anmeldung abgelehnt: {event_data['title']}"
            status_text = "leider abgelehnt"
            status_color = "#dc2626"
            additional_info = """
                <p>Leider konnten wir deine Anmeldung nicht berücksichtigen. Bei Fragen kannst du dich gerne an uns wenden.</p>
            """

        safe_name = escape_html(reg_data["name"])
        safe_title = escape_html(event_data["title"])
        safe_location = escape_html(event_data["location"]) if event_data.get("location") else ""

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1e40af; margin: 0;">ÖH Wirtschaft JKU</h1>
                </div>
                <h2 style="color: {status_color};">Anmeldung {status_text}</h2>
                <p>Hallo {safe_name},</p>
                <p>deine Anmeldung zum folgenden Event wurde <strong style="color: {status_color};">{status_text}</strong>:</p>
                <div style="background: #f8fafc; border-left: 4px solid {status_color}; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">{safe_title}</h3>
                    <p style="margin: 5px 0;"><strong>Datum:</strong> {event_date}{event_time}</p>
                    {f'<p style="margin: 5px 0;"><strong>Ort:</strong> {safe_location}</p>' if event_data.get("location") else ''}
                </div>
                {additional_info}
                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                    Liebe Grüße,<br>
                    Dein ÖH Wirtschaft Team
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg["To"] = reg_data["email"]
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        try:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print("Status email sent successfully")
        finally:
            server.quit()
    except Exception as e:
        print(f"Failed to send status email: {e}")

# ═══════════════════════════════════════════════════════════════════════════
# STUDIENGANG-UPDATES (SGU) ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

# ─── PUBLIC: Studiengänge und Updates abrufen ───────────────────────────────
@app.get("/api/study/categories")
def get_study_categories(db: Session = Depends(get_db)):
    """Alle Kategorien mit Studiengängen abrufen (öffentlich)"""
    categories = db.query(StudyCategory).order_by(StudyCategory.sort_order, StudyCategory.name).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "display_name": c.display_name,
            "description": c.description,
            "color": c.color,
            "sort_order": c.sort_order,
            "programs": [
                {
                    "id": p.id,
                    "name": p.name,
                    "short_name": p.short_name,
                    "description": p.description,
                    "sort_order": p.sort_order,
                    "is_active": p.is_active
                }
                for p in sorted(c.programs, key=lambda x: (x.sort_order, x.name))
                if p.is_active
            ]
        }
        for c in categories
    ]

@app.get("/api/study/programs")
def get_study_programs(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Alle Studiengänge abrufen (optional nach Kategorie gefiltert)"""
    query = db.query(StudyProgram).filter(StudyProgram.is_active == True)
    if category_id:
        query = query.filter(StudyProgram.category_id == category_id)
    programs = query.order_by(StudyProgram.sort_order, StudyProgram.name).all()
    return [
        {
            "id": p.id,
            "category_id": p.category_id,
            "category_name": p.category.display_name if p.category else None,
            "name": p.name,
            "short_name": p.short_name,
            "description": p.description,
            "sort_order": p.sort_order
        }
        for p in programs
    ]

@app.get("/api/study/updates")
def get_study_updates(program_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Alle aktiven Updates abrufen (öffentlich)"""
    query = db.query(StudyUpdate).filter(StudyUpdate.is_active == True)
    if program_id:
        query = query.filter(StudyUpdate.program_id == program_id)
    updates = query.order_by(StudyUpdate.sort_order, StudyUpdate.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "program_id": u.program_id,
            "program_name": u.program.name if u.program else None,
            "category_name": u.program.category.display_name if u.program and u.program.category else None,
            "content": u.content,
            "semester": u.semester,
            "is_active": u.is_active,
            "sort_order": u.sort_order,
            "created_at": u.created_at.isoformat(),
            "updated_at": u.updated_at.isoformat()
        }
        for u in updates
    ]

@app.get("/api/study/updates/grouped")
def get_study_updates_grouped(db: Session = Depends(get_db)):
    """Updates nach Studiengang gruppiert (für Frontend Studium-Seite)"""
    programs = db.query(StudyProgram).filter(StudyProgram.is_active == True).all()
    result = []
    for p in programs:
        active_updates = [u for u in p.updates if u.is_active]
        if active_updates:
            result.append({
                "program_id": p.id,
                "program_name": p.name,
                "category_name": p.category.display_name if p.category else None,
                "updates": [
                    {
                        "id": u.id,
                        "content": u.content,
                        "semester": u.semester,
                        "sort_order": u.sort_order
                    }
                    for u in sorted(active_updates, key=lambda x: (x.sort_order, -x.id))
                ]
            })
    return sorted(result, key=lambda x: x["program_name"])

# ─── ADMIN: Kategorien verwalten ────────────────────────────────────────────
@app.get("/api/admin/study/categories")
def admin_get_categories(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Alle Kategorien mit allen Infos (Admin)"""
    categories = db.query(StudyCategory).order_by(StudyCategory.sort_order, StudyCategory.name).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "display_name": c.display_name,
            "description": c.description,
            "color": c.color,
            "sort_order": c.sort_order,
            "program_count": len(c.programs),
            "created_at": c.created_at.isoformat()
        }
        for c in categories
    ]

@app.post("/api/admin/study/categories")
def admin_create_category(request: StudyCategoryCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Neue Kategorie erstellen"""
    if db.query(StudyCategory).filter(StudyCategory.name == request.name).first():
        raise HTTPException(status_code=400, detail="Kategorie mit diesem Namen existiert bereits")
    
    category = StudyCategory(
        name=request.name,
        display_name=request.display_name,
        description=request.description,
        color=request.color,
        sort_order=request.sort_order
    )
    safe_add_and_commit(db, category, "study_categories")
    db.refresh(category)

    log_activity(db, current_admin.id, "CATEGORY_CREATE", f"Kategorie '{category.display_name}' erstellt", "study_category", category.id)

    return {"id": category.id, "message": "Kategorie erstellt"}

@app.put("/api/admin/study/categories/{category_id}")
def admin_update_category(category_id: int, request: StudyCategoryUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Kategorie aktualisieren"""
    category = db.query(StudyCategory).filter(StudyCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
    
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    db.commit()
    log_activity(db, current_admin.id, "CATEGORY_UPDATE", f"Kategorie '{category.display_name}' aktualisiert", "study_category", category.id)
    
    return {"message": "Kategorie aktualisiert"}

@app.delete("/api/admin/study/categories/{category_id}")
def admin_delete_category(category_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Kategorie löschen (inkl. aller Studiengänge und Updates)"""
    category = db.query(StudyCategory).filter(StudyCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
    
    display_name = category.display_name
    db.delete(category)
    db.commit()
    
    log_activity(db, current_admin.id, "CATEGORY_DELETE", f"Kategorie '{display_name}' gelöscht")
    
    return {"message": "Kategorie gelöscht"}

# ─── ADMIN: Studiengänge verwalten ──────────────────────────────────────────
@app.get("/api/admin/study/programs")
def admin_get_programs(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Alle Studiengänge (Admin)"""
    programs = db.query(StudyProgram).order_by(StudyProgram.category_id, StudyProgram.sort_order, StudyProgram.name).all()
    return [
        {
            "id": p.id,
            "category_id": p.category_id,
            "category_name": p.category.display_name if p.category else None,
            "name": p.name,
            "short_name": p.short_name,
            "description": p.description,
            "sort_order": p.sort_order,
            "is_active": p.is_active,
            "update_count": len([u for u in p.updates if u.is_active]),
            "created_at": p.created_at.isoformat()
        }
        for p in programs
    ]

@app.post("/api/admin/study/programs")
def admin_create_program(request: StudyProgramCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Neuen Studiengang erstellen"""
    if not db.query(StudyCategory).filter(StudyCategory.id == request.category_id).first():
        raise HTTPException(status_code=400, detail="Kategorie nicht gefunden")
    
    program = StudyProgram(
        category_id=request.category_id,
        name=request.name,
        short_name=request.short_name,
        description=request.description,
        sort_order=request.sort_order,
        is_active=request.is_active
    )
    safe_add_and_commit(db, program, "study_programs")
    db.refresh(program)

    log_activity(db, current_admin.id, "PROGRAM_CREATE", f"Studiengang '{program.name}' erstellt", "study_program", program.id)

    return {"id": program.id, "message": "Studiengang erstellt"}

@app.put("/api/admin/study/programs/{program_id}")
def admin_update_program(program_id: int, request: StudyProgramUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Studiengang aktualisieren"""
    program = db.query(StudyProgram).filter(StudyProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Studiengang nicht gefunden")
    
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(program, key, value)
    
    db.commit()
    log_activity(db, current_admin.id, "PROGRAM_UPDATE", f"Studiengang '{program.name}' aktualisiert", "study_program", program.id)
    
    return {"message": "Studiengang aktualisiert"}

@app.delete("/api/admin/study/programs/{program_id}")
def admin_delete_program(program_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Studiengang löschen (inkl. aller Updates)"""
    program = db.query(StudyProgram).filter(StudyProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Studiengang nicht gefunden")
    
    name = program.name
    db.delete(program)
    db.commit()
    
    log_activity(db, current_admin.id, "PROGRAM_DELETE", f"Studiengang '{name}' gelöscht")
    
    return {"message": "Studiengang gelöscht"}

# ─── ADMIN: Updates verwalten ───────────────────────────────────────────────
@app.get("/api/admin/study/updates")
def admin_get_updates(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Alle Updates (Admin)"""
    updates = db.query(StudyUpdate).order_by(StudyUpdate.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "program_id": u.program_id,
            "program_name": u.program.name if u.program else None,
            "category_name": u.program.category.display_name if u.program and u.program.category else None,
            "content": u.content,
            "semester": u.semester,
            "is_active": u.is_active,
            "sort_order": u.sort_order,
            "creator_name": u.creator.display_name if u.creator else None,
            "created_at": u.created_at.isoformat(),
            "updated_at": u.updated_at.isoformat()
        }
        for u in updates
    ]

@app.post("/api/admin/study/updates")
def admin_create_update(request: StudyUpdateCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Neues Update erstellen"""
    program = db.query(StudyProgram).filter(StudyProgram.id == request.program_id).first()
    if not program:
        raise HTTPException(status_code=400, detail="Studiengang nicht gefunden")

    update = StudyUpdate(
        program_id=request.program_id,
        content=request.content,
        semester=request.semester,
        is_active=request.is_active,
        sort_order=request.sort_order,
        created_by=current_admin.id
    )
    safe_add_and_commit(db, update, "study_updates")
    db.refresh(update)

    log_activity(db, current_admin.id, "UPDATE_CREATE", f"Update für '{program.name}' erstellt", "study_update", update.id)

    create_notification(
        db, "sgu",
        f"Neues SGU-Update: {program.name}",
        f"{current_admin.display_name} hat ein Update fuer '{program.name}' hinzugefuegt.",
        {
            "update_id": update.id,
            "program_name": program.name,
            "semester": update.semester,
            "author": current_admin.display_name
        }
    )

    return {"id": update.id, "message": "Update erstellt"}

@app.put("/api/admin/study/updates/{update_id}")
def admin_update_update(update_id: int, request: StudyUpdateUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Update aktualisieren"""
    update = db.query(StudyUpdate).filter(StudyUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update nicht gefunden")
    
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(update, key, value)
    
    db.commit()
    log_activity(db, current_admin.id, "UPDATE_UPDATE", f"Update aktualisiert", "study_update", update.id)
    
    return {"message": "Update aktualisiert"}

@app.delete("/api/admin/study/updates/{update_id}")
def admin_delete_update(update_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Update löschen"""
    update = db.query(StudyUpdate).filter(StudyUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update nicht gefunden")
    
    db.delete(update)
    db.commit()
    
    log_activity(db, current_admin.id, "UPDATE_DELETE", f"Update gelöscht")
    
    return {"message": "Update gelöscht"}

# ─── SEED: Bestehende Daten einfügen ────────────────────────────────────────
def seed_study_data(db: Session):
    """Seed initial study data if empty"""
    if db.query(StudyCategory).count() > 0:
        return  # Already seeded
    
    # Get master admin for created_by
    master = db.query(Admin).filter(Admin.is_master == True).first()
    if not master:
        return
    
    # Categories
    categories_data = [
        {"name": "bachelor", "display_name": "Bachelorstudiengänge", "color": "blue", "sort_order": 1},
        {"name": "master", "display_name": "Masterstudiengänge", "color": "gold", "sort_order": 2},
        {"name": "mba", "display_name": "MBA-Studiengänge (Executive)", "color": "blue", "sort_order": 3},
        {"name": "ulg", "display_name": "Universitätslehrgänge (ULG)", "color": "gold", "sort_order": 4},
    ]
    
    for cat_data in categories_data:
        category = StudyCategory(**cat_data)
        db.add(category)
    db.commit()
    
    # Programs
    programs_data = {
        "bachelor": [
            "BSc. Wirtschaftswissenschaften",
            "BSc. Betriebswirtschaftslehre",
            "BSc. International Business Administration",
            "BSc. (CE) Finance, Banking und Digitalisierung"
        ],
        "master": [
            "MSc. Digital Business Management",
            "MSc. Economic and Business Analytics",
            "MSc. Economics",
            "MSc. Finance and Accounting",
            "MSc. Management",
            "MSc. General Management Double Degree ESC Troyes",
            "MSc. General Management Double Degree STUST Tainan",
            "MSc. Global Business Canada/Peru",
            "MSc. Global Business Kanada/Taiwan",
            "MSc. Global Business Russland/Italien",
            "MSc. Leadership and Innovation in Organizations"
        ],
        "mba": [
            "MBA Global Executive MBA",
            "MBA Executive MBA Management & Leadership",
            "MBA Management und Leadership für Frauen",
            "MBA Health Care Management"
        ],
        "ulg": [
            "ULG Versicherungswirtschaft",
            "ULG Tourismusmanagement",
            "ULG Applied Business Excellence"
        ]
    }
    
    for cat_name, prog_list in programs_data.items():
        category = db.query(StudyCategory).filter(StudyCategory.name == cat_name).first()
        for i, prog_name in enumerate(prog_list):
            program = StudyProgram(
                category_id=category.id,
                name=prog_name,
                sort_order=i
            )
            db.add(program)
    db.commit()
    
    # Updates (existing hardcoded data)
    updates_data = [
        {"prog": "BSc. Wirtschaftswissenschaften", "items": [
            "Wissenschaftliches Arbeiten - neues Konzept: Seminar zur Bachelorarbeit ab 2025/26 nur noch 9 ECTS (statt 12). Neue LV: KS Wissenschaftliches Arbeiten für Wirtschaftswissenschaften: Methoden und Tools (3 ECTS).",
            "Das Modul Wissenschaftliches Arbeiten umfasst weiterhin 15 ECTS: KS Wissenschaftliches Arbeiten (3), KS Wissenschaftstheorie (3), SE Bachelorarbeit (9).",
            "Spezialisierungsfeld Economics & Psychology: Neue LVs in den Ergänzungsfächern Industrial Organization and Digital Economy, Public Finance, Public und Nonprofit Management, Sustainability Management.",
            "Spezialisierungsfeld Nachhaltige Team- und Personalentwicklung (WiPsy) wurde umfassend überarbeitet. Neue LVAs aus Soziologie, Wirtschaftspädagogik und Soziale Kompetenz.",
            "Neues weiterführendes Studium: Master Digital Society als direkt anschließender Studiengang für WiWi-Bachelorabsolvent:innen anerkannt."
        ]},
        {"prog": "BSc. Betriebswirtschaftslehre", "items": [
            "Major Knowledge and Data in the Digital Enterprise wird ab WS 2025/26 nicht mehr angeboten.",
            "Einführung in die Softwareentwicklung mit Python: Manuelle Zuteilung statt bisherigem Verfahren.",
            "Neue Voraussetzungen für IK Ethik und IK Gender und Diversity: 21 ECTS aus Core Business Knowledge + ein Fach aus Unternehmerisches Handeln."
        ]},
        {"prog": "BSc. International Business Administration", "items": [
            "Neues Pflichtmodul Mandatory Subject Elective Area: Business, Economics and Digitalization (24 ECTS) - erleichtert Anrechnung von Auslandssemester-LVAs.",
            "Anpassungen der ECTS bestehender Pflichtmodule: Int. Finance, Accounting and Taxation (24), Int. Management and Marketing (24), Digitalization and SCM (24), Economics (18).",
            "Anerkennung auf Fachebene statt LVA-Ebene möglich. Free Electives (18 ECTS) bleiben unverändert."
        ]},
        {"prog": "MSc. Digital Business Management", "items": [
            "Kooperationsstudium mit der FH Oberösterreich - aktuelle Informationen direkt von der FH bereitgestellt."
        ]},
        {"prog": "MSc. Economic and Business Analytics", "items": [
            "Neue LVs: IK Data Science in Python for Economic and Business Analytics (3 ECTS), IK Algorithmics and Mathematics (3 ECTS).",
            "Neue Voraussetzung für SE Analytic Methods: KS Empirical Economics und IK Empirical Economics."
        ]},
        {"prog": "MSc. Economics", "items": [
            "Umbenennung: KS Labor Economics and Public Policy zu KS Labor Economics. ECTS und Inhalte bleiben unverändert."
        ]},
        {"prog": "MSc. Finance and Accounting", "items": [
            "Keine Änderungen."
        ]},
        {"prog": "MSc. Management", "items": [
            "Neue Competence Area: Sustainable Entrepreneurship & Circular Economy Innovation (SECEI). Empfehlung: Im 1. Semester mit KS Entrepreneurship beginnen.",
            "Neue Anerkennung: Selected Topics in Business Sciences (Master, Abroad) - 6 oder 12 ECTS im General Management Competence Elective."
        ]},
        {"prog": "MSc. General Management Double Degree ESC Troyes", "items": [
            "Für dieses Studienprogramm wurden für dieses Semester keine Änderungen beschlossen."
        ]},
        {"prog": "MSc. General Management Double Degree STUST Tainan", "items": [
            "Für dieses Studienprogramm wurden für dieses Semester keine Änderungen beschlossen."
        ]},
        {"prog": "MSc. Global Business Canada/Peru", "items": [
            "Für dieses Studienprogramm wurden für dieses Semester keine Änderungen beschlossen."
        ]},
        {"prog": "MSc. Global Business Kanada/Taiwan", "items": [
            "Für dieses Studienprogramm wurden für dieses Semester keine Änderungen beschlossen."
        ]},
        {"prog": "MSc. Global Business Russland/Italien", "items": [
            "Für dieses Studienprogramm wurden für dieses Semester keine Änderungen beschlossen."
        ]},
        {"prog": "MSc. Leadership and Innovation in Organizations", "items": [
            "Für dieses Studienprogramm wurden für dieses Semester keine Änderungen beschlossen."
        ]}
    ]
    
    for u_data in updates_data:
        program = db.query(StudyProgram).filter(StudyProgram.name == u_data["prog"]).first()
        if program:
            for i, content in enumerate(u_data["items"]):
                update = StudyUpdate(
                    program_id=program.id,
                    content=content,
                    semester="Wintersemester 2025/26",
                    is_active=True,
                    sort_order=i,
                    created_by=master.id
                )
                db.add(update)
    db.commit()
    print("✅ Study data seeded!")

def seed_lvas(db: Session):
    """Seed LVAs on first startup (only if table is empty)"""
    # Check if LVAs already exist
    existing_count = db.query(LVA).count()
    if existing_count > 0:
        print(f"ℹ️ LVAs already seeded ({existing_count} LVAs found)")
        return
    
    print("🔄 Seeding LVAs...")
    
    lva_names = [
        "KS Buchhaltung nach UGB", "KS Bilanzierung nach UGB", "KS Finanzmanagement kompakt", "KS Steuern",
        "KS Grundlagen der Kostenrechnung", "KS Grundlagen des Kostenmanagements und der Budgetierung",
        "KS Einführung in Marketing", "KS Einführung in Strategie & Internationales Management",
        "KS Einführung in Organisation", "KS Einführung in Veränderungs- und Innovationsmanagement",
        "KS Grundlagen der Betriebswirtschaftslehre", "KS Grundlagen des integrierten Managements",
        "IK Integrative Fragestellungen aus Finance & Accounting", "IK Jahresabschlussanalyse",
        "IK Unternehmerisches Handeln - Management", "KS Grundlagen des Nachhaltigkeitsmanagement",
        "KS Grundlagen des Supply Chain Management", "IK Ethik", "IK Gender und Diversity",
        "VL Technische und methodische Grundlagen der Digitalisierung",
        "IK Technische und methodische Grundlagen der Digitalisierung",
        "VL Management der Digitalisierung und Einsatz betrieblicher Informationssysteme",
        "UE Management der Digitalisierung und Einsatz betrieblicher Informationssysteme",
        "VL Einführung in die Softwareentwicklung mit Python", "UE Einführung in die Softwareentwicklung mit Python",
        "KS Einführung in die Volkswirtschaftslehre", "KS Einführung in die Makroökonomie",
        "KS Einführung in die Mikroökonomie", "IK Einführung in die Mikroökonomie",
        "KS Mathematik für Sozial- und Wirtschaftswissenschaften", "KS Statistik für Sozial- und Wirtschaftswissenschaften",
        "KS Öffentliches Wirtschaftsrecht", "IK Öffentliches Wirtschaftsrecht",
        "KS Privates Wirtschaftsrecht", "IK Privates Wirtschaftsrecht",
        "KS Kommunikative Fertigkeiten Englisch (B2)", "KS Wirtschaftssprache I Englisch (B2+)",
        "KS Interkulturelle Fertigkeiten Englisch (C1)", "KS Wirtschaftssprache II Englisch (C1)",
        "KS Grundlagen der Wirtschaftsprüfung", "KS Internationale Rechnungslegung",
        "KS Einkommensteuer und Körperschaftsteuer", "KS Umsatzsteuer und Verkehrsteuern",
        "IK Gewinnermittlung", "IK Konzernrechnungslegung", "IK Tax Compliance",
        "SE Seminar Steuerlehre, Unternehmensrechnung und Wirtschaftsprüfung",
        "KS Grundlagen Operatives Controlling", "KS Operatives und strategisches Kostenmanagement",
        "KS Nachhaltigkeitscontrolling", "IK IT Systeme im Controlling", "IK Management Control Systems",
        "IK Strategisches Controlling", "SE Theorieseminar", "KS Unternehmensfinanzierung",
        "KS Wertpapiermanagement", "IK Grundzüge der Finanzwirtschaft", "IK Mergers & Acquisitions",
        "KS Investmentanalyse und Risikomanagement", "KS Real Estate Finance",
        "SE Finance - Wissenschaftliches Seminar", "KS Digital Business - Grundlagen",
        "IK Digital Business Planning", "VL Modell-basierte Entscheidungsunterstützung",
        "UE Modell-basierte Entscheidungsunterstützung", "KS Operations and Supply Chain Management",
        "IK Operations and Supply Chain Management", "KS Environmental and Quality Management",
        "KS Organizing Sustainability", "IK Transportation Logistics",
        "SE Software Tools for Decision Support in Transportation Logistics",
        "IK Introduction to Intelligent Solutions for Transportation and Physical Internet",
        "SE Traffic Simulation", "SE Research Seminar in Operations, Transport and Supply Chain Management",
        "UE Model-Based Decision Support", "KS Organization", "IK Organization",
        "KS Innovation and Entrepreneurship", "IK Innovation and Entrepreneurship",
        "SE Advanced Topics in Innovation and Entrepreneurship",
        "SE Advanced Topics in Organization and Innovation", "SE Entrepreneurial and Leadership Skills",
        "SE Research Seminar in Organization, Innovation and Entrepreneurship",
        "VL Datenmodellierung", "UE Datenmodellierung", "VL Prozess- und Kommunikationsmodellierung",
        "UE Prozess- und Kommunikationsmodellierung", "VL Informationsmanagement und strategische Projektsteuerung",
        "UE Informationsmanagement und strategische Projektsteuerung",
        "SE Seminar in Planung und Gestaltung der Digitalisierung",
        "KS Essentials of Leadership and Change", "IK Essentials of Leadership and Change",
        "KS Essentials of Strategic Management", "IK Essentials of Strategic Management",
        "SE Change", "SE Leadership", "SE Stakeholder Strategy", "SE Strategy Process",
        "SE Research Seminar Strategic Leadership", "KS Strategisches Management: Grundlagen",
        "IK Strategisches Management: Vertiefung", "KS Marktorientiertes Management: Grundlagen",
        "IK Marktorientiertes Management: Vertiefung", "SE Strategisches und Marktorientiertes Management in der Praxis",
        "SE Strategisches und Marktorientiertes Management: Forschung & Theorie",
        "KS Responsible Innovation", "SE Sustainable Business Practice",
        "KS Socio-Technical Transition Management", "SE Sustainable Management Accounting",
        "SE Research Seminar Sustainability", "IK Digital Business Anwendungen", "SE Seminar Digital Business",
        "KS International Business", "IK International Market Entry", "SE Cross Cultural Management",
        "IK Special Topics in International Management", "KS Grundkurs Public und Nonprofit Management",
        "SE Seminar aus Public und Nonprofit Management 1", "SE Seminar aus Public und Nonprofit Management 2",
    ]
    
    for name in lva_names:
        lva = LVA(name=name, is_active=True)
        db.add(lva)
    
    db.commit()
    print(f"LVAs seeded: {len(lva_names)}")

def seed_default_settings(db: Session):
    """Ensure default app_settings entries exist so admin sections don't fail"""
    defaults = {
        "nav_items": None,
        "oehli_enabled": "true",
        "instagram_username": "",
        "instagram_embed_code": "",
        "contact_email": "wirtschaft@oeh.jku.at",
    }
    for key, default_value in defaults.items():
        existing = db.query(AppSettings).filter(AppSettings.key == key).first()
        if not existing:
            setting = AppSettings(key=key, value=default_value)
            db.add(setting)
    db.commit()

# ═══════════════════════════════════════════════════════════════════════════
# LVA (LEHRVERANSTALTUNG) ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

# ─── HELPER FUNCTIONS FOR LVA ───────────────────────────────────────────────
def get_rating_text_and_color(avg: float, category: str) -> tuple:
    """Convert average rating to text and color based on category"""
    if avg is None:
        return None, None
    
    if category == "effort":
        texts = ["Niedrig", "Eher niedrig", "Durchschnittlich", "Eher hoch", "Sehr hoch"]
    elif category == "difficulty":
        texts = ["Gut verständlich", "Verständlich", "Anspruchsvoll", "Sehr anspruchsvoll", "Extrem anspruchsvoll"]
    else:  # total
        texts = ["Sehr unkritisch", "Unkritisch", "Ausgewogen", "Fordernd", "Sehr fordernd"]
    
    colors = ["green", "lime", "yellow", "orange", "red"]
    
    if avg < 1.5:
        return texts[0], colors[0]
    elif avg < 2.5:
        return texts[1], colors[1]
    elif avg < 3.5:
        return texts[2], colors[2]
    elif avg < 4.5:
        return texts[3], colors[3]
    else:
        return texts[4], colors[4]

def generate_verification_code() -> str:
    """Generate a 5-character verification code (uppercase letters + numbers)"""
    characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # Ohne I, O, 0, 1 (Verwechslungsgefahr)
    return ''.join(random.choice(characters) for _ in range(5))

def send_verification_email(email: str, code: str, lva_name: str) -> bool:
    """Send verification code via SMTP"""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL]):
        print("⚠️ SMTP not configured - code generation only (no email sent)")
        return True  # Return True to allow testing without SMTP
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = Header(f'Dein Verifizierungscode für die LVA-Bewertung', 'utf-8')
        msg['From'] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
        msg['To'] = email
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .header p {{ color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 14px; }}
                .content {{ padding: 30px; }}
                .code-box {{ background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }}
                .code {{ font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e293b; font-family: monospace; }}
                .lva-name {{ background: #eff6ff; color: #1d4ed8; padding: 8px 16px; border-radius: 8px; display: inline-block; margin: 10px 0; font-weight: 500; }}
                .info {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
                .info p {{ margin: 5px 0; color: #92400e; font-size: 13px; }}
                .footer {{ background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }}
                .footer p {{ color: #64748b; font-size: 12px; margin: 5px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>ÖH Wirtschaft</h1>
                    <p>Johannes-Kepler-Universität Linz</p>
                </div>
                <div class="content">
                    <p style="color: #475569; margin-bottom: 20px;">Liebe Kollegin / Lieber Kollege,</p>
                    <p style="color: #475569;">Du hast einen Verifizierungscode angefordert, um folgende LVA zu bewerten:</p>
                    <div style="text-align: center;">
                        <span class="lva-name">{lva_name}</span>
                    </div>
                    <div class="code-box">
                        <p style="color: #64748b; margin: 0 0 10px; font-size: 14px;">Dein Verifizierungscode:</p>
                        <div class="code">{code}</div>
                    </div>
                    <div class="info">
                        <p><strong>🔒 Anonymität:</strong> Deine E-Mail-Adresse wird NICHT gespeichert.</p>
                        <p><strong>⏱️ Gültigkeit:</strong> Dieser Code ist 30 Minuten gültig.</p>
                    </div>
                </div>
                <div style="padding: 0 30px 20px;">
                    <p style="color: #475569; margin: 20px 0 4px;">Liebe Grüße,</p>
                    <p style="color: #1e293b; font-weight: 600; margin: 0 0 2px;">Maximilian Pilsner (Vorsitzender)</p>
                    <p style="color: #475569; margin: 0;">und das Team deiner ÖH Wirtschaft</p>
                </div>
                <div class="footer">
                    <p>ÖH Wirtschaft - Studienvertretung</p>
                    <p>wirtschaft@oeh.jku.at</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        ÖH Wirtschaft - Verifizierungscode

        Liebe Kollegin / Lieber Kollege,

        Du hast einen Verifizierungscode angefordert, um folgende LVA zu bewerten:
        {lva_name}

        Dein Verifizierungscode: {code}

        Wichtig:
        - Deine E-Mail-Adresse wird NICHT gespeichert
        - Der Code ist 30 Minuten gültig

        Liebe Grüße,
        Maximilian Pilsner (Vorsitzender)
        und das Team deiner ÖH Wirtschaft

        ÖH Wirtschaft - Studienvertretung
        wirtschaft@oeh.jku.at
        """
        
        part1 = MIMEText(text_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, email, msg.as_string())
        server.quit()
        
        print("Verification email sent successfully")
        return True
        
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False

def calculate_lva_ratings(lva: LVA) -> dict:
    """Calculate average ratings for an LVA"""
    ratings = lva.ratings
    if not ratings:
        return {
            "rating_count": 0,
            "avg_effort": None,
            "avg_difficulty": None,
            "avg_total": None,
            "effort_text": None,
            "effort_color": None,
            "difficulty_text": None,
            "difficulty_color": None,
            "total_text": None,
            "total_color": None,
        }
    
    count = len(ratings)
    avg_effort = sum(r.effort_rating for r in ratings) / count
    avg_difficulty = sum(r.difficulty_rating for r in ratings) / count
    avg_total = (avg_effort + avg_difficulty) / 2
    
    effort_text, effort_color = get_rating_text_and_color(avg_effort, "effort")
    difficulty_text, difficulty_color = get_rating_text_and_color(avg_difficulty, "difficulty")
    total_text, total_color = get_rating_text_and_color(avg_total, "total")
    
    return {
        "rating_count": count,
        "avg_effort": round(avg_effort, 2),
        "avg_difficulty": round(avg_difficulty, 2),
        "avg_total": round(avg_total, 2),
        "effort_text": effort_text,
        "effort_color": effort_color,
        "difficulty_text": difficulty_text,
        "difficulty_color": difficulty_color,
        "total_text": total_text,
        "total_color": total_color,
    }

# ─── PUBLIC LVA ENDPOINTS ───────────────────────────────────────────────────
@app.get("/api/lvas/stats")
def get_lva_stats(db: Session = Depends(get_db)):
    """Get LVA statistics (total count)"""
    total = db.query(LVA).filter(LVA.is_active == True).count()
    rated = db.query(LVA).filter(LVA.is_active == True).join(LVARating).distinct().count()
    return {"total": total, "rated": rated}

@app.get("/api/lvas/top")
def get_top_lvas(limit: int = 10, db: Session = Depends(get_db)):
    """Get top 5 best and top 5 hardest LVAs"""
    lvas = db.query(LVA).filter(LVA.is_active == True).all()
    
    rated_lvas = []
    for lva in lvas:
        ratings = calculate_lva_ratings(lva)
        if ratings["rating_count"] > 0:  # NUR bewertete LVAs
            rated_lvas.append({
                "id": lva.id,
                "name": lva.name,
                "description": lva.description,
                **ratings
            })
    
    # Top 5 beste (niedrigster avg_total = am besten)
    best_lvas = sorted(rated_lvas, key=lambda x: (x["avg_total"], -x["rating_count"]))[:5]
    
    # Top 5 schwersten (höchster avg_difficulty = am schwersten)
    hardest_lvas = sorted(rated_lvas, key=lambda x: (-x["avg_difficulty"] if x["avg_difficulty"] else 0, -x["rating_count"]))[:5]
    
    return {
        "best": best_lvas,
        "hardest": hardest_lvas
    }

@app.get("/api/lvas")
def get_lvas(search: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all active LVAs with their ratings (public)"""
    query = db.query(LVA).filter(LVA.is_active == True)
    
    if search:
        query = query.filter(LVA.name.ilike(f"%{search}%"))
    
    lvas = query.order_by(LVA.name).all()
    
    result = []
    for lva in lvas:
        ratings = calculate_lva_ratings(lva)
        result.append({
            "id": lva.id,
            "name": lva.name,
            "description": lva.description,
            "is_active": lva.is_active,
            **ratings
        })
    
    return result

@app.get("/api/lvas/{lva_id}")
def get_lva(lva_id: int, db: Session = Depends(get_db)):
    """Get a single LVA with ratings"""
    lva = db.query(LVA).filter(LVA.id == lva_id).first()
    if not lva:
        raise HTTPException(status_code=404, detail="LVA nicht gefunden")
    
    ratings = calculate_lva_ratings(lva)
    return {
        "id": lva.id,
        "name": lva.name,
        "description": lva.description,
        "is_active": lva.is_active,
        **ratings
    }

@app.post("/api/lva/request-code")
def request_verification_code(request: RequestCodeRequest, raw_request: Request, db: Session = Depends(get_db)):
    """Request a verification code for LVA rating"""
    client_ip = get_client_ip(raw_request)
    check_rate_limit("lva_code", client_ip, max_requests=3, window_seconds=300)
    # Validate email domain against whitelist
    email_valid = any(request.email.endswith(domain) for domain in ALLOWED_EMAIL_DOMAINS)
    
    if not email_valid:
        allowed_domains_str = ", ".join(ALLOWED_EMAIL_DOMAINS)
        raise HTTPException(
            status_code=403, 
            detail=f"Du bist nicht berechtigt. Erlaubte E-Mail-Endungen: {allowed_domains_str}. Bei Fragen melde dich unter wirtschaft@oeh.jku.at"
        )
    
    # Check if LVA exists
    lva = db.query(LVA).filter(LVA.id == request.lva_id, LVA.is_active == True).first()
    if not lva:
        raise HTTPException(status_code=404, detail="LVA nicht gefunden")
    
    # Invalidate any existing unused codes for this email and LVA
    db.query(VerificationCode).filter(
        VerificationCode.email == request.email,
        VerificationCode.lva_id == request.lva_id,
        VerificationCode.is_used == False
    ).update({"is_used": True})
    db.commit()
    
    # Generate new code
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    verification = VerificationCode(
        email=request.email,
        code=code,
        lva_id=request.lva_id,
        expires_at=expires_at,
        is_admin_code=False,
        is_used=False
    )
    safe_add_and_commit(db, verification, "verification_codes")

    # Send email
    email_sent = send_verification_email(request.email, code, lva.name)
    
    if not email_sent and SMTP_HOST:  # Only fail if SMTP is configured but failed
        raise HTTPException(status_code=500, detail="E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.")
    
    return {
        "success": True,
        "message": "Code wurde gesendet! Überprüfe dein E-Mail-Postfach.",
        "expires_in_minutes": 30
    }

@app.post("/api/lva/verify-code")
def verify_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Verify a code before rating submission"""
    from sqlalchemy import text, or_

    ensure_admin_code_columns(db)

    verification = None
    is_admin_code = False

    if request.email:
        verification = db.query(VerificationCode).filter(
            VerificationCode.email == request.email,
            VerificationCode.code == request.code.upper(),
            VerificationCode.lva_id == request.lva_id,
            VerificationCode.is_used == False,
            or_(VerificationCode.is_admin_code == False, VerificationCode.is_admin_code == None)
        ).first()

    if not verification:
        try:
            result = db.execute(text("""
                SELECT id, code, max_uses, use_count, expires_at
                FROM verification_codes
                WHERE code = :code AND is_admin_code = TRUE
            """), {"code": request.code.upper()})
            row = result.fetchone()
            if row:
                is_admin_code = True
                # Check if admin code can still be used
                max_uses = row.max_uses or 1
                use_count = row.use_count or 0
                if use_count >= max_uses:
                    raise HTTPException(status_code=400, detail="Code wurde bereits vollständig verwendet")
                # Check expiry
                expires_at = row.expires_at
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at < datetime.now(timezone.utc):
                    raise HTTPException(status_code=400, detail="Code ist abgelaufen. Bitte fordere einen neuen Code an.")
                # All good
                return {"success": True, "message": "Code ist gültig", "is_admin_code": True}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Admin code check error: {e}")
            pass
    
    if not verification:
        raise HTTPException(status_code=400, detail="Ungültiger Code")
    
    # Handle timezone-naive datetime for regular codes
    expires_at = verification.expires_at
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code ist abgelaufen. Bitte fordere einen neuen Code an.")
    
    return {"success": True, "message": "Code ist gültig", "is_admin_code": is_admin_code}

@app.post("/api/lva/submit-rating")
def submit_rating(request: SubmitRatingRequest, db: Session = Depends(get_db)):
    """Submit a rating for an LVA"""
    from sqlalchemy import text, or_

    ensure_admin_code_columns(db)

    if not (1 <= request.effort_rating <= 5) or not (1 <= request.difficulty_rating <= 5):
        raise HTTPException(status_code=400, detail="Bewertungen müssen zwischen 1 und 5 liegen")

    verification = None
    is_admin_code = False
    admin_code_id = None

    if request.email:
        verification = db.query(VerificationCode).filter(
            VerificationCode.email == request.email,
            VerificationCode.code == request.code.upper(),
            VerificationCode.lva_id == request.lva_id,
            VerificationCode.is_used == False,
            or_(VerificationCode.is_admin_code == False, VerificationCode.is_admin_code == None)
        ).first()

    # If not found, try to find an admin code
    if not verification:
        try:
            result = db.execute(text("""
                SELECT id, code, max_uses, use_count, expires_at 
                FROM verification_codes 
                WHERE code = :code AND is_admin_code = TRUE
            """), {"code": request.code.upper()})
            row = result.fetchone()
            if row:
                is_admin_code = True
                admin_code_id = row.id
                max_uses = row.max_uses or 1
                use_count = row.use_count or 0
                if use_count >= max_uses:
                    raise HTTPException(status_code=400, detail="Code wurde bereits vollständig verwendet")
                # Check expiry
                expires_at = row.expires_at
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at < datetime.now(timezone.utc):
                    raise HTTPException(status_code=400, detail="Code ist abgelaufen")
        except HTTPException:
            raise
        except:
            pass
    
    if not verification and not is_admin_code:
        raise HTTPException(status_code=400, detail="Ungültiger oder bereits verwendeter Code")
    
    # For regular codes, check expiry
    if verification:
        expires_at = verification.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Code ist abgelaufen")
    
    # Check if LVA exists
    lva = db.query(LVA).filter(LVA.id == request.lva_id).first()
    if not lva:
        raise HTTPException(status_code=404, detail="LVA nicht gefunden")
    
    # Mark code as used
    if is_admin_code:
        db.execute(text("""
            UPDATE verification_codes 
            SET use_count = use_count + 1,
                is_used = CASE WHEN use_count + 1 >= max_uses THEN TRUE ELSE is_used END
            WHERE id = :id
        """), {"id": admin_code_id})
    else:
        verification.is_used = True
    
    rating = LVARating(
        lva_id=request.lva_id,
        effort_rating=request.effort_rating,
        difficulty_rating=request.difficulty_rating
    )
    safe_add_and_commit(db, rating, "lva_ratings")

    create_notification(
        db, "lva",
        f"Neue LVA-Bewertung: {lva.name}",
        f"Aufwand: {request.effort_rating}/5, Schwierigkeit: {request.difficulty_rating}/5",
        {
            "lva_id": request.lva_id,
            "lva_name": lva.name,
            "effort_rating": request.effort_rating,
            "difficulty_rating": request.difficulty_rating
        }
    )

    return {
        "success": True,
        "message": "Bewertung erfolgreich abgegeben! Vielen Dank für dein Feedback."
    }

# ─── ADMIN LVA ENDPOINTS ────────────────────────────────────────────────────
@app.get("/api/admin/lvas")
def admin_get_lvas(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all LVAs for admin (including inactive)"""
    lvas = db.query(LVA).order_by(LVA.name).all()
    
    result = []
    for lva in lvas:
        ratings = calculate_lva_ratings(lva)
        result.append({
            "id": lva.id,
            "name": lva.name,
            "description": lva.description,
            "is_active": lva.is_active,
            "created_at": lva.created_at.isoformat(),
            "updated_at": lva.updated_at.isoformat() if lva.updated_at else None,
            **ratings
        })
    
    return result

@app.post("/api/admin/lvas")
def admin_create_lva(request: LVACreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Create a new LVA"""
    # Check if LVA with same name exists
    existing = db.query(LVA).filter(LVA.name == request.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="LVA mit diesem Namen existiert bereits")
    
    lva = LVA(
        name=request.name,
        description=request.description,
        is_active=request.is_active
    )
    safe_add_and_commit(db, lva, "lvas")
    db.refresh(lva)

    log_activity(db, current_admin.id, "LVA_CREATE", f"LVA '{lva.name}' erstellt", "lva", lva.id)

    return {"id": lva.id, "message": "LVA erstellt"}

@app.put("/api/admin/lvas/{lva_id}")
def admin_update_lva(lva_id: int, request: LVAUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Update an LVA"""
    lva = db.query(LVA).filter(LVA.id == lva_id).first()
    if not lva:
        raise HTTPException(status_code=404, detail="LVA nicht gefunden")
    
    if request.name is not None:
        # Check for duplicate name
        existing = db.query(LVA).filter(LVA.name == request.name, LVA.id != lva_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="LVA mit diesem Namen existiert bereits")
        lva.name = request.name
    
    if request.description is not None:
        lva.description = request.description
    if request.is_active is not None:
        lva.is_active = request.is_active
    
    db.commit()
    log_activity(db, current_admin.id, "LVA_UPDATE", f"LVA '{lva.name}' aktualisiert", "lva", lva.id)
    
    return {"message": "LVA aktualisiert"}

@app.delete("/api/admin/lvas/{lva_id}")
def admin_delete_lva(lva_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Delete an LVA"""
    lva = db.query(LVA).filter(LVA.id == lva_id).first()
    if not lva:
        raise HTTPException(status_code=404, detail="LVA nicht gefunden")
    
    name = lva.name
    db.delete(lva)
    db.commit()
    
    log_activity(db, current_admin.id, "LVA_DELETE", f"LVA '{name}' gelöscht")
    
    return {"message": "LVA gelöscht"}

@app.post("/api/admin/lvas/import")
def admin_import_lvas(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Import LVAs from predefined list (one-time seed)"""
    lva_names = [
        "KS Buchhaltung nach UGB", "KS Bilanzierung nach UGB", "KS Finanzmanagement kompakt", "KS Steuern",
        "KS Grundlagen der Kostenrechnung", "KS Grundlagen des Kostenmanagements und der Budgetierung",
        "KS Einführung in Marketing", "KS Einführung in Strategie & Internationales Management",
        "KS Einführung in Organisation", "KS Einführung in Veränderungs- und Innovationsmanagement",
        "KS Grundlagen der Betriebswirtschaftslehre", "KS Grundlagen des integrierten Managements",
        "IK Integrative Fragestellungen aus Finance & Accounting", "IK Jahresabschlussanalyse",
        "IK Unternehmerisches Handeln - Management", "KS Grundlagen des Nachhaltigkeitsmanagement",
        "KS Grundlagen des Supply Chain Management", "IK Ethik", "IK Gender und Diversity",
        "VL Technische und methodische Grundlagen der Digitalisierung",
        "IK Technische und methodische Grundlagen der Digitalisierung",
        "VL Management der Digitalisierung und Einsatz betrieblicher Informationssysteme",
        "UE Management der Digitalisierung und Einsatz betrieblicher Informationssysteme",
        "VL Einführung in die Softwareentwicklung mit Python", "UE Einführung in die Softwareentwicklung mit Python",
        "KS Einführung in die Volkswirtschaftslehre", "KS Einführung in die Makroökonomie",
        "KS Einführung in die Mikroökonomie", "IK Einführung in die Mikroökonomie",
        "KS Mathematik für Sozial- und Wirtschaftswissenschaften", "KS Statistik für Sozial- und Wirtschaftswissenschaften",
        "KS Öffentliches Wirtschaftsrecht", "IK Öffentliches Wirtschaftsrecht",
        "KS Privates Wirtschaftsrecht", "IK Privates Wirtschaftsrecht",
        "KS Kommunikative Fertigkeiten Englisch (B2)", "KS Wirtschaftssprache I Englisch (B2+)",
        "KS Interkulturelle Fertigkeiten Englisch (C1)", "KS Wirtschaftssprache II Englisch (C1)",
        "KS Grundlagen der Wirtschaftsprüfung", "KS Internationale Rechnungslegung",
        "KS Einkommensteuer und Körperschaftsteuer", "KS Umsatzsteuer und Verkehrsteuern",
        "IK Gewinnermittlung", "IK Konzernrechnungslegung", "IK Tax Compliance",
        "SE Seminar Steuerlehre, Unternehmensrechnung und Wirtschaftsprüfung",
        "KS Grundlagen Operatives Controlling", "KS Operatives und strategisches Kostenmanagement",
        "KS Nachhaltigkeitscontrolling", "IK IT Systeme im Controlling", "IK Management Control Systems",
        "IK Strategisches Controlling", "SE Theorieseminar", "KS Unternehmensfinanzierung",
        "KS Wertpapiermanagement", "IK Grundzüge der Finanzwirtschaft", "IK Mergers & Acquisitions",
        "KS Investmentanalyse und Risikomanagement", "KS Real Estate Finance",
        "SE Finance - Wissenschaftliches Seminar", "KS Digital Business - Grundlagen",
        "IK Digital Business Planning", "VL Modell-basierte Entscheidungsunterstützung",
        "UE Modell-basierte Entscheidungsunterstützung", "KS Operations and Supply Chain Management",
        "IK Operations and Supply Chain Management", "KS Environmental and Quality Management",
        "KS Organizing Sustainability", "IK Transportation Logistics",
        "SE Software Tools for Decision Support in Transportation Logistics",
        "IK Introduction to Intelligent Solutions for Transportation and Physical Internet",
        "SE Traffic Simulation", "SE Research Seminar in Operations, Transport and Supply Chain Management",
        "UE Model-Based Decision Support", "KS Organization", "IK Organization",
        "KS Innovation and Entrepreneurship", "IK Innovation and Entrepreneurship",
        "SE Advanced Topics in Innovation and Entrepreneurship",
        "SE Advanced Topics in Organization and Innovation", "SE Entrepreneurial and Leadership Skills",
        "SE Research Seminar in Organization, Innovation and Entrepreneurship",
        "VL Datenmodellierung", "UE Datenmodellierung", "VL Prozess- und Kommunikationsmodellierung",
        "UE Prozess- und Kommunikationsmodellierung", "VL Informationsmanagement und strategische Projektsteuerung",
        "UE Informationsmanagement und strategische Projektsteuerung",
        "SE Seminar in Planung und Gestaltung der Digitalisierung",
        "KS Essentials of Leadership and Change", "IK Essentials of Leadership and Change",
        "KS Essentials of Strategic Management", "IK Essentials of Strategic Management",
        "SE Change", "SE Leadership", "SE Stakeholder Strategy", "SE Strategy Process",
        "SE Research Seminar Strategic Leadership", "KS Strategisches Management: Grundlagen",
        "IK Strategisches Management: Vertiefung", "KS Marktorientiertes Management: Grundlagen",
        "IK Marktorientiertes Management: Vertiefung", "SE Strategisches und Marktorientiertes Management in der Praxis",
        "SE Strategisches und Marktorientiertes Management: Forschung & Theorie",
        "KS Responsible Innovation", "SE Sustainable Business Practice",
        "KS Socio-Technical Transition Management", "SE Sustainable Management Accounting",
        "SE Research Seminar Sustainability", "IK Digital Business Anwendungen", "SE Seminar Digital Business",
        "KS International Business", "IK International Market Entry", "SE Cross Cultural Management",
        "IK Special Topics in International Management", "KS Grundkurs Public und Nonprofit Management",
        "SE Seminar aus Public und Nonprofit Management 1", "SE Seminar aus Public und Nonprofit Management 2",
    ]
    
    imported = 0
    skipped = 0

    fix_sequence(db, "lvas")
    for name in lva_names:
        existing = db.query(LVA).filter(LVA.name == name).first()
        if not existing:
            lva = LVA(name=name, is_active=True)
            db.add(lva)
            imported += 1
        else:
            skipped += 1

    db.commit()
    log_activity(db, current_admin.id, "LVA_IMPORT", f"{imported} LVAs importiert, {skipped} übersprungen")
    
    return {"imported": imported, "skipped": skipped, "message": f"{imported} LVAs erfolgreich importiert"}

# ═══════════════════════════════════════════════════════════════════════════
# APP SETTINGS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/admin/settings/{key}")
def get_setting(key: str, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get a specific setting by key"""
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()
    return {"key": key, "value": setting.value if setting else None}

@app.put("/api/admin/settings/{key}")
def update_setting(key: str, value: str = None, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Update a setting (create if not exists)"""
    # Only master admin can change settings
    if current_admin.role != AdminRole.MASTER:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Einstellungen ändern")
    
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()

    if setting:
        setting.value = value
        db.commit()
    else:
        setting = AppSettings(key=key, value=value)
        safe_add_and_commit(db, setting, "app_settings")

    log_activity(db, current_admin.id, "SETTINGS_UPDATE", f"Einstellung '{key}' aktualisiert")

    return {"key": key, "value": value, "message": "Einstellung gespeichert"}

class SettingUpdate(BaseModel):
    value: Optional[str] = None

@app.post("/api/admin/settings/{key}")
def set_setting(key: str, request: SettingUpdate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Set a setting value"""
    # Only master admin can change settings
    if current_admin.role != AdminRole.MASTER:
        raise HTTPException(status_code=403, detail="Nur Master-Admin kann Einstellungen ändern")
    
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()

    if setting:
        setting.value = request.value
        db.commit()
    else:
        setting = AppSettings(key=key, value=request.value)
        safe_add_and_commit(db, setting, "app_settings")

    log_activity(db, current_admin.id, "SETTINGS_UPDATE", f"Einstellung '{key}' aktualisiert auf: {request.value or '(leer)'}")

    return {"key": key, "value": request.value, "message": "Einstellung gespeichert"}

# ═══════════════════════════════════════════════════════════════════════════
# ADMIN CODE MANAGEMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

class AdminCodeCreate(BaseModel):
    name: Optional[str] = None  # Optional name/description
    max_uses: int = 1
    expires_in_days: int = 30

class AdminCodeResponse(BaseModel):
    id: int
    code: str
    name: Optional[str]
    max_uses: int
    use_count: int
    is_active: bool
    expires_at: str
    created_at: str

def ensure_admin_code_columns(db: Session):
    """Ensure admin code columns exist in verification_codes table"""
    from sqlalchemy import text
    if 'postgresql' in DATABASE_URL:
        try:
            db.execute(text("ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1"))
            db.execute(text("ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0"))
            db.execute(text("ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS is_admin_code BOOLEAN DEFAULT FALSE"))
            db.execute(text("ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER"))
            db.execute(text("ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS name VARCHAR(100)"))
            db.execute(text("ALTER TABLE verification_codes ALTER COLUMN email DROP NOT NULL"))
            db.execute(text("ALTER TABLE verification_codes ALTER COLUMN lva_id DROP NOT NULL"))
            db.commit()
        except:
            db.rollback()

@app.get("/api/admin/codes")
def get_admin_codes(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all admin-created codes"""
    from sqlalchemy import text
    
    # Ensure columns exist
    ensure_admin_code_columns(db)
    
    # Use raw SQL to be safe
    try:
        result = db.execute(text("""
            SELECT id, code, name, max_uses, use_count, is_admin_code, expires_at, created_at 
            FROM verification_codes 
            WHERE is_admin_code = TRUE 
            ORDER BY created_at DESC
        """))
        rows = result.fetchall()
    except:
        return []
    
    now = datetime.now(timezone.utc)
    codes = []
    for row in rows:
        expires_at = row.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        codes.append({
            "id": row.id,
            "code": row.code,
            "name": row.name,
            "max_uses": row.max_uses or 1,
            "use_count": row.use_count or 0,
            "is_active": (row.use_count or 0) < (row.max_uses or 1) and expires_at > now,
            "expires_at": row.expires_at.isoformat(),
            "created_at": row.created_at.isoformat()
        })
    return codes

@app.post("/api/admin/codes")
def create_admin_code(
    request: AdminCodeCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new admin code for LVA ratings"""
    from sqlalchemy import text
    
    # Ensure columns exist first
    ensure_admin_code_columns(db)
    
    # Generate code automatically
    code = generate_verification_code()
    
    # Check if code already exists (regenerate if needed)
    while db.query(VerificationCode).filter(VerificationCode.code == code).first():
        code = generate_verification_code()
    
    # Create code
    verification_code = VerificationCode(
        code=code,
        name=request.name,
        email=None,
        lva_id=None,
        max_uses=max(1, request.max_uses),
        use_count=0,
        is_admin_code=True,
        created_by_admin_id=current_admin.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=max(1, request.expires_in_days))
    )

    safe_add_and_commit(db, verification_code, "verification_codes")
    db.refresh(verification_code)
    
    name_info = f" ({request.name})" if request.name else ""
    log_activity(db, current_admin.id, "CODE_CREATE", f"Admin-Code erstellt: {code}{name_info} (max. {request.max_uses}x)")
    
    return {
        "id": verification_code.id,
        "code": verification_code.code,
        "name": verification_code.name,
        "max_uses": verification_code.max_uses,
        "expires_at": verification_code.expires_at.isoformat(),
        "message": "Code erfolgreich erstellt"
    }

@app.delete("/api/admin/codes/{code_id}")
def delete_admin_code(
    code_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete an admin code"""
    from sqlalchemy import text
    
    # Ensure columns exist
    ensure_admin_code_columns(db)
    
    # Use raw SQL for safer query
    try:
        result = db.execute(text("SELECT id, code FROM verification_codes WHERE id = :id AND is_admin_code = TRUE"), {"id": code_id})
        row = result.fetchone()
    except:
        raise HTTPException(status_code=404, detail="Code nicht gefunden")
    
    if not row:
        raise HTTPException(status_code=404, detail="Code nicht gefunden")
    
    code_str = row.code
    db.execute(text("DELETE FROM verification_codes WHERE id = :id"), {"id": code_id})
    db.commit()
    
    log_activity(db, current_admin.id, "CODE_DELETE", f"Admin-Code gelöscht: {code_str}")
    
    return {"message": "Code gelöscht"}

class AdminCodeUpdate(BaseModel):
    max_uses: Optional[int] = None
    expires_in_days: Optional[int] = None
    name: Optional[str] = None

@app.put("/api/admin/codes/{code_id}")
def update_admin_code(
    code_id: int,
    request: AdminCodeUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update an admin code"""
    from sqlalchemy import text
    
    # Ensure columns exist
    ensure_admin_code_columns(db)
    
    # Check if code exists
    try:
        result = db.execute(text("SELECT id, code, max_uses, use_count FROM verification_codes WHERE id = :id AND is_admin_code = TRUE"), {"id": code_id})
        row = result.fetchone()
    except:
        raise HTTPException(status_code=404, detail="Code nicht gefunden")
    
    if not row:
        raise HTTPException(status_code=404, detail="Code nicht gefunden")
    
    # Build update query
    updates = []
    params = {"id": code_id}
    
    if request.max_uses is not None:
        new_max = max(1, request.max_uses)
        # Ensure max_uses >= use_count
        if new_max < (row.use_count or 0):
            new_max = row.use_count or 1
        updates.append("max_uses = :max_uses")
        params["max_uses"] = new_max
        # Reset is_used if we increase max_uses
        updates.append("is_used = CASE WHEN :max_uses > use_count THEN FALSE ELSE is_used END")
    
    if request.expires_in_days is not None:
        new_expires = datetime.now(timezone.utc) + timedelta(days=max(1, request.expires_in_days))
        updates.append("expires_at = :expires_at")
        params["expires_at"] = new_expires
    
    if request.name is not None:
        updates.append("name = :name")
        params["name"] = request.name if request.name else None
    
    if updates:
        query = f"UPDATE verification_codes SET {', '.join(updates)} WHERE id = :id"
        db.execute(text(query), params)
        db.commit()
    
    log_activity(db, current_admin.id, "CODE_UPDATE", f"Admin-Code aktualisiert: {row.code}")

    return {"message": "Code aktualisiert"}

# ─── SITE SETTINGS ENDPOINTS ─────────────────────────────────────────────────
DEFAULT_NAV_ITEMS = [
    {"key": "home", "path": "/", "visible": True, "order": 0},
    {"key": "news", "path": "/news", "visible": True, "order": 1},
    {"key": "kalender", "path": "/kalender", "visible": True, "order": 2},
    {"key": "team", "path": "/team", "visible": True, "order": 3},
    {"key": "studium", "path": "/studium", "visible": True, "order": 4},
    {"key": "lva", "path": "/lva", "visible": True, "order": 5},
    {"key": "studienplaner", "path": "/studienplaner", "visible": True, "order": 6},
    {"key": "magazine", "path": "/magazine", "visible": True, "order": 7},
]

class SiteSettingsUpdate(BaseModel):
    nav_items: Optional[List[dict]] = None
    oehli_enabled: Optional[bool] = None

@app.get("/api/site-settings")
def get_site_settings(db: Session = Depends(get_db)):
    """Get public site settings (navbar items, oehli toggle)"""
    import json

    nav_setting = db.query(AppSettings).filter(AppSettings.key == "nav_items").first()
    oehli_setting = db.query(AppSettings).filter(AppSettings.key == "oehli_enabled").first()

    if nav_setting and nav_setting.value:
        try:
            nav_items = json.loads(nav_setting.value)
        except:
            nav_items = DEFAULT_NAV_ITEMS
    else:
        nav_items = DEFAULT_NAV_ITEMS

    oehli_enabled = True
    if oehli_setting and oehli_setting.value:
        oehli_enabled = oehli_setting.value.lower() == "true"

    return {
        "nav_items": nav_items,
        "oehli_enabled": oehli_enabled
    }

@app.put("/api/admin/site-settings")
def update_site_settings(
    request: SiteSettingsUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update site settings (admin only)"""
    import json

    if request.nav_items is not None:
        nav_setting = db.query(AppSettings).filter(AppSettings.key == "nav_items").first()
        if nav_setting:
            nav_setting.value = json.dumps(request.nav_items)
        else:
            nav_setting = AppSettings(key="nav_items", value=json.dumps(request.nav_items))
            db.add(nav_setting)
        log_activity(db, current_admin.id, "SETTINGS_UPDATE", "Navbar-Einstellungen aktualisiert")

    if request.oehli_enabled is not None:
        oehli_setting = db.query(AppSettings).filter(AppSettings.key == "oehli_enabled").first()
        if oehli_setting:
            oehli_setting.value = str(request.oehli_enabled).lower()
        else:
            oehli_setting = AppSettings(key="oehli_enabled", value=str(request.oehli_enabled).lower())
            db.add(oehli_setting)
        status = "aktiviert" if request.oehli_enabled else "deaktiviert"
        log_activity(db, current_admin.id, "SETTINGS_UPDATE", f"ÖHli Assistent {status}")

    db.commit()

    changes = []
    if request.nav_items is not None:
        changes.append("Navbar-Einstellungen")
    if request.oehli_enabled is not None:
        changes.append(f"OEHli {status}")

    if changes:
        create_notification(
            db, "sites",
            "Website-Einstellungen geaendert",
            f"{current_admin.display_name} hat {', '.join(changes)} aktualisiert.",
            {
                "changes": changes,
                "editor": current_admin.display_name
            }
        )

    return {"message": "Einstellungen gespeichert"}


# ─── MISC SETTINGS ENDPOINTS ─────────────────────────────────────────────────

class MiscSettingsUpdate(BaseModel):
    instagram_username: Optional[str] = None
    instagram_embed_code: Optional[str] = None
    instagram_widget_url: Optional[str] = None

@app.get("/api/misc-settings")
def get_misc_settings(db: Session = Depends(get_db)):
    """Get public misc settings (instagram username and widget url)"""
    instagram_setting = db.query(AppSettings).filter(AppSettings.key == "instagram_username").first()
    embed_setting = db.query(AppSettings).filter(AppSettings.key == "instagram_embed_code").first()

    return {
        "instagram_username": instagram_setting.value if instagram_setting else "",
        "instagram_embed_code": embed_setting.value if embed_setting else "",
        "instagram_widget_url": embed_setting.value if embed_setting else ""
    }

@app.put("/api/admin/misc-settings")
def update_misc_settings(
    request: MiscSettingsUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update misc settings (admin only)"""
    if request.instagram_username is not None:
        instagram_setting = db.query(AppSettings).filter(AppSettings.key == "instagram_username").first()
        username = request.instagram_username.strip().lstrip('@')
        if instagram_setting:
            instagram_setting.value = username
        else:
            instagram_setting = AppSettings(key="instagram_username", value=username)
            db.add(instagram_setting)
        log_activity(db, current_admin.id, "SETTINGS_UPDATE", f"Instagram Username auf @{username} gesetzt")

    widget_url = request.instagram_widget_url if request.instagram_widget_url is not None else request.instagram_embed_code
    if widget_url is not None:
        embed_setting = db.query(AppSettings).filter(AppSettings.key == "instagram_embed_code").first()
        if embed_setting:
            embed_setting.value = widget_url
        else:
            embed_setting = AppSettings(key="instagram_embed_code", value=widget_url)
            db.add(embed_setting)
        log_activity(db, current_admin.id, "SETTINGS_UPDATE", "Instagram Widget-URL aktualisiert")

    db.commit()

    return {"message": "Einstellungen gespeichert"}


# ─── PARTNER ENDPOINTS ─────────────────────────────────────────────────────────

class PartnerCreate(BaseModel):
    name: str
    logo_url: str
    website_url: str
    partner_type: Optional[str] = "partner"
    sort_order: Optional[int] = 0

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    partner_type: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class PartnerResponse(BaseModel):
    id: int
    name: str
    logo_url: str
    website_url: str
    partner_type: str
    sort_order: int
    is_active: bool

def ensure_partner_type_column(db: Session) -> bool:
    """Check if partner_type column exists and add it if missing, also fix enum values"""
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(db.bind)
        columns = [col['name'] for col in inspector.get_columns('partners')]

        if 'partner_type' not in columns:
            try:
                db.execute(text("ALTER TABLE partners ADD COLUMN partner_type VARCHAR(20) DEFAULT 'partner'"))
                db.commit()
                print("Added partner_type column to partners table")
            except Exception as e:
                print(f"Could not add partner_type column: {e}")
                db.rollback()
                return False

        try:
            db.execute(text("UPDATE partners SET partner_type = 'partner' WHERE partner_type IS NULL OR partner_type = '' OR partner_type = 'PARTNER'"))
            db.execute(text("UPDATE partners SET partner_type = 'sponsor' WHERE partner_type = 'SPONSOR'"))
            db.commit()
        except Exception as e:
            print(f"Could not normalize partner_type values: {e}")
            db.rollback()

        return True
    except Exception as e:
        print(f"Error checking partner_type column: {e}")
        return False

def get_partners_safe(db: Session, active_only: bool = True, partner_type_filter: Optional[str] = None):
    """Safe partner query using raw SQL to avoid enum issues"""
    ensure_partner_type_column(db)

    from sqlalchemy import text

    try:
        if active_only:
            if partner_type_filter:
                sql = text("SELECT id, name, logo_url, website_url, partner_type, sort_order, is_active, created_at FROM partners WHERE is_active = true AND partner_type = :ptype ORDER BY sort_order ASC")
                result = db.execute(sql, {"ptype": partner_type_filter})
            else:
                sql = text("SELECT id, name, logo_url, website_url, partner_type, sort_order, is_active, created_at FROM partners WHERE is_active = true ORDER BY sort_order ASC")
                result = db.execute(sql)
        else:
            sql = text("SELECT id, name, logo_url, website_url, partner_type, sort_order, is_active, created_at FROM partners ORDER BY sort_order ASC")
            result = db.execute(sql)

        return [
            {
                "id": row[0],
                "name": row[1],
                "logo_url": row[2],
                "website_url": row[3],
                "partner_type": row[4] if row[4] else "partner",
                "sort_order": row[5],
                "is_active": row[6] if row[6] is not None else True,
                "created_at": row[7].isoformat() if row[7] else None
            }
            for row in result
        ]
    except Exception as e:
        print(f"Error in get_partners_safe: {e}")
        return []

@app.get("/api/partners")
def get_partners(partner_type: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all active partners (public), optionally filtered by type"""
    partners = get_partners_safe(db, active_only=True, partner_type_filter=partner_type)
    return partners

@app.get("/api/admin/partners")
def get_all_partners(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all partners including inactive (admin only)"""
    return get_partners_safe(db, active_only=False)

@app.post("/api/admin/partners")
def create_partner(
    request: PartnerCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new partner (admin only)"""
    ensure_partner_type_column(db)
    from sqlalchemy import text

    partner_type = request.partner_type or "partner"

    type_count = db.execute(text("SELECT COUNT(*) FROM partners WHERE partner_type = :ptype"), {"ptype": partner_type}).scalar()
    if type_count >= 8:
        raise HTTPException(status_code=400, detail=f"Maximal 8 {partner_type} erlaubt")

    sql = text("""
        INSERT INTO partners (name, logo_url, website_url, partner_type, sort_order, is_active, created_at, updated_at)
        VALUES (:name, :logo_url, :website_url, :partner_type, :sort_order, true, NOW(), NOW())
        RETURNING id
    """)
    result = db.execute(sql, {
        "name": request.name,
        "logo_url": request.logo_url,
        "website_url": request.website_url,
        "partner_type": partner_type,
        "sort_order": request.sort_order or 0
    })
    new_id = result.scalar()
    db.commit()

    log_activity(db, current_admin.id, "PARTNER_CREATE", f"Partner '{request.name}' erstellt")

    type_label = "Sponsor" if partner_type == "sponsor" else "Partner"
    create_notification(
        db, "partners",
        f"Neuer {type_label}: {request.name}",
        f"{current_admin.display_name} hat einen neuen {type_label} hinzugefuegt.",
        {
            "partner_id": new_id,
            "name": request.name,
            "type": partner_type,
            "website": request.website_url
        }
    )

    return {
        "id": new_id,
        "name": request.name,
        "logo_url": request.logo_url,
        "website_url": request.website_url,
        "partner_type": partner_type,
        "sort_order": request.sort_order or 0,
        "is_active": True
    }

@app.put("/api/admin/partners/{partner_id}")
def update_partner(
    partner_id: int,
    request: PartnerUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a partner (admin only)"""
    ensure_partner_type_column(db)
    from sqlalchemy import text

    check_sql = text("SELECT id, name, partner_type FROM partners WHERE id = :id")
    existing = db.execute(check_sql, {"id": partner_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Partner nicht gefunden")

    updates = []
    params = {"id": partner_id}
    if request.name is not None:
        updates.append("name = :name")
        params["name"] = request.name
    if request.logo_url is not None:
        updates.append("logo_url = :logo_url")
        params["logo_url"] = request.logo_url
    if request.website_url is not None:
        updates.append("website_url = :website_url")
        params["website_url"] = request.website_url
    if request.partner_type is not None:
        updates.append("partner_type = :partner_type")
        params["partner_type"] = request.partner_type
    if request.sort_order is not None:
        updates.append("sort_order = :sort_order")
        params["sort_order"] = request.sort_order
    if request.is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = request.is_active

    if updates:
        updates.append("updated_at = NOW()")
        sql = text(f"UPDATE partners SET {', '.join(updates)} WHERE id = :id")
        db.execute(sql, params)
        db.commit()

    log_activity(db, current_admin.id, "PARTNER_UPDATE", f"Partner '{request.name or existing[1]}' aktualisiert")

    get_sql = text("SELECT id, name, logo_url, website_url, partner_type, sort_order, is_active FROM partners WHERE id = :id")
    updated = db.execute(get_sql, {"id": partner_id}).fetchone()

    return {
        "id": updated[0],
        "name": updated[1],
        "logo_url": updated[2],
        "website_url": updated[3],
        "partner_type": updated[4] or "partner",
        "sort_order": updated[5],
        "is_active": updated[6]
    }

@app.delete("/api/admin/partners/{partner_id}")
def delete_partner(
    partner_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a partner (admin only)"""
    from sqlalchemy import text

    check_sql = text("SELECT name FROM partners WHERE id = :id")
    existing = db.execute(check_sql, {"id": partner_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Partner nicht gefunden")

    name = existing[0]
    delete_sql = text("DELETE FROM partners WHERE id = :id")
    db.execute(delete_sql, {"id": partner_id})
    db.commit()

    log_activity(db, current_admin.id, "PARTNER_DELETE", f"Partner '{name}' gelöscht")

    return {"message": f"Partner '{name}' wurde gelöscht"}

@app.post("/api/admin/partners/upload-logo")
async def upload_partner_logo(
    file: UploadFile = File(...),
    current_admin: Admin = Depends(get_current_admin),
):
    """Upload a partner logo and return as base64 data URL"""
    import base64

    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Nur PNG, JPG, WebP und SVG Dateien sind erlaubt")

    file_data = await file.read()

    max_size = 2 * 1024 * 1024
    if len(file_data) > max_size:
        raise HTTPException(status_code=400, detail="Logo darf maximal 2 MB groß sein")

    if not validate_file_content(file_data, file.content_type, file.filename):
        raise HTTPException(status_code=400, detail="Die Datei ist ungueltig oder hat ein nicht erlaubtes Format.")

    if file.content_type == "image/svg+xml":
        file_data = sanitize_svg(file_data)

    b64_data = base64.b64encode(file_data).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{b64_data}"

    return {"logo_url": data_url, "filename": file.filename}

# ─── SURVEY ENDPOINTS ───────────────────────────────────────────────────────────

@app.get("/api/survey/active")
def get_active_survey(db: Session = Depends(get_db)):
    """Get the currently active survey for public display"""
    now = datetime.now(timezone.utc)
    survey = db.query(Survey).filter(
        Survey.is_active == True
    ).first()

    if not survey:
        return None

    # Check date constraints - handle timezone-naive dates from database
    if survey.start_date:
        start = survey.start_date
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if start > now:
            return None
    if survey.end_date:
        end = survey.end_date
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        if end < now:
            return None
    
    questions = []
    for q in survey.questions:
        questions.append({
            "id": q.id,
            "question_de": q.question_de,
            "question_en": q.question_en,
            "question_type": q.question_type.value if q.question_type else "text",
            "is_required": q.is_required,
            "options": q.options,
            "settings": q.settings,
            "condition": q.condition,
            "sort_order": q.sort_order
        })
    
    return {
        "id": survey.id,
        "title_de": survey.title_de,
        "title_en": survey.title_en,
        "description_de": survey.description_de,
        "description_en": survey.description_en,
        "banner_text_de": survey.banner_text_de,
        "banner_text_en": survey.banner_text_en,
        "show_banner": survey.show_banner,
        "raffle_enabled": survey.raffle_enabled,
        "raffle_description_de": survey.raffle_description_de,
        "raffle_description_en": survey.raffle_description_en,
        "questions": questions
    }

@app.post("/api/survey/{survey_id}/submit")
def submit_survey(
    survey_id: int,
    submission: SurveySubmit,
    raw_request: Request,
    db: Session = Depends(get_db)
):
    """Submit survey responses"""
    client_ip = get_client_ip(raw_request)
    check_rate_limit(f"survey:{survey_id}", client_ip, max_requests=1, window_seconds=900)
    survey = db.query(Survey).filter(Survey.id == survey_id, Survey.is_active == True).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Umfrage nicht gefunden oder nicht aktiv")

    fix_sequence(db, "survey_responses")
    fix_sequence(db, "survey_answers")

    response = SurveyResponse(
        survey_id=survey_id,
        participant_email=submission.email if submission.participate_raffle else None,
        raffle_participated=submission.participate_raffle if submission.participate_raffle else False
    )
    db.add(response)
    db.flush()

    for question_id_str, answer_value in submission.answers.items():
        try:
            question_id = int(question_id_str)
        except (ValueError, TypeError):
            continue
        answer = SurveyAnswer(
            response_id=response.id,
            question_id=question_id,
            answer_value=json.dumps(answer_value) if isinstance(answer_value, (list, dict)) else str(answer_value)
        )
        db.add(answer)

    db.commit()

    create_notification(
        db, "misc",
        f"Neue Umfrage-Teilnahme: {survey.title_de}",
        f"Jemand hat an der Umfrage teilgenommen." + (" (Mit Gewinnspiel-Teilnahme)" if submission.participate_raffle else ""),
        {
            "survey_id": survey_id,
            "survey_title": survey.title_de,
            "response_id": response.id,
            "raffle_participated": submission.participate_raffle,
            "email": submission.email if submission.participate_raffle else None
        }
    )

    return {"message": "Danke für deine Teilnahme!", "response_id": response.id}

# Admin Survey Endpoints
@app.get("/api/admin/surveys")
def get_all_surveys(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all surveys"""
    surveys = db.query(Survey).order_by(Survey.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "title_de": s.title_de,
            "title_en": s.title_en,
            "is_active": s.is_active,
            "show_banner": s.show_banner,
            "response_count": len(s.responses),
            "question_count": len(s.questions),
            "start_date": s.start_date.isoformat() if s.start_date else None,
            "end_date": s.end_date.isoformat() if s.end_date else None,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in surveys
    ]

@app.get("/api/admin/surveys/{survey_id}")
def get_survey_detail(
    survey_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get survey with all questions"""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Umfrage nicht gefunden")
    
    questions = []
    for q in survey.questions:
        questions.append({
            "id": q.id,
            "question_de": q.question_de,
            "question_en": q.question_en,
            "question_type": q.question_type.value if q.question_type else "text",
            "is_required": q.is_required,
            "options": q.options,
            "settings": q.settings,
            "condition": q.condition,
            "sort_order": q.sort_order
        })
    
    return {
        "id": survey.id,
        "title_de": survey.title_de,
        "title_en": survey.title_en,
        "description_de": survey.description_de,
        "description_en": survey.description_en,
        "is_active": survey.is_active,
        "show_banner": survey.show_banner,
        "banner_text_de": survey.banner_text_de,
        "banner_text_en": survey.banner_text_en,
        "start_date": survey.start_date.isoformat() if survey.start_date else None,
        "end_date": survey.end_date.isoformat() if survey.end_date else None,
        "raffle_enabled": survey.raffle_enabled,
        "raffle_description_de": survey.raffle_description_de,
        "raffle_description_en": survey.raffle_description_en,
        "questions": questions,
        "response_count": len(survey.responses)
    }

@app.post("/api/admin/surveys")
def create_survey(
    data: SurveyCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new survey"""
    survey = Survey(
        title_de=data.title_de,
        title_en=data.title_en,
        description_de=data.description_de,
        description_en=data.description_en,
        banner_text_de=data.banner_text_de,
        banner_text_en=data.banner_text_en,
        start_date=data.start_date,
        end_date=data.end_date,
        raffle_enabled=data.raffle_enabled,
        raffle_description_de=data.raffle_description_de,
        raffle_description_en=data.raffle_description_en,
        created_by=current_admin.id
    )
    fix_sequence(db, "surveys")
    fix_sequence(db, "survey_questions")
    db.add(survey)
    db.flush()

    for idx, q in enumerate(data.questions):
        question = SurveyQuestion(
            survey_id=survey.id,
            question_de=q.question_de,
            question_en=q.question_en,
            question_type=SurveyQuestionType(q.question_type) if q.question_type else SurveyQuestionType.TEXT,
            is_required=q.is_required,
            options=q.options,
            settings=q.settings,
            condition=q.condition,
            sort_order=q.sort_order or idx
        )
        db.add(question)

    db.commit()
    db.refresh(survey)

    log_activity(db, current_admin.id, "SURVEY_CREATE", f"Umfrage '{data.title_de}' erstellt")

    return {"id": survey.id, "message": "Umfrage erstellt"}

@app.put("/api/admin/surveys/{survey_id}")
def update_survey(
    survey_id: int,
    data: SurveyUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update survey settings"""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Umfrage nicht gefunden")
    
    # If activating, deactivate all others
    if data.is_active == True:
        db.query(Survey).filter(Survey.id != survey_id).update({"is_active": False})
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(survey, key, value)
    
    db.commit()
    
    log_activity(db, current_admin.id, "SURVEY_UPDATE", f"Umfrage '{survey.title_de}' aktualisiert")
    
    return {"message": "Umfrage aktualisiert"}

@app.delete("/api/admin/surveys/{survey_id}")
def delete_survey(
    survey_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a survey"""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Umfrage nicht gefunden")
    
    title = survey.title_de
    db.delete(survey)
    db.commit()
    
    log_activity(db, current_admin.id, "SURVEY_DELETE", f"Umfrage '{title}' gelöscht")
    
    return {"message": f"Umfrage '{title}' gelöscht"}

# Question management
@app.post("/api/admin/surveys/{survey_id}/questions")
def add_question(
    survey_id: int,
    data: SurveyQuestionCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add a question to a survey"""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Umfrage nicht gefunden")
    
    max_order = db.query(SurveyQuestion).filter(SurveyQuestion.survey_id == survey_id).count()
    
    question = SurveyQuestion(
        survey_id=survey_id,
        question_de=data.question_de,
        question_en=data.question_en,
        question_type=SurveyQuestionType(data.question_type) if data.question_type else SurveyQuestionType.TEXT,
        is_required=data.is_required,
        options=data.options,
        settings=data.settings,
        condition=data.condition,
        sort_order=data.sort_order or max_order
    )
    safe_add_and_commit(db, question, "survey_questions")
    db.refresh(question)

    return {
        "id": question.id,
        "question_de": question.question_de,
        "question_type": question.question_type.value
    }

@app.put("/api/admin/surveys/questions/{question_id}")
def update_question(
    question_id: int,
    data: SurveyQuestionUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a question"""
    question = db.query(SurveyQuestion).filter(SurveyQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Frage nicht gefunden")
    
    update_data = data.dict(exclude_unset=True)
    if 'question_type' in update_data and update_data['question_type']:
        update_data['question_type'] = SurveyQuestionType(update_data['question_type'])
    
    for key, value in update_data.items():
        setattr(question, key, value)
    
    db.commit()
    
    return {"message": "Frage aktualisiert"}

@app.delete("/api/admin/surveys/questions/{question_id}")
def delete_question(
    question_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a question"""
    question = db.query(SurveyQuestion).filter(SurveyQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Frage nicht gefunden")
    
    db.delete(question)
    db.commit()
    
    return {"message": "Frage gelöscht"}

@app.put("/api/admin/surveys/{survey_id}/questions/reorder")
def reorder_questions(
    survey_id: int,
    question_ids: List[int],
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reorder questions"""
    for idx, qid in enumerate(question_ids):
        db.query(SurveyQuestion).filter(
            SurveyQuestion.id == qid,
            SurveyQuestion.survey_id == survey_id
        ).update({"sort_order": idx})
    db.commit()
    return {"message": "Reihenfolge aktualisiert"}

# Survey Results
@app.get("/api/admin/surveys/{survey_id}/results")
def get_survey_results(
    survey_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get survey results with analytics"""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Umfrage nicht gefunden")
    
    responses = db.query(SurveyResponse).filter(SurveyResponse.survey_id == survey_id).all()
    
    # Build question stats
    question_stats = {}
    for question in survey.questions:
        answers = db.query(SurveyAnswer).filter(SurveyAnswer.question_id == question.id).all()
        
        if question.question_type in [SurveyQuestionType.SINGLE_CHOICE, SurveyQuestionType.DROPDOWN, SurveyQuestionType.MULTIPLE_CHOICE]:
            # Count choices
            choice_counts = {}
            for ans in answers:
                val = ans.answer_value
                try:
                    val = json.loads(val) if val.startswith('[') else val
                except:
                    pass
                if isinstance(val, list):
                    for v in val:
                        choice_counts[v] = choice_counts.get(v, 0) + 1
                else:
                    choice_counts[val] = choice_counts.get(val, 0) + 1
            question_stats[question.id] = {
                "type": "choice",
                "counts": choice_counts,
                "total": len(answers)
            }
        elif question.question_type == SurveyQuestionType.SCALE:
            # Calculate average
            values = [float(a.answer_value) for a in answers if a.answer_value and a.answer_value.replace('.','').isdigit()]
            question_stats[question.id] = {
                "type": "scale",
                "average": sum(values) / len(values) if values else 0,
                "count": len(values),
                "distribution": {str(i): values.count(i) for i in range(1, 6)}
            }
        else:
            # Text answers
            question_stats[question.id] = {
                "type": "text",
                "answers": [a.answer_value for a in answers if a.answer_value],
                "count": len(answers)
            }
    
    # Raffle participants
    raffle_participants = [r.participant_email for r in responses if r.raffle_participated and r.participant_email]
    
    return {
        "survey_id": survey_id,
        "title": survey.title_de,
        "total_responses": len(responses),
        "raffle_participants": len(raffle_participants),
        "raffle_emails": raffle_participants,
        "question_stats": question_stats,
        "questions": [
            {
                "id": q.id,
                "question_de": q.question_de,
                "question_type": q.question_type.value,
                "options": q.options
            }
            for q in survey.questions
        ]
    }

# ─── DEVELOPER CHANGELOG ENDPOINTS ────────────────────────────────────────────
class ChangelogCreate(BaseModel):
    version: str
    title: str
    description: Optional[str] = None
    changes: Optional[List[str]] = None
    changelog_type: Optional[str] = "website"
    release_date: datetime

class ChangelogUpdate(BaseModel):
    version: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    changes: Optional[List[str]] = None
    changelog_type: Optional[str] = None
    release_date: Optional[datetime] = None

@app.get("/api/changelog")
def get_changelog(changelog_type: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all changelog entries (public)"""
    query = db.query(DeveloperChangelog)
    if changelog_type:
        query = query.filter(DeveloperChangelog.changelog_type == changelog_type)
    entries = query.order_by(DeveloperChangelog.release_date.desc()).all()
    return [
        {
            "id": e.id,
            "version": e.version,
            "title": e.title,
            "description": e.description,
            "changes": e.changes or [],
            "changelog_type": e.changelog_type or "website",
            "release_date": e.release_date.isoformat() if e.release_date else None,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in entries
    ]

@app.get("/api/changelog/latest")
def get_latest_versions(db: Session = Depends(get_db)):
    """Get latest version for website and app"""
    website_latest = db.query(DeveloperChangelog).filter(
        DeveloperChangelog.changelog_type == "website"
    ).order_by(DeveloperChangelog.release_date.desc()).first()

    app_latest = db.query(DeveloperChangelog).filter(
        DeveloperChangelog.changelog_type == "app"
    ).order_by(DeveloperChangelog.release_date.desc()).first()

    return {
        "website": {
            "version": website_latest.version if website_latest else "1.0.0",
            "title": website_latest.title if website_latest else None,
            "release_date": website_latest.release_date.isoformat() if website_latest and website_latest.release_date else None
        },
        "app": {
            "version": app_latest.version if app_latest else "1.0.0",
            "title": app_latest.title if app_latest else None,
            "release_date": app_latest.release_date.isoformat() if app_latest and app_latest.release_date else None
        }
    }

@app.get("/api/admin/changelog")
def get_admin_changelog(
    changelog_type: Optional[str] = None,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all changelog entries for admin"""
    query = db.query(DeveloperChangelog)
    if changelog_type:
        query = query.filter(DeveloperChangelog.changelog_type == changelog_type)
    entries = query.order_by(DeveloperChangelog.release_date.desc()).all()
    return [
        {
            "id": e.id,
            "version": e.version,
            "title": e.title,
            "description": e.description,
            "changes": e.changes or [],
            "changelog_type": e.changelog_type or "website",
            "release_date": e.release_date.isoformat() if e.release_date else None,
            "created_by": e.creator.display_name if e.creator else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None
        }
        for e in entries
    ]

@app.post("/api/admin/changelog")
def create_changelog_entry(
    data: ChangelogCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new changelog entry (Master Admin only)"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master Admin darf Changelog-Eintraege erstellen")

    changelog_type = data.changelog_type or "website"
    type_label = "Website" if changelog_type == "website" else "App"

    entry = DeveloperChangelog(
        version=data.version,
        title=data.title,
        description=data.description,
        changes=data.changes,
        changelog_type=changelog_type,
        release_date=data.release_date,
        created_by=current_admin.id
    )
    safe_add_and_commit(db, entry, "developer_changelog")
    db.refresh(entry)

    log_activity(db, current_admin.id, "CHANGELOG_CREATE", f"{type_label} Version {data.version} hinzugefuegt")

    create_notification(
        db, "changelog",
        f"Neue {type_label}-Version: {data.version}",
        f"{data.title}",
        {
            "version": data.version,
            "title": data.title,
            "description": data.description,
            "changes": data.changes,
            "changelog_type": changelog_type,
            "release_date": data.release_date.isoformat() if data.release_date else None
        }
    )

    return {"id": entry.id, "message": "Changelog-Eintrag erstellt"}

@app.put("/api/admin/changelog/{entry_id}")
def update_changelog_entry(
    entry_id: int,
    data: ChangelogUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a changelog entry (Master Admin only)"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master Admin darf Changelog-Eintraege bearbeiten")

    entry = db.query(DeveloperChangelog).filter(DeveloperChangelog.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)

    db.commit()

    log_activity(db, current_admin.id, "CHANGELOG_UPDATE", f"Version {entry.version} aktualisiert")

    return {"message": "Changelog-Eintrag aktualisiert"}

@app.delete("/api/admin/changelog/{entry_id}")
def delete_changelog_entry(
    entry_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a changelog entry (Master Admin only)"""
    if not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur Master Admin darf Changelog-Einträge löschen")

    entry = db.query(DeveloperChangelog).filter(DeveloperChangelog.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")

    version = entry.version
    db.delete(entry)
    db.commit()

    log_activity(db, current_admin.id, "CHANGELOG_DELETE", f"Version {version} gelöscht")

    return {"message": f"Version {version} gelöscht"}

# ─── NOTIFICATION SYSTEM ─────────────────────────────────────────────────────
def create_notification(db: Session, section: str, title: str, message: str, details: dict = None):
    """Erstellt eine neue Benachrichtigung"""
    notif = AdminNotification(
        section=section,
        title=title,
        message=message,
        details=details
    )
    safe_add_and_commit(db, notif, "admin_notifications")
    return notif

@app.get("/api/notifications")
def get_notifications(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Holt alle Benachrichtigungen fur den aktuellen Admin (basierend auf Berechtigungen)"""
    notifications = db.query(AdminNotification).order_by(AdminNotification.created_at.desc()).limit(100).all()

    read_ids = set()
    read_statuses = db.query(NotificationReadStatus).filter(
        NotificationReadStatus.admin_id == current_admin.id
    ).all()
    for rs in read_statuses:
        read_ids.add(rs.notification_id)

    result = []
    for notif in notifications:
        if current_admin.is_master or current_admin.has_permission(notif.section, "view"):
            result.append({
                "id": notif.id,
                "section": notif.section,
                "title": notif.title,
                "message": notif.message,
                "details": notif.details,
                "created_at": notif.created_at.isoformat() if notif.created_at else None,
                "is_read": notif.id in read_ids
            })

    return result

@app.get("/api/notifications/unread-counts")
def get_unread_counts(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Holt die Anzahl ungelesener Benachrichtigungen pro Sektion"""
    from sqlalchemy import func

    read_ids = set()
    read_statuses = db.query(NotificationReadStatus).filter(
        NotificationReadStatus.admin_id == current_admin.id
    ).all()
    for rs in read_statuses:
        read_ids.add(rs.notification_id)

    notifications = db.query(AdminNotification).all()

    counts = {}
    total = 0
    for notif in notifications:
        if current_admin.is_master or current_admin.has_permission(notif.section, "view"):
            if notif.id not in read_ids:
                counts[notif.section] = counts.get(notif.section, 0) + 1
                total += 1

    counts["total"] = total
    return counts

@app.post("/api/notifications/{notification_id}/mark-read")
def mark_notification_read(
    notification_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Markiert eine Benachrichtigung als gelesen"""
    notif = db.query(AdminNotification).filter(AdminNotification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Benachrichtigung nicht gefunden")

    if not current_admin.is_master and not current_admin.has_permission(notif.section, "view"):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    existing = db.query(NotificationReadStatus).filter(
        NotificationReadStatus.notification_id == notification_id,
        NotificationReadStatus.admin_id == current_admin.id
    ).first()

    if not existing:
        read_status = NotificationReadStatus(
            notification_id=notification_id,
            admin_id=current_admin.id
        )
        safe_add_and_commit(db, read_status, "notification_read_status")

    return {"success": True, "message": "Als gelesen markiert"}

@app.post("/api/notifications/mark-all-read")
def mark_all_notifications_read(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Markiert alle Benachrichtigungen als gelesen"""
    notifications = db.query(AdminNotification).all()

    for notif in notifications:
        if current_admin.is_master or current_admin.has_permission(notif.section, "view"):
            existing = db.query(NotificationReadStatus).filter(
                NotificationReadStatus.notification_id == notif.id,
                NotificationReadStatus.admin_id == current_admin.id
            ).first()

            if not existing:
                read_status = NotificationReadStatus(
                    notification_id=notif.id,
                    admin_id=current_admin.id
                )
                db.add(read_status)

    db.commit()
    return {"success": True, "message": "Alle als gelesen markiert"}

@app.post("/api/notifications/mark-section-read/{section}")
def mark_section_notifications_read(
    section: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Markiert alle Benachrichtigungen einer Sektion als gelesen"""
    if not current_admin.is_master and not current_admin.has_permission(section, "view"):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    notifications = db.query(AdminNotification).filter(AdminNotification.section == section).all()

    for notif in notifications:
        existing = db.query(NotificationReadStatus).filter(
            NotificationReadStatus.notification_id == notif.id,
            NotificationReadStatus.admin_id == current_admin.id
        ).first()

        if not existing:
            read_status = NotificationReadStatus(
                notification_id=notif.id,
                admin_id=current_admin.id
            )
            db.add(read_status)

    db.commit()
    return {"success": True, "message": f"Alle {section} Benachrichtigungen als gelesen markiert"}

# ─── KANBAN API ENDPOINTS ───────────────────────────────────────────────────
def can_access_board(board: KanbanBoard, admin: Admin, require_edit: bool = False) -> bool:
    if admin.is_master:
        return True
    if board.owner_id == admin.id:
        return True
    if not board.is_private:
        if not require_edit:
            return True
    return False

def can_edit_board(board: KanbanBoard, admin: Admin, db: Session) -> bool:
    if admin.is_master:
        return True
    if board.owner_id == admin.id:
        return True
    member = db.query(KanbanBoardMember).filter(
        KanbanBoardMember.board_id == board.id,
        KanbanBoardMember.admin_id == admin.id
    ).first()
    if member and member.can_edit:
        return True
    return False

@app.get("/api/kanban/boards")
def get_kanban_boards(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if current_admin.is_master:
        boards = db.query(KanbanBoard).filter(KanbanBoard.is_archived == False).all()
    else:
        member_board_ids = db.query(KanbanBoardMember.board_id).filter(
            KanbanBoardMember.admin_id == current_admin.id
        ).subquery()
        boards = db.query(KanbanBoard).filter(
            KanbanBoard.is_archived == False,
            (
                (KanbanBoard.owner_id == current_admin.id) |
                (KanbanBoard.is_private == False) |
                (KanbanBoard.id.in_(member_board_ids))
            )
        ).all()

    result = []
    for b in boards:
        task_count = db.query(KanbanTask).join(KanbanColumn).filter(
            KanbanColumn.board_id == b.id
        ).count()
        completed_count = db.query(KanbanTask).join(KanbanColumn).filter(
            KanbanColumn.board_id == b.id,
            KanbanTask.is_completed == True
        ).count()
        member_count = db.query(KanbanBoardMember).filter(
            KanbanBoardMember.board_id == b.id
        ).count()

        result.append({
            "id": b.id,
            "name": b.name,
            "description": b.description,
            "color": b.color,
            "is_private": b.is_private,
            "is_archived": b.is_archived,
            "owner_id": b.owner_id,
            "owner_name": b.owner.display_name if b.owner else "Unbekannt",
            "is_owner": b.owner_id == current_admin.id,
            "task_count": task_count,
            "completed_count": completed_count,
            "member_count": member_count + 1,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "updated_at": b.updated_at.isoformat() if b.updated_at else None,
        })
    return result

@app.post("/api/kanban/boards")
def create_kanban_board(
    data: KanbanBoardCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if not current_admin.is_master and not current_admin.has_permission("kanban", "edit"):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    board = KanbanBoard(
        name=data.name,
        description=data.description,
        color=data.color,
        is_private=data.is_private,
        owner_id=current_admin.id
    )
    safe_add_and_commit(db, board, "kanban_boards")

    default_columns = [
        {"name": "Backlog", "color": "slate"},
        {"name": "To Do", "color": "blue"},
        {"name": "In Progress", "color": "amber"},
        {"name": "Review", "color": "purple"},
        {"name": "Done", "color": "green"},
    ]
    for i, col in enumerate(default_columns):
        column = KanbanColumn(
            board_id=board.id,
            name=col["name"],
            color=col["color"],
            sort_order=i
        )
        safe_add_and_commit(db, column, "kanban_columns")

    log_activity(db, current_admin.id, "CREATE_BOARD", f"Kanban Board '{data.name}' erstellt", "kanban_board", board.id)
    db.refresh(board)

    return {
        "id": board.id,
        "name": board.name,
        "description": board.description,
        "color": board.color,
        "is_private": board.is_private,
        "owner_id": board.owner_id,
        "created_at": board.created_at.isoformat() if board.created_at else None,
    }

@app.get("/api/kanban/boards/{board_id}")
def get_kanban_board(
    board_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if not can_access_board(board, current_admin):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    columns_data = []
    for col in sorted(board.columns, key=lambda c: c.sort_order):
        tasks_data = []
        for task in sorted(col.tasks, key=lambda t: t.sort_order):
            checklist_total = len(task.checklist_items)
            checklist_done = sum(1 for c in task.checklist_items if c.is_completed)
            tasks_data.append({
                "id": task.id,
                "column_id": task.column_id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority.value if task.priority else "medium",
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "sort_order": task.sort_order,
                "labels": task.get_labels(),
                "assignee_id": task.assignee_id,
                "assignee_name": task.assignee.display_name if task.assignee else None,
                "created_by": task.created_by,
                "creator_name": task.creator.display_name if task.creator else None,
                "is_completed": task.is_completed,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "comment_count": len(task.comments),
                "checklist_total": checklist_total,
                "checklist_done": checklist_done,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None,
            })
        columns_data.append({
            "id": col.id,
            "name": col.name,
            "color": col.color,
            "sort_order": col.sort_order,
            "wip_limit": col.wip_limit,
            "tasks": tasks_data,
        })

    labels_data = [{
        "id": l.id,
        "name": l.name,
        "color": l.color,
    } for l in board.labels]

    members_data = [{
        "id": m.id,
        "admin_id": m.admin_id,
        "admin_name": m.admin.display_name if m.admin else "Unbekannt",
        "can_edit": m.can_edit,
    } for m in board.members]

    return {
        "id": board.id,
        "name": board.name,
        "description": board.description,
        "color": board.color,
        "is_private": board.is_private,
        "is_archived": board.is_archived,
        "owner_id": board.owner_id,
        "owner_name": board.owner.display_name if board.owner else "Unbekannt",
        "is_owner": board.owner_id == current_admin.id,
        "can_edit": can_edit_board(board, current_admin, db),
        "columns": columns_data,
        "labels": labels_data,
        "members": members_data,
        "created_at": board.created_at.isoformat() if board.created_at else None,
        "updated_at": board.updated_at.isoformat() if board.updated_at else None,
    }

@app.put("/api/kanban/boards/{board_id}")
def update_kanban_board(
    board_id: int,
    data: KanbanBoardUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if not can_edit_board(board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    if data.name is not None:
        board.name = data.name
    if data.description is not None:
        board.description = data.description
    if data.color is not None:
        board.color = data.color
    if data.is_private is not None:
        board.is_private = data.is_private
    if data.is_archived is not None:
        board.is_archived = data.is_archived

    db.commit()
    log_activity(db, current_admin.id, "UPDATE_BOARD", f"Kanban Board '{board.name}' aktualisiert", "kanban_board", board.id)

    return {"success": True}

@app.delete("/api/kanban/boards/{board_id}")
def delete_kanban_board(
    board_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if board.owner_id != current_admin.id and not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur der Besitzer kann das Board loeschen")

    board_name = board.name
    db.delete(board)
    db.commit()
    log_activity(db, current_admin.id, "DELETE_BOARD", f"Kanban Board '{board_name}' geloescht", "kanban_board", board_id)

    return {"success": True}

@app.post("/api/kanban/boards/{board_id}/columns")
def create_kanban_column(
    board_id: int,
    data: KanbanColumnCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if not can_edit_board(board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    max_order = db.query(KanbanColumn).filter(KanbanColumn.board_id == board_id).count()
    column = KanbanColumn(
        board_id=board_id,
        name=data.name,
        color=data.color,
        wip_limit=data.wip_limit,
        sort_order=max_order
    )
    safe_add_and_commit(db, column, "kanban_columns")

    return {
        "id": column.id,
        "name": column.name,
        "color": column.color,
        "sort_order": column.sort_order,
        "wip_limit": column.wip_limit,
        "tasks": [],
    }

@app.put("/api/kanban/columns/{column_id}")
def update_kanban_column(
    column_id: int,
    data: KanbanColumnUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    column = db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Spalte nicht gefunden")

    if not can_edit_board(column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    if data.name is not None:
        column.name = data.name
    if data.color is not None:
        column.color = data.color
    if data.wip_limit is not None:
        column.wip_limit = data.wip_limit
    if data.sort_order is not None:
        column.sort_order = data.sort_order

    db.commit()
    return {"success": True}

@app.delete("/api/kanban/columns/{column_id}")
def delete_kanban_column(
    column_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    column = db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Spalte nicht gefunden")

    if not can_edit_board(column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    db.delete(column)
    db.commit()
    return {"success": True}

@app.put("/api/kanban/boards/{board_id}/columns/reorder")
def reorder_kanban_columns(
    board_id: int,
    data: KanbanColumnsReorder,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if not can_edit_board(board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    for i, col_id in enumerate(data.column_ids):
        col = db.query(KanbanColumn).filter(
            KanbanColumn.id == col_id,
            KanbanColumn.board_id == board_id
        ).first()
        if col:
            col.sort_order = i

    db.commit()
    return {"success": True}

@app.post("/api/kanban/columns/{column_id}/tasks")
def create_kanban_task(
    column_id: int,
    data: KanbanTaskCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    column = db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Spalte nicht gefunden")

    if not can_edit_board(column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    max_order = db.query(KanbanTask).filter(KanbanTask.column_id == column_id).count()
    try:
        priority_enum = KanbanTaskPriority(data.priority)
    except:
        priority_enum = KanbanTaskPriority.MEDIUM

    task = KanbanTask(
        column_id=column_id,
        title=data.title,
        description=data.description,
        priority=priority_enum,
        due_date=data.due_date,
        assignee_id=data.assignee_id,
        created_by=current_admin.id,
        sort_order=max_order
    )
    task.set_labels(data.labels)
    safe_add_and_commit(db, task, "kanban_tasks")

    board_name = column.board.name if column.board else "Board"
    create_notification(
        db, "kanban",
        f"Neuer Task: {task.title}",
        f"{current_admin.display_name} hat einen Task in '{board_name}' erstellt.",
        {
            "task_id": task.id,
            "board_name": board_name,
            "column_name": column.name,
            "creator": current_admin.display_name,
            "priority": task.priority.value
        }
    )

    if data.assignee_id and data.assignee_id != current_admin.id:
        assignee = db.query(Admin).filter(Admin.id == data.assignee_id).first()
        if assignee:
            create_notification(
                db, "kanban",
                f"Task zugewiesen: {task.title}",
                f"{current_admin.display_name} hat dir einen Task zugewiesen.",
                {
                    "task_id": task.id,
                    "board_name": board_name,
                    "assigned_by": current_admin.display_name,
                    "assignee": assignee.display_name
                }
            )

    return {
        "id": task.id,
        "column_id": task.column_id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority.value,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "sort_order": task.sort_order,
        "labels": task.get_labels(),
        "assignee_id": task.assignee_id,
        "assignee_name": task.assignee.display_name if task.assignee else None,
        "created_by": task.created_by,
        "creator_name": current_admin.display_name,
        "is_completed": task.is_completed,
        "completed_at": None,
        "comment_count": 0,
        "checklist_total": 0,
        "checklist_done": 0,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }

@app.get("/api/kanban/tasks/{task_id}")
def get_kanban_task(
    task_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    task = db.query(KanbanTask).filter(KanbanTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task nicht gefunden")

    if not can_access_board(task.column.board, current_admin):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    comments = [{
        "id": c.id,
        "content": c.content,
        "admin_id": c.admin_id,
        "admin_name": c.admin.display_name if c.admin else "Unbekannt",
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    } for c in task.comments]

    checklist = [{
        "id": c.id,
        "text": c.text,
        "is_completed": c.is_completed,
        "sort_order": c.sort_order,
    } for c in sorted(task.checklist_items, key=lambda x: x.sort_order)]

    return {
        "id": task.id,
        "column_id": task.column_id,
        "board_id": task.column.board_id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority.value if task.priority else "medium",
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "sort_order": task.sort_order,
        "labels": task.get_labels(),
        "assignee_id": task.assignee_id,
        "assignee_name": task.assignee.display_name if task.assignee else None,
        "created_by": task.created_by,
        "creator_name": task.creator.display_name if task.creator else None,
        "is_completed": task.is_completed,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "comments": comments,
        "checklist": checklist,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }

@app.put("/api/kanban/tasks/{task_id}")
def update_kanban_task(
    task_id: int,
    data: KanbanTaskUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    task = db.query(KanbanTask).filter(KanbanTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task nicht gefunden")

    if not can_edit_board(task.column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    old_assignee_id = task.assignee_id
    task_title = task.title

    if data.title is not None:
        task.title = data.title
        task_title = data.title
    if data.description is not None:
        task.description = data.description
    if data.priority is not None:
        try:
            task.priority = KanbanTaskPriority(data.priority)
        except:
            pass
    if data.due_date is not None:
        task.due_date = data.due_date
    if data.labels is not None:
        task.set_labels(data.labels)
    if data.assignee_id is not None:
        task.assignee_id = data.assignee_id if data.assignee_id > 0 else None
    if data.column_id is not None:
        task.column_id = data.column_id
    if data.sort_order is not None:
        task.sort_order = data.sort_order
    if data.is_completed is not None:
        task.is_completed = data.is_completed
        if data.is_completed:
            task.completed_at = datetime.now(timezone.utc)
        else:
            task.completed_at = None

    db.commit()

    if data.assignee_id is not None and data.assignee_id != old_assignee_id and data.assignee_id != current_admin.id and data.assignee_id > 0:
        assignee = db.query(Admin).filter(Admin.id == data.assignee_id).first()
        if assignee:
            board_name = task.column.board.name if task.column and task.column.board else "Board"
            create_notification(
                db, "kanban",
                f"Task zugewiesen: {task_title}",
                f"{current_admin.display_name} hat dir einen Task zugewiesen.",
                {
                    "task_id": task.id,
                    "board_name": board_name,
                    "assigned_by": current_admin.display_name,
                    "assignee": assignee.display_name
                }
            )

    return {"success": True}

@app.put("/api/kanban/tasks/{task_id}/move")
def move_kanban_task(
    task_id: int,
    data: KanbanTaskMove,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    task = db.query(KanbanTask).filter(KanbanTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task nicht gefunden")

    if not can_edit_board(task.column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    new_column = db.query(KanbanColumn).filter(KanbanColumn.id == data.column_id).first()
    if not new_column:
        raise HTTPException(status_code=404, detail="Spalte nicht gefunden")

    if new_column.board_id != task.column.board_id:
        raise HTTPException(status_code=400, detail="Spalte gehoert nicht zum selben Board")

    old_column_id = task.column_id
    task.column_id = data.column_id
    task.sort_order = data.sort_order

    tasks_to_update = db.query(KanbanTask).filter(
        KanbanTask.column_id == data.column_id,
        KanbanTask.id != task_id,
        KanbanTask.sort_order >= data.sort_order
    ).all()
    for t in tasks_to_update:
        t.sort_order += 1

    db.commit()
    return {"success": True}

@app.delete("/api/kanban/tasks/{task_id}")
def delete_kanban_task(
    task_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    task = db.query(KanbanTask).filter(KanbanTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task nicht gefunden")

    if not can_edit_board(task.column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    db.delete(task)
    db.commit()
    return {"success": True}

@app.post("/api/kanban/tasks/{task_id}/comments")
def add_kanban_comment(
    task_id: int,
    data: KanbanCommentCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    task = db.query(KanbanTask).filter(KanbanTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task nicht gefunden")

    if not can_access_board(task.column.board, current_admin):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    comment = KanbanComment(
        task_id=task_id,
        admin_id=current_admin.id,
        content=data.content
    )
    safe_add_and_commit(db, comment, "kanban_comments")

    board_name = task.column.board.name if task.column and task.column.board else "Board"
    create_notification(
        db, "kanban",
        f"Neuer Kommentar: {task.title}",
        f"{current_admin.display_name} hat einen Kommentar hinzugefuegt.",
        {
            "task_id": task.id,
            "task_title": task.title,
            "board_name": board_name,
            "commenter": current_admin.display_name,
            "comment_preview": data.content[:100] if len(data.content) > 100 else data.content
        }
    )

    return {
        "id": comment.id,
        "content": comment.content,
        "admin_id": comment.admin_id,
        "admin_name": current_admin.display_name,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
    }

@app.delete("/api/kanban/comments/{comment_id}")
def delete_kanban_comment(
    comment_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    comment = db.query(KanbanComment).filter(KanbanComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Kommentar nicht gefunden")

    if comment.admin_id != current_admin.id and not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur eigene Kommentare loeschen")

    db.delete(comment)
    db.commit()
    return {"success": True}

@app.post("/api/kanban/tasks/{task_id}/checklist")
def add_kanban_checklist_item(
    task_id: int,
    data: KanbanChecklistCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    task = db.query(KanbanTask).filter(KanbanTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task nicht gefunden")

    if not can_edit_board(task.column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    max_order = len(task.checklist_items)
    item = KanbanChecklist(
        task_id=task_id,
        text=data.text,
        sort_order=max_order
    )
    safe_add_and_commit(db, item, "kanban_checklists")

    return {
        "id": item.id,
        "text": item.text,
        "is_completed": item.is_completed,
        "sort_order": item.sort_order,
    }

@app.put("/api/kanban/checklist/{item_id}")
def update_kanban_checklist_item(
    item_id: int,
    data: KanbanChecklistUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    item = db.query(KanbanChecklist).filter(KanbanChecklist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist-Item nicht gefunden")

    if not can_edit_board(item.task.column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    if data.text is not None:
        item.text = data.text
    if data.is_completed is not None:
        item.is_completed = data.is_completed
    if data.sort_order is not None:
        item.sort_order = data.sort_order

    db.commit()
    return {"success": True}

@app.delete("/api/kanban/checklist/{item_id}")
def delete_kanban_checklist_item(
    item_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    item = db.query(KanbanChecklist).filter(KanbanChecklist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist-Item nicht gefunden")

    if not can_edit_board(item.task.column.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    db.delete(item)
    db.commit()
    return {"success": True}

@app.post("/api/kanban/boards/{board_id}/labels")
def create_kanban_label(
    board_id: int,
    data: KanbanLabelCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if not can_edit_board(board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    label = KanbanLabel(
        board_id=board_id,
        name=data.name,
        color=data.color
    )
    safe_add_and_commit(db, label, "kanban_labels")

    return {
        "id": label.id,
        "name": label.name,
        "color": label.color,
    }

@app.put("/api/kanban/labels/{label_id}")
def update_kanban_label(
    label_id: int,
    data: KanbanLabelUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    label = db.query(KanbanLabel).filter(KanbanLabel.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label nicht gefunden")

    if not can_edit_board(label.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    if data.name is not None:
        label.name = data.name
    if data.color is not None:
        label.color = data.color

    db.commit()
    return {"success": True}

@app.delete("/api/kanban/labels/{label_id}")
def delete_kanban_label(
    label_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    label = db.query(KanbanLabel).filter(KanbanLabel.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label nicht gefunden")

    if not can_edit_board(label.board, current_admin, db):
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    db.delete(label)
    db.commit()
    return {"success": True}

@app.post("/api/kanban/boards/{board_id}/members")
def add_kanban_board_member(
    board_id: int,
    data: KanbanBoardMemberAdd,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if board.owner_id != current_admin.id and not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur der Besitzer kann Mitglieder hinzufuegen")

    existing = db.query(KanbanBoardMember).filter(
        KanbanBoardMember.board_id == board_id,
        KanbanBoardMember.admin_id == data.admin_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin ist bereits Mitglied")

    admin = db.query(Admin).filter(Admin.id == data.admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin nicht gefunden")

    member = KanbanBoardMember(
        board_id=board_id,
        admin_id=data.admin_id,
        can_edit=data.can_edit
    )
    safe_add_and_commit(db, member, "kanban_board_members")

    return {
        "id": member.id,
        "admin_id": member.admin_id,
        "admin_name": admin.display_name,
        "can_edit": member.can_edit,
    }

@app.delete("/api/kanban/boards/{board_id}/members/{admin_id}")
def remove_kanban_board_member(
    board_id: int,
    admin_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    board = db.query(KanbanBoard).filter(KanbanBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board nicht gefunden")

    if board.owner_id != current_admin.id and not current_admin.is_master:
        raise HTTPException(status_code=403, detail="Nur der Besitzer kann Mitglieder entfernen")

    member = db.query(KanbanBoardMember).filter(
        KanbanBoardMember.board_id == board_id,
        KanbanBoardMember.admin_id == admin_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")

    db.delete(member)
    db.commit()
    return {"success": True}

@app.get("/api/kanban/available-admins")
def get_available_admins_for_kanban(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admins = db.query(Admin).filter(Admin.is_active == True).all()
    return [{
        "id": a.id,
        "username": a.username,
        "display_name": a.display_name,
    } for a in admins]

# ─── APP ASSETS ENDPOINTS (Static Images in Database) ────────────────────────

@app.get("/api/assets")
def get_all_assets(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all app assets, optionally filtered by category"""
    from sqlalchemy import text

    if category:
        sql = text("SELECT asset_key, filename, mime_type, category, alt_text FROM app_assets WHERE category = :category ORDER BY asset_key")
        result = db.execute(sql, {"category": category}).fetchall()
    else:
        sql = text("SELECT asset_key, filename, mime_type, category, alt_text FROM app_assets ORDER BY asset_key")
        result = db.execute(sql).fetchall()

    return [{
        "asset_key": r[0],
        "filename": r[1],
        "mime_type": r[2],
        "category": r[3],
        "alt_text": r[4]
    } for r in result]

@app.get("/api/assets/{asset_key:path}")
def get_asset(asset_key: str, db: Session = Depends(get_db)):
    """Get a single asset by key - returns base64 data URL"""
    from sqlalchemy import text

    sql = text("SELECT data, mime_type, alt_text FROM app_assets WHERE asset_key = :key")
    result = db.execute(sql, {"key": asset_key}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Asset nicht gefunden")

    return {
        "data_url": result[0],
        "mime_type": result[1],
        "alt_text": result[2]
    }

@app.get("/api/assets-batch")
def get_assets_batch(keys: str, db: Session = Depends(get_db)):
    """Get multiple assets by keys (comma-separated) - returns map of key to data URL"""
    from sqlalchemy import text

    key_list = [k.strip() for k in keys.split(",") if k.strip()]
    if not key_list:
        return {}

    placeholders = ", ".join([f":k{i}" for i in range(len(key_list))])
    params = {f"k{i}": k for i, k in enumerate(key_list)}

    sql = text(f"SELECT asset_key, data, mime_type, alt_text FROM app_assets WHERE asset_key IN ({placeholders})")
    result = db.execute(sql, params).fetchall()

    return {
        r[0]: {
            "data_url": r[1],
            "mime_type": r[2],
            "alt_text": r[3]
        } for r in result
    }

@app.post("/api/admin/assets")
async def upload_asset(
    asset_key: str = FastAPIForm(...),
    category: str = FastAPIForm(...),
    alt_text: Optional[str] = FastAPIForm(None),
    file: UploadFile = File(...),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Upload a new asset or update existing one"""
    import base64
    from sqlalchemy import text

    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Nur PNG, JPG, WebP, GIF und SVG Dateien sind erlaubt")

    file_data = await file.read()

    max_size = 5 * 1024 * 1024
    if len(file_data) > max_size:
        raise HTTPException(status_code=400, detail="Datei darf maximal 5 MB gross sein")

    if not validate_file_content(file_data, file.content_type, file.filename):
        raise HTTPException(status_code=400, detail="Die Datei ist ungueltig oder hat ein nicht erlaubtes Format.")

    if file.content_type == "image/svg+xml":
        file_data = sanitize_svg(file_data)

    b64_data = base64.b64encode(file_data).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{b64_data}"

    check_sql = text("SELECT id FROM app_assets WHERE asset_key = :key")
    existing = db.execute(check_sql, {"key": asset_key}).fetchone()

    if existing:
        update_sql = text("""
            UPDATE app_assets
            SET data = :data, mime_type = :mime, filename = :filename,
                category = :category, alt_text = :alt_text, updated_at = NOW()
            WHERE asset_key = :key
        """)
        db.execute(update_sql, {
            "key": asset_key,
            "data": data_url,
            "mime": file.content_type,
            "filename": file.filename,
            "category": category,
            "alt_text": alt_text
        })
    else:
        insert_sql = text("""
            INSERT INTO app_assets (asset_key, filename, mime_type, data, category, alt_text)
            VALUES (:key, :filename, :mime, :data, :category, :alt_text)
        """)
        db.execute(insert_sql, {
            "key": asset_key,
            "filename": file.filename,
            "mime": file.content_type,
            "data": data_url,
            "category": category,
            "alt_text": alt_text
        })

    db.commit()

    log_activity(db, current_admin.id, "ASSET_UPLOAD", f"Asset '{asset_key}' hochgeladen")

    return {"success": True, "asset_key": asset_key}

@app.delete("/api/admin/assets/{asset_key:path}")
def delete_asset(
    asset_key: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete an asset"""
    from sqlalchemy import text

    check_sql = text("SELECT id FROM app_assets WHERE asset_key = :key")
    existing = db.execute(check_sql, {"key": asset_key}).fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Asset nicht gefunden")

    delete_sql = text("DELETE FROM app_assets WHERE asset_key = :key")
    db.execute(delete_sql, {"key": asset_key})
    db.commit()

    log_activity(db, current_admin.id, "ASSET_DELETE", f"Asset '{asset_key}' geloescht")

    return {"success": True}

@app.post("/api/admin/assets/bulk-upload")
async def bulk_upload_assets(
    assets_data: str = FastAPIForm(...),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Bulk upload assets from JSON data containing base64 encoded images"""
    from sqlalchemy import text

    try:
        assets = json.loads(assets_data)
    except:
        raise HTTPException(status_code=400, detail="Ungueltiges JSON Format")

    uploaded = 0
    errors = []

    for asset in assets:
        try:
            asset_key = asset.get("asset_key")
            data_url = asset.get("data_url")
            mime_type = asset.get("mime_type", "image/png")
            filename = asset.get("filename", asset_key)
            category = asset.get("category", "misc")
            alt_text = asset.get("alt_text")

            if not asset_key or not data_url:
                errors.append(f"Asset ohne key oder data: {asset_key}")
                continue

            check_sql = text("SELECT id FROM app_assets WHERE asset_key = :key")
            existing = db.execute(check_sql, {"key": asset_key}).fetchone()

            if existing:
                update_sql = text("""
                    UPDATE app_assets
                    SET data = :data, mime_type = :mime, filename = :filename,
                        category = :category, alt_text = :alt_text, updated_at = NOW()
                    WHERE asset_key = :key
                """)
                db.execute(update_sql, {
                    "key": asset_key,
                    "data": data_url,
                    "mime": mime_type,
                    "filename": filename,
                    "category": category,
                    "alt_text": alt_text
                })
            else:
                insert_sql = text("""
                    INSERT INTO app_assets (asset_key, filename, mime_type, data, category, alt_text)
                    VALUES (:key, :filename, :mime, :data, :category, :alt_text)
                """)
                db.execute(insert_sql, {
                    "key": asset_key,
                    "filename": filename,
                    "mime": mime_type,
                    "data": data_url,
                    "category": category,
                    "alt_text": alt_text
                })

            uploaded += 1
        except Exception as e:
            errors.append(f"Fehler bei {asset.get('asset_key', 'unknown')}: {str(e)}")

    db.commit()

    log_activity(db, current_admin.id, "ASSETS_BULK_UPLOAD", f"{uploaded} Assets hochgeladen")

    return {"success": True, "uploaded": uploaded, "errors": errors}
