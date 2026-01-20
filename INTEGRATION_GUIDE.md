# React + FastAPI Integration Guide

## Overview

This project demonstrates a complete integration between a **React frontend** and a **FastAPI backend**. The React app is built with TypeScript and Tailwind CSS, providing a modern, type-safe user interface that communicates with Python FastAPI endpoints.

## Why React + FastAPI?

✅ **React is the RIGHT choice** for your frontend because:
- **Component-based architecture**: Reusable, maintainable UI components
- **Large ecosystem**: Vast library of packages and community support
- **Performance**: Virtual DOM and efficient rendering
- **TypeScript support**: Type safety reduces bugs
- **Industry standard**: Used by Facebook, Netflix, Airbnb, and thousands of companies

✅ **FastAPI is excellent** for Python backends:
- **Fast**: High performance, comparable to Node.js and Go
- **Automatic API documentation**: Interactive Swagger/OpenAPI docs
- **Type hints**: Python type hints for better code quality
- **Async support**: Built-in async/await support
- **Easy to learn**: Simple, intuitive syntax

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/         # React UI components
│   │   │   ├── ApiStatusCard.tsx      # Backend status checker
│   │   │   ├── UserList.tsx           # Display users (GET)
│   │   │   ├── CreateUserForm.tsx     # Create users (POST)
│   │   │   └── ui/                    # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useApi.ts              # API call hooks
│   │   ├── services/           # API integration layer
│   │   │   └── api.ts                 # FastAPI service methods
│   │   └── App.tsx             # Main app component
│   └── styles/                 # CSS and styling
├── .env.example                # Environment variables template
└── package.json                # Dependencies
```

## Setup Instructions

### Frontend Setup (React)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your FastAPI backend URL:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The React app will run on `http://localhost:5173`

### Backend Setup (FastAPI)

1. **Install Python dependencies:**
   ```bash
   pip install fastapi uvicorn python-multipart pydantic
   ```

2. **Create `main.py` for your FastAPI backend:**
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from pydantic import BaseModel
   from typing import List, Optional

   app = FastAPI(title="My API", version="1.0.0")

   # CRITICAL: Configure CORS to allow React app
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:5173",  # React dev server
           "http://localhost:3000",  # Alternative React port
           # Add your production URL here
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   # Data models
   class User(BaseModel):
       id: Optional[int] = None
       name: str
       email: str
       created_at: Optional[str] = None

   # In-memory database (replace with PostgreSQL/MongoDB in production)
   users_db: List[User] = []

   # Health check endpoint
   @app.get("/health")
   async def health_check():
       return {"status": "ok", "message": "API is running"}

   # Get all users
   @app.get("/api/users", response_model=List[User])
   async def get_users():
       return users_db

   # Get single user
   @app.get("/api/users/{user_id}", response_model=User)
   async def get_user(user_id: int):
       user = next((u for u in users_db if u.id == user_id), None)
       if not user:
           raise HTTPException(status_code=404, detail="User not found")
       return user

   # Create user
   @app.post("/api/users", response_model=User)
   async def create_user(user: User):
       user.id = len(users_db) + 1
       from datetime import datetime
       user.created_at = datetime.now().isoformat()
       users_db.append(user)
       return user

   # Update user
   @app.put("/api/users/{user_id}", response_model=User)
   async def update_user(user_id: int, user_update: User):
       for idx, user in enumerate(users_db):
           if user.id == user_id:
               user_update.id = user_id
               users_db[idx] = user_update
               return user_update
       raise HTTPException(status_code=404, detail="User not found")

   # Delete user
   @app.delete("/api/users/{user_id}")
   async def delete_user(user_id: int):
       global users_db
       initial_length = len(users_db)
       users_db = [u for u in users_db if u.id != user_id]
       if len(users_db) == initial_length:
           raise HTTPException(status_code=404, detail="User not found")
       return {"status": "deleted", "id": user_id}

   # Search users
   @app.get("/api/users/search", response_model=List[User])
   async def search_users(q: str):
       results = [u for u in users_db if q.lower() in u.name.lower() or q.lower() in u.email.lower()]
       return results
   ```

3. **Run the FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   
   The API will run on `http://localhost:8000`
   
   Access interactive API docs at `http://localhost:8000/docs`

## How It Works

### API Service Layer (`/src/app/services/api.ts`)

This file contains all API communication logic:
- Base URL configuration
- TypeScript interfaces for type safety
- Generic API call handler with error handling
- Individual methods for each endpoint (GET, POST, PUT, DELETE)

### Custom Hooks (`/src/app/hooks/useApi.ts`)

Reusable hooks for API operations:
- `useApi`: For GET requests with automatic loading/error states
- `useMutation`: For POST/PUT/DELETE operations

### Components

- **ApiStatusCard**: Monitors backend connectivity
- **UserList**: Displays users from the API (demonstrates GET)
- **CreateUserForm**: Submits new users (demonstrates POST)

## Key Features Implemented

✅ **GET requests** - Fetch data from FastAPI  
✅ **POST requests** - Submit data to FastAPI  
✅ **DELETE requests** - Remove data via API  
✅ **Loading states** - Shows skeletons while fetching  
✅ **Error handling** - Displays user-friendly error messages  
✅ **CORS handling** - Properly configured for cross-origin requests  
✅ **Type safety** - TypeScript interfaces match Python Pydantic models  
✅ **Connection status** - Real-time backend health monitoring  

## Common Issues & Solutions

### Issue: "CORS policy error"
**Solution**: Ensure your FastAPI backend has CORS middleware configured with your React app's URL in `allow_origins`.

### Issue: "Network request failed"
**Solution**: 
1. Check if FastAPI server is running (`http://localhost:8000/health`)
2. Verify the API URL in your `.env` file
3. Check firewall settings

### Issue: "Module not found" errors
**Solution**: Make sure all dependencies are installed:
```bash
npm install
```

## Production Deployment

### Frontend (React)
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy to Vercel, Netlify, or any static hosting
3. Update `.env` with production API URL

### Backend (FastAPI)
1. Use a production ASGI server (not `--reload`):
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
2. Deploy to:
   - **Railway**: Easy Python deployments
   - **Render**: Free tier available
   - **AWS/GCP/Azure**: Full control
   - **DigitalOcean**: Simple app platform

3. Use a production database:
   - PostgreSQL (recommended)
   - MongoDB
   - MySQL

4. Add authentication:
   - JWT tokens
   - OAuth 2.0
   - API keys

## Next Steps

1. **Add Authentication**: Implement JWT or OAuth
2. **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
3. **Input Validation**: Add form validation on frontend
4. **Error Boundaries**: Implement React error boundaries
5. **Testing**: Add unit tests (Jest) and E2E tests (Playwright)
6. **State Management**: Consider Redux or Zustand for complex state
7. **API Caching**: Implement React Query for better caching
8. **Rate Limiting**: Add rate limiting on FastAPI

## Resources

- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)

## Alternative Frontend Options

While **React is recommended**, you could also use:
- **Vue.js**: Progressive framework, easier learning curve
- **Angular**: Full-featured framework from Google
- **Svelte**: Compile-time framework, smaller bundle size
- **Next.js**: React framework with SSR/SSG capabilities

However, React remains the most popular choice with the largest ecosystem and job market demand.
