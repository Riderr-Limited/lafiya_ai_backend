# LafiyaAI API Reference

**Base URL:** `http://localhost:5000`  
**Auth:** All protected routes require `Authorization: Bearer <token>` header  
**Content-Type:** `application/json`

---

## Seed / Test Credentials

Run `npm run seed` to populate the database, then use these credentials:

| Role    | Phone        | Password     |
|---------|--------------|--------------|
| Patient | 08012345678  | password123  |
| Doctor  | 08077777777  | doctor123    |
| Admin   | 08099999999  | admin123     |

---

## AUTH

### POST `/api/auth/register`
Register a new user.
```json
{
  "name": "Aminu Musa",
  "phone": "08012345678",
  "password": "password123",
  "role": "patient",
  "language": "hausa"
}
```
`role` → `patient` | `doctor` | `admin`  
`language` → `hausa` | `english`

**Response 201:**
```json
{
  "token": "<jwt>",
  "user": { "id": "", "name": "", "phone": "", "role": "", "language": "" }
}
```

---

### POST `/api/auth/login`
```json
{
  "phone": "08012345678",
  "password": "password123"
}
```
**Response 200:**
```json
{
  "token": "<jwt>",
  "user": { "id": "", "name": "", "phone": "", "role": "", "language": "" }
}
```

---

### GET `/api/auth/me`
🔒 Auth required  
Returns the current logged-in user.

**Response 200:**
```json
{ "user": { "_id": "", "name": "", "phone": "", "role": "", "language": "" } }
```

---

### PATCH `/api/auth/me`
🔒 Auth required  
Update own profile. Allowed fields: `name`, `language`, `location`, `email`
```json
{
  "name": "Updated Name",
  "language": "english",
  "email": "user@example.com",
  "location": { "state": "Kano", "lga": "Nassarawa" }
}
```

---

## SYMPTOMS

### POST `/api/symptoms/check`
🔒 Auth required  
Run AI symptom analysis.
```json
{
  "symptoms": ["fever", "headache", "fatigue"],
  "language": "english",
  "patientAge": 30,
  "patientGender": "male",
  "isPregnant": false
}
```
`patientGender` → `male` | `female`

**Response 201:**
```json
{
  "check": {
    "_id": "",
    "symptoms": ["fever", "headache"],
    "aiResponse": {
      "summary": "",
      "riskLevel": "medium",
      "recommendations": [],
      "nextSteps": [],
      "escalate": false
    }
  }
}
```
`riskLevel` → `low` | `medium` | `high` | `emergency`

---

### GET `/api/symptoms/history`
🔒 Auth required  
Returns last 20 symptom checks for the logged-in user.

**Response 200:**
```json
{ "checks": [ { "_id": "", "symptoms": [], "aiResponse": {}, "createdAt": "" } ] }
```

---

### PATCH `/api/symptoms/:id/review`
🔒 Doctor or Admin only  
Doctor adds review notes to a symptom check.
```json
{ "notes": "Likely malaria, please get tested at a clinic." }
```

---

## COMMUNITY

### GET `/api/community/groups`
🔒 Auth required  
List all active groups.

**Response 200:**
```json
{ "groups": [ { "_id": "", "name": "", "category": "", "description": "", "moderators": [] } ] }
```
`category` → `maternal_health` | `diabetes` | `chronic_illness` | `general` | `mental_health`

---

### POST `/api/community/groups`
🔒 Admin only  
Create a new group.
```json
{
  "name": "Maternal Health Kano",
  "nameHausa": "Lafiyar Mata Kano",
  "category": "maternal_health",
  "description": "Support group for mothers in Kano"
}
```

---

### POST `/api/community/groups/:id/join`
🔒 Auth required  
Join a group. No body required.

**Response 200:**
```json
{ "message": "Joined group", "memberCount": 5 }
```

---

### GET `/api/community/groups/:id/posts`
🔒 Auth required  
Get posts in a group (excludes flagged misinformation).

**Response 200:**
```json
{ "posts": [ { "_id": "", "content": "", "author": {}, "doctorVerified": false, "replies": [] } ] }
```

---

### POST `/api/community/groups/:id/posts`
🔒 Auth required  
Create a post. AI automatically checks for misinformation.
```json
{
  "content": "Drinking clean water prevents cholera.",
  "language": "english",
  "type": "info"
}
```
`type` → `question` | `story` | `info` | `alert`

**Response 201:**
```json
{
  "post": { "_id": "", "content": "", "isMisinformation": false },
  "misinfoCheck": { "isMisinformation": false, "reason": "", "confidence": 5 }
}
```

---

### POST `/api/community/posts/:id/reply`
🔒 Auth required  
Reply to a post.
```json
{ "content": "This is correct advice." }
```

---

### PATCH `/api/community/posts/:id/verify`
🔒 Doctor or Admin only  
Mark a post as doctor-verified. No body required.

**Response 200:**
```json
{ "post": { "_id": "", "doctorVerified": true } }
```

---

### PATCH `/api/community/posts/:id/flag`
🔒 Auth required  
Flag a post as suspicious. No body required.

**Response 200:**
```json
{ "flagCount": 1 }
```

---

## HOSPITALS

### GET `/api/hospitals`
🔒 Auth required  
Find hospitals. All query params are optional.

| Query Param | Type    | Example       | Description              |
|-------------|---------|---------------|--------------------------|
| `lat`       | number  | `12.0022`     | Latitude for geo search  |
| `lng`       | number  | `8.5167`      | Longitude for geo search |
| `radius`    | number  | `10000`       | Radius in meters (default 10000) |
| `type`      | string  | `tertiary`    | `primary` \| `secondary` \| `tertiary` \| `clinic` \| `pharmacy` |
| `emergency` | boolean | `true`        | Filter by emergency availability |

**Response 200:**
```json
{ "hospitals": [ { "_id": "", "name": "", "type": "", "address": "", "hasEmergency": true, "location": {} } ] }
```

---

### GET `/api/hospitals/:id`
🔒 Auth required  
Get a single hospital by ID.

---

### POST `/api/hospitals`
🔒 Admin only  
Add a new hospital.
```json
{
  "name": "Aminu Kano Teaching Hospital",
  "type": "tertiary",
  "address": "Zaria Road, Kano",
  "state": "Kano",
  "lga": "Nassarawa",
  "phone": ["064123456"],
  "hasEmergency": true,
  "isVerified": true,
  "location": { "type": "Point", "coordinates": [8.5167, 12.0022] },
  "services": ["emergency", "maternity", "surgery"]
}
```
⚠️ `coordinates` format is `[longitude, latitude]`

---

## HEALTH CONTENT

### GET `/api/content`
🔒 Auth required  
List verified & published content.

| Query Param | Example          |
|-------------|------------------|
| `category`  | `maternal_health` |
| `page`      | `1`              |

`category` → `maternal_health` | `diabetes` | `nutrition` | `hygiene` | `mental_health` | `general`

---

### GET `/api/content/:id`
🔒 Auth required  
Get content by ID. Increments view count.

---

### POST `/api/content`
🔒 Doctor or Admin only  
Create health content.
```json
{
  "title": "Preventing Malaria",
  "titleHausa": "Hanyoyin Kare Zazzabin Cizon Sauro",
  "body": "Use insecticide-treated nets and eliminate standing water.",
  "bodyHausa": "Yi amfani da sauro mai maganin kwari...",
  "category": "general",
  "language": "english",
  "tags": ["malaria", "prevention"]
}
```

---

### PATCH `/api/content/:id/verify`
🔒 Admin only  
Verify content and set trust score.
```json
{ "trustScore": 90 }
```
`trustScore` → 0–100

---

## DOCTORS

### GET `/api/doctors`
🔒 Auth required  
List verified doctors.

| Query Param      | Example    |
|------------------|------------|
| `specialization` | `general`  |
| `state`          | `Kano`     |

---

### PATCH `/api/doctors/:id/verify`
🔒 Admin only  
Verify a doctor account. No body required.

---

### PATCH `/api/doctors/profile`
🔒 Doctor only  
Update doctor's own profile.
```json
{
  "specialization": "general",
  "licenseNumber": "MDCN-12345",
  "hospital": "<hospital_id>"
}
```

---

## Error Responses

| Status | Meaning                        |
|--------|--------------------------------|
| 400    | Bad request / validation error |
| 401    | Missing or invalid token       |
| 403    | Insufficient role/permissions  |
| 404    | Resource not found             |
| 500    | Internal server error          |

All errors return: `{ "message": "description" }`
