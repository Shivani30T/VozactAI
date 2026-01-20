# Call Manager - React + FastAPI Application

A comprehensive call management system with role-based access control, built with React (TypeScript) frontend and FastAPI (Python) backend.

## 🎯 Features

### Authentication & Authorization
- **Two User Types:**
  - **User**: Individual work access - view their own calls and upload contacts
  - **Admin**: Organization-wide view - see all team members' activities and analytics

### User Features
1. **Dashboard**
   - Real-time call statistics
   - Success rate metrics
   - Visual breakdown of call outcomes
   - 6 call status categories:
     - Ring No Response (RNR)
     - Not Reachable
     - Wrong Number
     - Answered by Family
     - Answered by Customer
     - Answered by Others

2. **Upload Calling List**
   - Import contacts from Excel (.xlsx, .xls) or CSV files
   - Download sample template
   - Bulk contact upload
   - FastAPI integration for file processing

3. **Call Recordings**
   - View all calls in order of recentness
   - Filter by call status
   - Search by name or phone number
   - Play and download recordings
   - View call duration and notes

### Admin Features
- Organization-wide dashboard
- Team performance metrics
- Active campaigns overview
- All call recordings across the organization
- User management insights

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- pip

### Frontend Setup (React)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   App will run on `http://localhost:5173`

### Backend Setup (FastAPI)

1. **Install Python dependencies:**
   ```bash
   pip install fastapi uvicorn python-multipart pydantic sqlalchemy python-jose[cryptography] passlib[bcrypt] pandas openpyxl
   ```

2. **Create `main.py`** (see `FASTAPI_BACKEND_GUIDE.md` for complete code)

3. **Run the backend:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   
   API will run on `http://localhost:8000`
   
   View API docs at `http://localhost:8000/docs`

## 👤 Demo Credentials

### User Account
- Username: `user1`
- Password: `user123`
- Access: Individual work view

### Admin Account
- Username: `admin`
- Password: `admin123`
- Access: Organization-wide view

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── LoginScreen.tsx          # Authentication UI
│   │   │   ├── Dashboard.tsx            # User dashboard with stats
│   │   │   ├── AdminDashboard.tsx       # Admin organization view
│   │   │   ├── UploadContacts.tsx       # Excel/CSV upload
│   │   │   ├── CallRecordings.tsx       # Recordings with filters
│   │   │   ├── Header.tsx               # App header with user info
│   │   │   └── ui/                      # Reusable UI components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx          # Authentication context
│   │   ├── data/
│   │   │   └── mockData.ts              # Mock data for demo
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript definitions
│   │   ├── services/
│   │   │   └── api.ts                   # API integration (from previous)
│   │   ├── hooks/
│   │   │   └── useApi.ts                # Custom API hooks
│   │   └── App.tsx                      # Main application
│   └── styles/                          # CSS and styling
├── .env.example                         # Environment variables template
├── FASTAPI_BACKEND_GUIDE.md            # Complete backend implementation
└── package.json                         # Dependencies
```

## 🎨 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend
- **FastAPI** - High-performance Python framework
- **SQLAlchemy** - Database ORM
- **JWT** - Authentication
- **Pandas** - Excel/CSV processing
- **Pydantic** - Data validation

## 📊 Call Status Categories

The system tracks 6 different call outcomes:

1. **RNR (Ring No Response)** - Call rang but wasn't answered
2. **Not Reachable** - Network/connection issues
3. **Wrong Number** - Incorrect phone number
4. **Answered by Family** - Family member answered
5. **Answered by Customer** - Customer answered (Success!)
6. **Answered by Others** - Assistant or other person answered

## 🔧 Key Features Implementation

### Excel Upload
- Supports .xlsx, .xls, and .csv formats
- Required columns: Name, Phone Number
- Optional columns: Email, Address
- Template download available
- Bulk import with validation

### Call Recording Filters
- Filter by any of the 6 call status types
- Search by contact name or phone number
- Sort by recentness (newest first)
- Real-time results count

### Role-Based Access
- **User**: Sees only their own data
- **Admin**: Sees entire organization's data
- Automatic permission checks
- Secure authentication with JWT

## 🔌 API Integration

The app is designed to integrate with FastAPI backend. Key endpoints:

- `POST /token` - User authentication
- `GET /api/calls` - Fetch call records
- `GET /api/calls/stats` - Get call statistics
- `POST /api/contacts/upload` - Upload Excel/CSV
- `GET /api/contacts` - Fetch contacts

See `FASTAPI_BACKEND_GUIDE.md` for complete backend implementation.

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## 🚀 Production Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, or any static host
```

### Backend
```bash
# Use a production ASGI server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Deploy to Railway, Render, AWS, GCP, or Azure
```

### Production Checklist
- ✅ Use PostgreSQL instead of SQLite
- ✅ Set strong SECRET_KEY
- ✅ Enable HTTPS
- ✅ Configure proper CORS
- ✅ Add rate limiting
- ✅ Implement logging
- ✅ Set up monitoring
- ✅ Use environment variables

## 📝 Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/call_manager
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🧪 Development vs Production

### Development
- Uses mock data for demonstration
- SQLite database (backend)
- Local authentication
- CORS allows localhost

### Production
- Replace with real FastAPI backend
- PostgreSQL database
- JWT authentication
- Proper CORS configuration
- File upload to cloud storage (S3, GCS)
- Audio recordings from CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for demonstration purposes.

## 🆘 Support

For issues or questions:
1. Check `FASTAPI_BACKEND_GUIDE.md` for backend setup
2. Check `INTEGRATION_GUIDE.md` for API integration
3. Review the inline code comments

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [SQLAlchemy](https://www.sqlalchemy.org)

---

Built with ❤️ using React and FastAPI
