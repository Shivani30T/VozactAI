# Call Manager - Implementation Guide

## Overview
Complete call management system with role-based authentication, campaign tracking, time-based filtering, and customer response tagging.

## Features Implemented

### 1. **Single Login Screen**
- Unified login interface (no tabs)
- Auto-detects user role (User/Admin) based on credentials
- Demo credentials:
  - **User**: `user1` / `user123`
  - **Admin**: `admin` / `admin123`

### 2. **Admin User Management**
- Complete CRUD operations for users
- Plan-based access control:
  - **Free**: 50 calls/month, basic analytics, 7 days storage
  - **Basic**: 500 calls/month, advanced analytics, 30 days storage
  - **Premium**: 2000 calls/month, full analytics, 90 days storage
  - **Enterprise**: Unlimited calls, custom analytics, unlimited storage
- User activation/deactivation
- Search and filter users
- Real-time plan updates

### 3. **Campaign Management**
- Create campaigns during file upload
- Select existing campaigns
- Campaigns include timestamps
- All calls linked to campaigns

### 4. **Dashboard Filters**

#### Time Range Filters:
- **Last 1 Day**: Calls from last 24 hours
- **Last 7 Days**: Calls from last week
- **Last 15 Days**: Calls from last 2 weeks
- **Last 30 Days**: Calls from last month
- **All Time**: No time filtering

#### Campaign Filters:
- Filter by specific campaign
- View all campaigns combined
- Real-time statistics update based on filters

### 5. **Call Status Tags**
Six call status categories:
1. **RNR** (Ring No Response)
2. **Not Reachable**
3. **Wrong Number**
4. **Answered by Family**
5. **Answered by Customer**
6. **Answered by Others**

### 6. **Customer Response Tags**
For calls answered by customers only:
1. **Promised to Pay** - Customer committed to payment
2. **Requested Time** - Customer asked for callback later
3. **Denied to Pay** - Customer refused payment
4. **Asked to call back** - Customer busy, requested callback
5. **Others** - Other responses

## Data Models

### User
```typescript
{
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  organizationId?: string;
  plan?: 'free' | 'basic' | 'premium' | 'enterprise';
  isActive?: boolean;
  createdAt?: string;
}
```

### Campaign
```typescript
{
  id: string;
  name: string;
  createdAt: string;
  userId: string;
  organizationId?: string;
  totalContacts: number;
  callsMade: number;
}
```

### CallRecord
```typescript
{
  id: string;
  contactName: string;
  phoneNumber: string;
  callDate: string;
  duration: number; // in seconds
  status: CallStatus;
  responseTag?: ResponseTag; // Only for answered calls
  recordingUrl?: string;
  notes?: string;
  userId: string;
  organizationId?: string;
  campaignId?: string;
  campaignName?: string;
}
```

## FastAPI Integration Guide

### 1. Authentication Endpoints

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    organizationId: Optional[str]
    plan: Optional[str]
    isActive: bool

@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    # Verify credentials against database
    user = db.verify_user(credentials.username, credentials.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate JWT token
    token = create_access_token(user.id)
    
    return {
        "user": UserResponse(**user.dict()),
        "token": token
    }

@app.post("/api/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # Invalidate token if using token blacklist
    return {"status": "success"}
```

### 2. Campaign Endpoints

```python
from datetime import datetime

class CampaignCreate(BaseModel):
    name: str

class CampaignResponse(BaseModel):
    id: str
    name: str
    createdAt: str
    userId: str
    organizationId: Optional[str]
    totalContacts: int
    callsMade: int

@app.post("/api/campaigns", response_model=CampaignResponse)
async def create_campaign(
    campaign: CampaignCreate,
    current_user: User = Depends(get_current_user)
):
    new_campaign = {
        "id": generate_id(),
        "name": campaign.name,
        "createdAt": datetime.utcnow().isoformat(),
        "userId": current_user.id,
        "organizationId": current_user.organizationId,
        "totalContacts": 0,
        "callsMade": 0
    }
    
    db.save_campaign(new_campaign)
    return new_campaign

@app.get("/api/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(current_user: User = Depends(get_current_user)):
    if current_user.role == 'admin':
        campaigns = db.get_all_campaigns(current_user.organizationId)
    else:
        campaigns = db.get_user_campaigns(current_user.id)
    
    return campaigns
```

### 3. Contact Upload Endpoints

```python
from fastapi import UploadFile, File
import pandas as pd

@app.post("/api/contacts/upload")
async def upload_contacts(
    campaignId: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Read file
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file.file)
    else:
        df = pd.read_excel(file.file)
    
    # Validate required columns
    required_cols = ['Name', 'Phone Number']
    if not all(col in df.columns for col in required_cols):
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns: {required_cols}"
        )
    
    # Process contacts
    contacts = []
    for _, row in df.iterrows():
        contact = {
            "id": generate_id(),
            "name": row["Name"],
            "phoneNumber": row["Phone Number"],
            "email": row.get("Email", ""),
            "address": row.get("Address", ""),
            "userId": current_user.id,
            "organizationId": current_user.organizationId,
            "campaignId": campaignId,
            "createdAt": datetime.utcnow().isoformat()
        }
        contacts.append(contact)
    
    # Save to database
    db.bulk_insert_contacts(contacts)
    
    # Update campaign contact count
    db.update_campaign_contact_count(campaignId, len(contacts))
    
    return {
        "status": "success",
        "count": len(contacts),
        "campaignId": campaignId
    }
```

### 4. Call Recording Endpoints

```python
class CallRecordCreate(BaseModel):
    contactName: str
    phoneNumber: str
    duration: int
    status: str
    responseTag: Optional[str]
    recordingUrl: Optional[str]
    notes: Optional[str]
    campaignId: str

@app.post("/api/calls")
async def create_call_record(
    call: CallRecordCreate,
    current_user: User = Depends(get_current_user)
):
    # Validate response tag only for answered calls
    if call.responseTag and call.status != "Answered by Customer":
        raise HTTPException(
            status_code=400,
            detail="Response tags only applicable for 'Answered by Customer' status"
        )
    
    call_record = {
        "id": generate_id(),
        **call.dict(),
        "callDate": datetime.utcnow().isoformat(),
        "userId": current_user.id,
        "organizationId": current_user.organizationId
    }
    
    db.save_call_record(call_record)
    
    # Update campaign call count
    db.increment_campaign_calls(call.campaignId)
    
    return call_record

@app.get("/api/calls")
async def get_call_records(
    campaignId: Optional[str] = None,
    timeRange: Optional[str] = None,  # '1day', '7days', '15days', '30days'
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    filters = {
        "userId": current_user.id if current_user.role == 'user' else None,
        "organizationId": current_user.organizationId,
        "campaignId": campaignId,
        "status": status
    }
    
    # Apply time filter
    if timeRange:
        time_ranges = {
            '1day': 1,
            '7days': 7,
            '15days': 15,
            '30days': 30
        }
        days = time_ranges.get(timeRange)
        if days:
            cutoff = datetime.utcnow() - timedelta(days=days)
            filters["callDate__gte"] = cutoff
    
    calls = db.get_filtered_calls(filters)
    return calls
```

### 5. User Management Endpoints (Admin Only)

```python
class UserCreate(BaseModel):
    username: str
    email: str
    plan: str

class UserUpdate(BaseModel):
    plan: Optional[str]
    isActive: Optional[bool]

@app.post("/api/users")
async def create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_admin)
):
    new_user = {
        "id": generate_id(),
        **user.dict(),
        "role": "user",
        "organizationId": current_user.organizationId,
        "isActive": True,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    db.save_user(new_user)
    return new_user

@app.get("/api/users")
async def get_users(current_user: User = Depends(get_current_admin)):
    users = db.get_organization_users(current_user.organizationId)
    return users

@app.patch("/api/users/{user_id}")
async def update_user(
    user_id: str,
    updates: UserUpdate,
    current_user: User = Depends(get_current_admin)
):
    db.update_user(user_id, updates.dict(exclude_unset=True))
    return {"status": "success"}

@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_admin)
):
    db.delete_user(user_id)
    return {"status": "success"}
```

### 6. Statistics Endpoints

```python
@app.get("/api/stats")
async def get_statistics(
    campaignId: Optional[str] = None,
    timeRange: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    calls = await get_call_records(
        campaignId=campaignId,
        timeRange=timeRange,
        current_user=current_user
    )
    
    stats = {
        "totalCalls": len(calls),
        "rnr": sum(1 for c in calls if c["status"] == "RNR"),
        "notReachable": sum(1 for c in calls if c["status"] == "Not Reachable"),
        "wrongNumber": sum(1 for c in calls if c["status"] == "Wrong Number"),
        "answeredByFamily": sum(1 for c in calls if c["status"] == "Answered by Family"),
        "answeredByCustomer": sum(1 for c in calls if c["status"] == "Answered by Customer"),
        "answeredByOthers": sum(1 for c in calls if c["status"] == "Answered by Others"),
        "promisedToPay": sum(1 for c in calls if c.get("responseTag") == "Promised to Pay"),
        "requestedTime": sum(1 for c in calls if c.get("responseTag") == "Requested Time"),
        "deniedToPay": sum(1 for c in calls if c.get("responseTag") == "Denied to Pay"),
        "askedToCallBack": sum(1 for c in calls if c.get("responseTag") == "Asked to call back"),
        "othersTag": sum(1 for c in calls if c.get("responseTag") == "Others"),
    }
    
    return stats
```

## Database Schema Recommendations

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'admin')),
    organization_id VARCHAR(50),
    plan VARCHAR(20) CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Organizations table
CREATE TABLE organizations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE campaigns (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50),
    total_contacts INTEGER DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Contacts table
CREATE TABLE contacts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    user_id VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50),
    campaign_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Call records table
CREATE TABLE call_records (
    id VARCHAR(50) PRIMARY KEY,
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    call_date TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (
        status IN (
            'RNR',
            'Not Reachable',
            'Wrong Number',
            'Answered by Family',
            'Answered by Customer',
            'Answered by Others'
        )
    ),
    response_tag VARCHAR(50) CHECK (
        response_tag IN (
            'Promised to Pay',
            'Requested Time',
            'Denied to Pay',
            'Asked to call back',
            'Others'
        )
    ),
    recording_url TEXT,
    notes TEXT,
    user_id VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50),
    campaign_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    -- Constraint: response_tag only for Answered by Customer
    CONSTRAINT response_tag_check CHECK (
        (status = 'Answered by Customer' AND response_tag IS NOT NULL) OR
        (status != 'Answered by Customer' AND response_tag IS NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_calls_user_id ON call_records(user_id);
CREATE INDEX idx_calls_organization_id ON call_records(organization_id);
CREATE INDEX idx_calls_campaign_id ON call_records(campaign_id);
CREATE INDEX idx_calls_call_date ON call_records(call_date);
CREATE INDEX idx_calls_status ON call_records(status);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_contacts_campaign_id ON contacts(campaign_id);
```

## Frontend Integration Points

### Update AuthContext to use API

```typescript
// src/app/contexts/AuthContext.tsx
const login = async (credentials: { username: string; password: string }) => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  const data = await response.json();
  setUser(data.user);
  localStorage.setItem('token', data.token);
};
```

### API Service Layer

```typescript
// src/app/services/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const api = {
  // Campaigns
  getCampaigns: async () => {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
  
  createCampaign: async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    return response.json();
  },
  
  // Calls
  getCalls: async (filters?: { campaignId?: string; timeRange?: string }) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/calls?${params}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
  
  // Stats
  getStats: async (filters?: { campaignId?: string; timeRange?: string }) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/stats?${params}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
```

## Color Theme

The application uses a professional **deep blue and white** theme:

- **Primary Blue**: `#003d82` (Deep blue for headers, buttons)
- **Blue Gradient**: `from-blue-900 to-blue-800` (Gradients)
- **Light Blue**: `#e3f2fd`, `#f5f9ff` (Backgrounds)
- **White**: Primary backgrounds
- **Status Colors**: Green (success), Yellow (warning), Red (error), Purple/Indigo/Orange (various statuses)

## Testing the Application

### Demo Credentials

1. **User Login**:
   - Username: `user1`
   - Password: `user123`
   - Access: Individual dashboard, upload lists, view own recordings

2. **Admin Login**:
   - Username: `admin`
   - Password: `admin123`
   - Access: Organization dashboard, user management, all recordings

### Testing Workflow

1. **Login as User**
2. **Upload Contacts**: Create/select campaign, upload CSV
3. **View Dashboard**: Test campaign and time filters
4. **Check Recordings**: View calls with response tags
5. **Login as Admin**
6. **Manage Users**: Create, update plans, activate/deactivate
7. **View Organization Data**: See all campaigns and calls

## Next Steps

1. Set up FastAPI backend with the provided endpoints
2. Configure PostgreSQL database with the schema
3. Implement JWT authentication
4. Connect frontend to backend API
5. Add file upload to cloud storage (S3, etc.)
6. Implement actual recording storage and playback
7. Add email notifications for user creation
8. Set up monitoring and analytics

## Support

For questions or issues, refer to:
- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- TypeScript Documentation: https://www.typescriptlang.org/
