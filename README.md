# 🔥 AI-Powered Dating App

A complete, production-ready dating app with AI compatibility matching.

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone and install
```bash
git clone https://github.com/santiagobarbera-png/APP.git
cd APP
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database and email settings
```

### 3. Setup database
```bash
# Create the database
createdb dating_app

# Run the migration (creates all tables)
psql -U your_user -d dating_app -f database/migration.sql
```

### 4. Start the server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server runs at `http://localhost:5000`

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

### 🔐 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login and get token |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/change-password` | ✅ | Change password |

**Register:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepass",
  "name": "John Doe"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepass"
}
// Response: { "token": "eyJ...", "user": { "id": "...", ... } }
```

---

### 👤 User Profiles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✅ | Get my full profile |
| PUT | `/users/profile` | ✅ | Update my profile |
| GET | `/users/preferences` | ✅ | Get match preferences |
| PUT | `/users/preferences` | ✅ | Update match preferences |
| GET | `/users/:id` | ✅ | View another user's profile |
| DELETE | `/users/account` | ✅ | Delete account |

**Update Profile:**
```json
PUT /api/users/profile
{
  "bio": "I love hiking and coffee",
  "age": 28,
  "gender": "male",
  "looking_for": "female",
  "mbti": "ENFP",
  "occupation": "Software Engineer",
  "city": "Buenos Aires",
  "country": "Argentina",
  "latitude": -34.6037,
  "longitude": -58.3816,
  "photos": ["https://example.com/photo1.jpg"],
  "interests": ["hiking", "coffee", "travel", "coding"]
}
```

**Update Preferences:**
```json
PUT /api/users/preferences
{
  "min_age": 22,
  "max_age": 35,
  "preferred_gender": "female",
  "max_distance_km": 50
}
```

---

### 💘 Matching

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/matches/discover` | ✅ | Get AI-ranked candidates |
| POST | `/matches/action` | ✅ | Like or pass on someone |
| GET | `/matches` | ✅ | Get all mutual matches |
| GET | `/matches/pending` | ✅ | Get pending actions |

**Like / Pass:**
```json
POST /api/matches/action
{
  "targetUserId": "uuid-here",
  "action": "like"   // or "pass"
}
// When both like each other → "It's a match! 🎉"
```

**Discover candidates:**
```json
GET /api/matches/discover
// Response includes AI compatibility scores:
{
  "candidates": [{
    "id": "...",
    "name": "Jane",
    "age": 26,
    "compatibility": {
      "totalScore": 87.5,
      "breakdown": {
        "mbti": 95,
        "location": 90,
        "age": 85,
        "interests": 80
      }
    }
  }]
}
```

---

### 💬 Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/messages` | ✅ | Send a message |
| GET | `/messages/:matchId` | ✅ | Get conversation |
| PUT | `/messages/:matchId/read` | ✅ | Mark as read |
| DELETE | `/messages/:messageId` | ✅ | Delete a message |

**Send Message:**
```json
POST /api/messages
{
  "matchId": "uuid-here",
  "content": "Hey! How are you?"
}
```

---

### 🔔 Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✅ | Get notifications |
| PUT | `/notifications/read-all` | ✅ | Mark all as read |
| PUT | `/notifications/:id/read` | ✅ | Mark one as read |
| DELETE | `/notifications/:id` | ✅ | Delete notification |

---

## 🧠 AI Matching Algorithm

Compatibility score (0-100) is calculated from:

| Factor | Weight | Description |
|--------|--------|-------------|
| MBTI Personality | 30% | Full 16×16 compatibility matrix |
| Location/Distance | 25% | Haversine formula - closer = higher score |
| Age Compatibility | 20% | Smaller age gap = higher score |
| Shared Interests | 25% | Jaccard similarity of interest tags |

Only users with score ≥ 60 are considered "perfect matches".

---

## ⚡ Real-time Features (Socket.io)

Connect with JWT token:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

// Listen for new matches
socket.on('new_match', (data) => console.log('New match!', data));

// Listen for new messages
socket.on('new_message', (message) => console.log('New message:', message));

// Listen for notifications
socket.on('notification', (notif) => console.log('Notification:', notif));

// Join a match room for messages
socket.emit('join_match', matchId);
```

---

## 🤖 Automated AI Processing

Two scripts run daily at 2 AM UTC via GitHub Actions:

1. **`npm run find:perfect-matches`** - Scans all users and finds the top 5 compatibility matches
2. **`npm run send:notifications`** - Sends in-app + email notifications

Run manually:
```bash
npm run find:perfect-matches
npm run send:notifications
```

---

## 🗄️ Database Schema

Tables: `users`, `profiles`, `preferences`, `matches`, `messages`, `notifications`, `perfect_matches_queue`

See `database/migration.sql` for full schema.

---

## ⚙️ Environment Variables

See `.env.example` for all required variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random secret for JWT signing

**Optional (for email):**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

---

## 🔒 GitHub Actions Secrets

For daily automated matching, set these in `Settings > Secrets`:
- `DATABASE_URL`
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional)
