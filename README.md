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
npm install
npm run dev
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (patient/doctor/admin) |
| POST | `/api/auth/login` | Login with phone + password |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |

### Symptom Checker (AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/symptoms/check` | AI symptom analysis → risk level + next steps |
| GET | `/api/symptoms/history` | User's symptom history |
| PATCH | `/api/symptoms/:id/review` | Doctor reviews a check |

### Community
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/community/groups` | List all groups |
| POST | `/api/community/groups` | Create group (admin) |
| POST | `/api/community/groups/:id/join` | Join a group |
| GET | `/api/community/groups/:id/posts` | Get group posts |
| POST | `/api/community/groups/:id/posts` | Create post (AI misinformation check) |
| POST | `/api/community/posts/:id/reply` | Reply to post |
| PATCH | `/api/community/posts/:id/verify` | Doctor verifies post |
| PATCH | `/api/community/posts/:id/flag` | Flag post |

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospitals?lat=&lng=&radius=&type=&emergency=` | Find nearby hospitals |
| GET | `/api/hospitals/:id` | Hospital details |
| POST | `/api/hospitals` | Add hospital (admin) |

### Health Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content?category=&page=` | List verified content |
| GET | `/api/content/:id` | Get content |
| POST | `/api/content` | Create content (doctor/admin) |
| PATCH | `/api/content/:id/verify` | Verify + set trust score (admin) |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors?specialization=&state=` | List verified doctors |
| PATCH | `/api/doctors/:id/verify` | Verify doctor (admin) |
| PATCH | `/api/doctors/profile` | Update doctor profile |

## Roles
- `patient` — default, can check symptoms, join groups, post
- `doctor` — can verify posts, review symptom checks, create content
- `admin` — full access, verifies doctors, manages hospitals/groups

## Language Support
Set `language: "hausa"` or `language: "english"` on requests. AI responds in the user's language.
