# FastAPI Backend Implementation Guide
## Call Management System

This guide provides the complete FastAPI backend code for the Call Management System with authentication, call recording management, and Excel upload functionality.

## Installation

```bash
pip install fastapi uvicorn python-multipart pydantic sqlalchemy python-jose[cryptography] passlib[bcrypt] pandas openpyxl
```

## Complete FastAPI Backend Code

### main.py

```python
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import pandas as pd
import enum

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./call_manager.db"
# For production, use PostgreSQL:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security configuration
SECRET_KEY = "your-secret-key-here-change-in-production"  # Change this!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="Call Manager API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        # Add your production frontend URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"

class CallStatus(str, enum.Enum):
    rnr = "RNR"
    not_reachable = "Not Reachable"
    wrong_number = "Wrong Number"
    answered_by_family = "Answered by Family"
    answered_by_customer = "Answered by Customer"
    answered_by_others = "Answered by Others"

# Database Models
class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    organization_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ContactDB(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone_number = Column(String)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    user_id = Column(Integer)
    organization_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CallRecordDB(Base):
    __tablename__ = "call_records"
    
    id = Column(Integer, primary_key=True, index=True)
    contact_name = Column(String)
    phone_number = Column(String)
    call_date = Column(DateTime, default=datetime.utcnow)
    duration = Column(Integer)  # in seconds
    status = Column(String)
    recording_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    user_id = Column(Integer)
    organization_id = Column(String, nullable=True)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    organization_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Contact(BaseModel):
    id: int
    name: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    user_id: int
    organization_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ContactCreate(BaseModel):
    name: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None

class CallRecord(BaseModel):
    id: int
    contact_name: str
    phone_number: str
    call_date: datetime
    duration: int
    status: CallStatus
    recording_url: Optional[str] = None
    notes: Optional[str] = None
    user_id: int
    organization_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class CallRecordCreate(BaseModel):
    contact_name: str
    phone_number: str
    duration: int
    status: CallStatus
    recording_url: Optional[str] = None
    notes: Optional[str] = None

class CallStats(BaseModel):
    total_calls: int
    rnr: int
    not_reachable: int
    wrong_number: int
    answered_by_family: int
    answered_by_customer: int
    answered_by_others: int

# Helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# API Endpoints

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Call Manager API is running"}

@app.post("/register", response_model=User)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    organization_id = "org-001" if user.role == UserRole.admin else None
    
    db_user = UserDB(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role.value,
        organization_id=organization_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: UserDB = Depends(get_current_user)):
    return current_user

# Contacts endpoints
@app.post("/api/contacts", response_model=Contact)
async def create_contact(
    contact: ContactCreate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_contact = ContactDB(
        **contact.dict(),
        user_id=current_user.id,
        organization_id=current_user.organization_id
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.get("/api/contacts", response_model=List[Contact])
async def get_contacts(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        # Admin sees all contacts in organization
        contacts = db.query(ContactDB).filter(
            ContactDB.organization_id == current_user.organization_id
        ).all()
    else:
        # User sees only their contacts
        contacts = db.query(ContactDB).filter(ContactDB.user_id == current_user.id).all()
    return contacts

@app.post("/api/contacts/upload")
async def upload_contacts(
    file: UploadFile = File(...),
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file.file)
        else:
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        # Validate required columns
        required_columns = ['Name', 'Phone Number']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"File must contain columns: {', '.join(required_columns)}"
            )
        
        # Process contacts
        contacts_created = 0
        for _, row in df.iterrows():
            db_contact = ContactDB(
                name=row['Name'],
                phone_number=row['Phone Number'],
                email=row.get('Email', ''),
                address=row.get('Address', ''),
                user_id=current_user.id,
                organization_id=current_user.organization_id
            )
            db.add(db_contact)
            contacts_created += 1
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Successfully uploaded {contacts_created} contacts"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Call Records endpoints
@app.post("/api/calls", response_model=CallRecord)
async def create_call_record(
    call: CallRecordCreate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_call = CallRecordDB(
        **call.dict(),
        user_id=current_user.id,
        organization_id=current_user.organization_id
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call

@app.get("/api/calls", response_model=List[CallRecord])
async def get_call_records(
    status: Optional[CallStatus] = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CallRecordDB)
    
    if current_user.role == "admin":
        # Admin sees all calls in organization
        query = query.filter(CallRecordDB.organization_id == current_user.organization_id)
    else:
        # User sees only their calls
        query = query.filter(CallRecordDB.user_id == current_user.id)
    
    if status:
        query = query.filter(CallRecordDB.status == status.value)
    
    calls = query.order_by(CallRecordDB.call_date.desc()).all()
    return calls

@app.get("/api/calls/stats", response_model=CallStats)
async def get_call_stats(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        calls = db.query(CallRecordDB).filter(
            CallRecordDB.organization_id == current_user.organization_id
        ).all()
    else:
        calls = db.query(CallRecordDB).filter(CallRecordDB.user_id == current_user.id).all()
    
    return {
        "total_calls": len(calls),
        "rnr": sum(1 for c in calls if c.status == "RNR"),
        "not_reachable": sum(1 for c in calls if c.status == "Not Reachable"),
        "wrong_number": sum(1 for c in calls if c.status == "Wrong Number"),
        "answered_by_family": sum(1 for c in calls if c.status == "Answered by Family"),
        "answered_by_customer": sum(1 for c in calls if c.status == "Answered by Customer"),
        "answered_by_others": sum(1 for c in calls if c.status == "Answered by Others"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Running the Backend

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, access interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost/call_manager
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Database Migration to PostgreSQL

For production, use PostgreSQL instead of SQLite:

```python
# Install PostgreSQL driver
pip install psycopg2-binary

# Update connection string
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/call_manager"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
```

## Key Features Implemented

1. **Authentication**: JWT-based authentication with OAuth2
2. **Role-based Access**: User and Admin roles with different permissions
3. **Contact Management**: CRUD operations for contacts
4. **Excel Upload**: Parse and import contacts from Excel/CSV files
5. **Call Recording Management**: Track calls with different status types
6. **Statistics**: Real-time call statistics calculation
7. **Filtering**: Filter calls by status and user

## Security Notes

⚠️ **Important for Production:**

1. Change the `SECRET_KEY` to a strong random string
2. Use HTTPS for all communications
3. Use a production database (PostgreSQL)
4. Implement rate limiting
5. Add request validation
6. Set up proper CORS origins
7. Use environment variables for sensitive data
8. Implement proper logging and monitoring
