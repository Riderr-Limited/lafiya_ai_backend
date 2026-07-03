# LafiyaAI Backend

AI + Doctors + Community — A Hausa-first health network for Northern Nigeria.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- OpenAI GPT-4o-mini (symptom analysis + misinformation detection)
- JWT Authentication

## Setup

```bash
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY
# Also configure FCM and Cloudinary values if using push notifications or file uploads
npm install
npm run dev
```

> Note: In production, make sure `MONGO_URI` is set in your host environment. The app will fail to start if this variable is missing.

# HealthCommunity Backend API

AI-Powered Health Community & Support Platform for Northern Nigeria.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# 3. Start development server
npm run dev

# 4. Production
npm start
```

---

## 🗂 Project Structure

```
src/
├── app.js                    # Express app entry
├── config/
│   ├── database.js           # MongoDB connection
│   ├── socket.js             # Socket.io handler
│   └── cloudinary.js         # Cloudinary config
├── models/
│   ├── User.model.js
│   ├── Doctor.model.js
│   ├── Community.model.js
│   ├── Post.model.js
│   ├── Comment.model.js
│   ├── Hospital.model.js
│   ├── Appointment.model.js
│   ├── HealthRecord.model.js
│   ├── Medication.model.js
│   ├── Pregnancy.model.js
│   ├── Notification.model.js
│   ├── Campaign.model.js
│   └── AISession.model.js
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── community.controller.js
│   ├── post.controller.js
│   ├── comment.controller.js
│   ├── doctor.controller.js
│   ├── hospital.controller.js
│   ├── appointment.controller.js
│   ├── healthRecord.controller.js
│   ├── ai.controller.js
│   ├── notification.controller.js
│   ├── medication.controller.js
│   ├── pregnancy.controller.js
│   ├── campaign.controller.js
│   ├── emergency.controller.js
│   └── admin.controller.js
├── routes/                   # One file per resource
├── middlewares/
│   ├── auth.middleware.js    # JWT protect + restrictTo
│   ├── errorHandler.js
│   ├── notFound.js
│   ├── upload.middleware.js  # Multer
│   └── validate.middleware.js
└── utils/
    ├── jwt.utils.js
    ├── apiResponse.utils.js
    ├── cloudinary.utils.js
    ├── email.utils.js
    ├── notification.utils.js
    ├── pagination.utils.js
    ├── token.utils.js
    └── AppError.js
```

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <token>
```

---

## 📡 API Endpoints

### Auth  `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login |
| GET | `/me` | ✅ | Get current user |
| POST | `/verify-email` | ❌ | Verify email |
| POST | `/forgot-password` | ❌ | Send reset email |
| POST | `/reset-password` | ❌ | Reset password |
| PUT | `/change-password` | ✅ | Change password |
| POST | `/refresh-token` | ❌ | Refresh JWT |
| PUT | `/fcm-token` | ✅ | Update push notification token |

---

### Users  `/api/users`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | ✅ | My profile |
| PUT | `/profile` | ✅ | Update profile |
| PUT | `/avatar` | ✅ | Upload avatar |
| DELETE | `/me` | ✅ | Deactivate account |
| GET | `/me/communities` | ✅ | My communities |
| GET | `/:id` | ✅ | Get user by ID |
| GET | `/` | ✅ Admin | All users |

---

### Communities  `/api/communities`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List all communities |
| GET | `/:id` | ❌ | Get community |
| GET | `/:id/members` | ✅ | Community members |
| POST | `/` | ✅ Admin | Create community |
| PUT | `/:id` | ✅ Mod | Update community |
| POST | `/:id/join` | ✅ | Join community |
| POST | `/:id/leave` | ✅ | Leave community |
| POST | `/:id/add-doctor` | ✅ Admin | Add doctor to community |

---

### Posts  `/api/posts`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Optional | List posts (filter by community) |
| GET | `/:id` | Optional | Get post |
| POST | `/` | ✅ | Create post (supports media upload) |
| PUT | `/:id` | ✅ | Update post |
| DELETE | `/:id` | ✅ | Delete post |
| POST | `/:id/like` | ✅ | Like/unlike post |
| POST | `/:id/save` | ✅ | Save/unsave post |
| POST | `/:id/flag` | ✅ | Report post |
| POST | `/:id/pin` | ✅ Doctor/Mod | Pin post |

---

### Comments  `/api/comments`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/?post=id` | ✅ | Get comments for post |
| POST | `/` | ✅ | Add comment (supports replies) |
| PUT | `/:id` | ✅ | Update comment |
| DELETE | `/:id` | ✅ | Delete comment |
| POST | `/:id/like` | ✅ | Like comment |

---

### Doctors  `/api/doctors`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List doctors |
| GET | `/:id` | ❌ | Get doctor |
| GET | `/:id/availability` | ❌ | Doctor availability |
| POST | `/register` | ✅ | Register doctor profile |
| PUT | `/me` | ✅ Doctor | Update doctor profile |
| POST | `/:id/rate` | ✅ | Rate doctor (post-appointment) |

---

### Hospitals  `/api/hospitals`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List hospitals |
| GET | `/nearby?lat=&lng=&radius=` | ❌ | Nearby hospitals (geolocation) |
| GET | `/:id` | ❌ | Get hospital |
| POST | `/` | ✅ Admin | Add hospital |
| PUT | `/:id` | ✅ Admin | Update hospital |
| DELETE | `/:id` | ✅ Admin | Deactivate hospital |
| POST | `/:id/rate` | ✅ | Rate hospital |

---

### Appointments  `/api/appointments`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | ✅ Patient | My appointments |
| GET | `/doctor` | ✅ Doctor | Doctor's appointments |
| GET | `/:id` | ✅ | Get appointment |
| POST | `/` | ✅ | Book appointment |
| PUT | `/:id/confirm` | ✅ Doctor | Confirm appointment |
| PUT | `/:id/cancel` | ✅ | Cancel appointment |
| PUT | `/:id/complete` | ✅ Doctor | Complete & add notes |

---

### Health Records  `/api/health-records`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | My health records |
| GET | `/vitals/timeline` | ✅ | Vitals chart data |
| GET | `/patient/:userId` | ✅ Doctor | Patient's shared records |
| GET | `/:id` | ✅ | Get record |
| POST | `/` | ✅ | Create record (with file upload) |
| PUT | `/:id` | ✅ | Update record |
| DELETE | `/:id` | ✅ | Delete record |
| POST | `/:id/share` | ✅ | Share record with doctor |

---

### AI Assistant  `/api/ai`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | ✅ | Chat with AI (en/ha) |
| POST | `/symptom-check` | ✅ | AI symptom analysis |
| GET | `/sessions` | ✅ | My AI sessions |
| GET | `/sessions/:sessionId` | ✅ | Get session |
| DELETE | `/sessions/:sessionId` | ✅ | Delete session |

**Chat Request Body:**
```json
{
  "message": "I have a headache and fever",
  "sessionId": "optional-existing-session-id",
  "language": "en",
  "inputType": "text"
}
```

**Symptom Check Request Body:**
```json
{
  "symptoms": ["headache", "fever", "fatigue"],
  "age": 30,
  "gender": "male",
  "language": "en"
}
```

---

### Medications  `/api/medications`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | My medications |
| GET | `/today` | ✅ | Today's schedule |
| GET | `/:id` | ✅ | Get medication |
| GET | `/:id/adherence` | ✅ | Adherence stats |
| POST | `/` | ✅ | Add medication |
| PUT | `/:id` | ✅ | Update medication |
| DELETE | `/:id` | ✅ | Remove medication |
| POST | `/:id/log` | ✅ | Log dose taken/missed |

---

### Pregnancy Tracker  `/api/pregnancy`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/milestones` | ❌ | Weekly milestone data |
| GET | `/my` | ✅ | Active pregnancy |
| GET | `/history` | ✅ | Pregnancy history |
| POST | `/` | ✅ | Start pregnancy tracker |
| PUT | `/:id` | ✅ | Update record |
| POST | `/:id/antenatal-visit` | ✅ | Log antenatal visit |
| POST | `/:id/symptom` | ✅ | Log symptom |
| POST | `/:id/vaccination` | ✅ | Log vaccination |

---

### Campaigns  `/api/campaigns`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List campaigns |
| GET | `/:id` | ❌ | Get campaign |
| POST | `/` | ✅ Doctor/Admin | Create campaign |
| PUT | `/:id/publish` | ✅ Admin | Publish campaign |
| DELETE | `/:id` | ✅ Admin | Delete campaign |

---

### Emergency  `/api/emergency`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/contacts` | ❌ | Nigeria emergency numbers |
| GET | `/nearby-hospitals` | ❌ | Nearest emergency hospitals |
| GET | `/first-aid/:condition` | ❌ | First aid guides |
| POST | `/alert` | ✅ | Send SOS emergency alert |

**First Aid Conditions:** `choking`, `malaria`, `burns`, `seizure`, `bleeding`, `heatstroke`

---

### Notifications  `/api/notifications`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | My notifications |
| PUT | `/read-all` | ✅ | Mark all as read |
| DELETE | `/clear-all` | ✅ | Clear all |
| PUT | `/:id/read` | ✅ | Mark one as read |
| DELETE | `/:id` | ✅ | Delete notification |

---

### Admin  `/api/admin` *(Admin only)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard stats |
| GET | `/doctors/pending` | Unverified doctors |
| PUT | `/doctors/:id/verify` | Verify/reject doctor |
| GET | `/posts/flagged` | Reported posts |
| PUT | `/posts/:id/approve` | Approve flagged post |
| DELETE | `/posts/:id` | Remove post |
| PUT | `/users/:id/toggle-active` | Ban/unban user |
| PUT | `/users/:id/role` | Change user role |
| GET | `/activity-logs` | Recent activity |

---

## 🔌 WebSocket Events (Socket.io)

Connect with: `socket.auth = { token: "Bearer_token" }`

| Event (emit) | Payload | Description |
|---|---|---|
| `join_community` | `communityId` | Join community room |
| `leave_community` | `communityId` | Leave community room |
| `typing` | `{ communityId }` | Broadcast typing indicator |
| `private_message` | `{ toUserId, message }` | Send private message |

| Event (listen) | Description |
|---|---|
| `notification` | Real-time notification |
| `user_typing` | Someone is typing |
| `private_message` | Incoming private message |

---

## 🌍 Community Categories

`kidney_disease` · `liver_disease` · `heart_conditions` · `malaria` · `diabetes` · `pregnancy_maternal` · `hypertension` · `mental_health` · `cancer` · `hiv_aids` · `tuberculosis` · `sickle_cell` · `general_health`

---

## 🛡 User Roles

| Role | Permissions |
|------|-------------|
| `patient` | Default. Browse, post, book appointments |
| `doctor` | All patient permissions + manage doctor profile, confirm/complete appointments, moderate communities |
| `nurse` | Similar to doctor with limited permissions |
| `moderator` | Pin posts, manage community content |
| `admin` | Full access to all endpoints |

---

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (access + refresh tokens)
- **File Storage:** Cloudinary
- **Real-time:** Socket.io
- **AI:** OpenAI GPT-4o-mini
- **Email:** Nodemailer (SMTP)
- **Push Notifications:** Firebase Cloud Messaging
- **Security:** Helmet, CORS, Rate Limiting, bcryptjs