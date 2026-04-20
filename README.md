# CreditX — Multi-Stage Form Platform

A full-stack application implementing a 5-stage form workflow with JWT authentication, refresh-token rotation, multipart document uploads, and paginated form listing.

- **Frontend:** React 19 · Vite · TanStack Router · TanStack Form · Zustand · Tailwind CSS · Zod
- **Backend:** NestJS 10 · Mongoose · Passport-free JWT · class-validator · Multer · Swagger

---

## Repository layout

```
shivani/
├── client/creditx/      # React SPA (Vite)
├── server/              # NestJS API
└── README.md            # ← you are here
```

---

## Prerequisites

| Tool     | Version             |
| -------- | ------------------- |
| Node.js  | **≥ 20.x**          |
| npm      | ≥ 10.x              |
| MongoDB  | local ≥ 6.x, or Atlas |

Vite 8 and NestJS 10 both require Node ≥ 20.

---

## 1 · Backend setup

```bash
cd server
npm install
cp .env.example .env       # fill in MONGO_URI and JWT_SECRET
npm run start:dev          # http://localhost:5001
```

### Environment variables

```env
PORT=5001
NODE_ENV=development

MONGO_URI=mongodb://127.0.0.1:27017/creditx

JWT_SECRET=<long random string>
JWT_ACCESS_EXPIRES_IN=60s
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Runtime URLs

| Resource     | URL                                  |
| ------------ | ------------------------------------ |
| API base     | `http://localhost:5001/api/v1`       |
| Swagger docs | `http://localhost:5001/api/docs`     |
| Uploads      | `http://localhost:5001/uploads/...`  |

---

## 2 · Frontend setup

```bash
cd client/creditx
npm install
cp .env.example .env       # points at the backend
npm run dev                # http://localhost:5173
```

`.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

---

## 3 · Feature map → Requirement checklist

### Authentication (JWT)

| Spec                                   | Implementation                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Access token — short lived (1 min)     | `JWT_ACCESS_EXPIRES_IN=60s` in `.env`; applied in `auth.module.ts`                                                                           |
| Refresh token — long lived (7 d)       | `JWT_REFRESH_EXPIRES_IN=7d`; set as HTTP-only cookie on login and refresh                                                                    |
| `POST /auth/refresh` endpoint          | `auth.controller.ts#refresh`                                                                                                                 |
| Automatic regen on expiry              | `apiClient.js` response interceptor — single-flight `refreshAccessToken()` triggered on 401, retries the original request                   |
| Dual auth: Bearer + HTTP-only cookie   | `jwt-auth.guard.ts#extractToken` — reads `Authorization: Bearer …` first, falls back to `cookies.accessToken`                               |
| Secure token storage                   | Access + refresh tokens both set as `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'` cookies                        |
| Token validation middleware/guard      | `JwtAuthGuard` applied to `/forms/*` and `/auth/logout` via `@UseGuards()`                                                                   |
| Refresh-token **rotation**             | `auth.service.ts#refresh` re-signs both tokens, hashes the new refresh token, stores the hash, and `auth.controller.ts` sets both new cookies |
| Logout + refresh-token invalidation    | `POST /auth/logout` clears `user.refreshToken` in DB and removes both cookies                                                                |

### Multi-stage form

| Spec                             | Implementation                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ≥ 5 stages                       | 1 Basic Info · 2 Address · 3 Professional · 4 Documents · 5 Review                                                                |
| Each stage has its own endpoint  | `POST /forms/stage-1` … `POST /forms/stage-5`                                                                                     |
| All endpoints accept multipart   | `@UseInterceptors(AnyFilesInterceptor())` on stages 1-3 & 5, `FilesInterceptor('documents', 5)` on stage 4                        |
| Independent persistence          | Each handler updates only its sub-document (`basicInfo`, `addressDetails`, …) and advances `currentStage`                         |
| Stage continuity / resume        | `GET /forms/resume` returns `{ hasActiveForm, formId, currentStage, currentStageLabel, completionPercent }`                       |
| ≥ 2 file uploads on docs stage   | `multer.config.ts#MIN_FILE_COUNT = 2`, max 5, 10 MB each, PDF/JPEG/PNG/DOC/DOCX                                                    |
| **Frontend** validation          | Zod schemas in `src/schema/form.schema.js` wired through TanStack Form `validators: { onBlur, onSubmit }`                         |
| **Backend** validation           | `class-validator` DTOs per stage + global `ValidationPipe({ whitelist, transform })` in `main.ts`                                  |

### Form listing

| Spec                 | Implementation                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| List in-progress/done | `GET /forms` returns every form owned by the caller                                                              |
| Shows current stage  | `currentStage` + virtual `currentStageLabel`                                                                     |
| Shows status         | `status ∈ { in-progress, completed }`                                                                             |
| **Backend** pagination | `page`, `limit` (max 50) — returns `{ data, meta: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }` |
| Filtering            | `status`, `stage`, `search` (regex on name/email), `sortBy`, `sortOrder`                                         |

---

## 4 · API reference

Full, interactive Swagger UI → **`http://localhost:5001/api/docs`**

### Auth

| Method | Path              | Body                                    | Auth   | Description                                           |
| ------ | ----------------- | --------------------------------------- | ------ | ----------------------------------------------------- |
| POST   | `/auth/register`  | `{ firstName, lastName, email, password }` | none   | Create a user                                         |
| POST   | `/auth/login`     | `{ email, password }`                    | none   | Returns `accessToken` in body; sets both tokens as cookies |
| POST   | `/auth/refresh`   | —                                       | cookie | Rotates both tokens, returns new `accessToken`        |
| POST   | `/auth/logout`    | —                                       | bearer | Clears cookies + DB refresh-token hash                |

### Forms  (all require auth)

| Method | Path                              | Content-type        | Description                                     |
| ------ | --------------------------------- | ------------------- | ----------------------------------------------- |
| GET    | `/forms/resume`                   | —                   | Where to resume the wizard                      |
| GET    | `/forms`                          | —                   | Paginated list (`page, limit, status, stage, search, sortBy, sortOrder`) |
| GET    | `/forms/:id`                      | —                   | Full single form                                |
| POST   | `/forms/stage-1`                  | multipart/form-data | Basic info — `fullName, email, phone, dateOfBirth?, gender?` |
| POST   | `/forms/stage-2`                  | multipart/form-data | Address — `street, addressLine2?, city, state, postalCode, country` |
| POST   | `/forms/stage-3`                  | multipart/form-data | Professional — `companyName, jobTitle, yearsOfExperience, skills[], linkedinUrl?, bio?` |
| POST   | `/forms/stage-4`                  | multipart/form-data | Documents — `documents[2..5]` (PDF/JPEG/PNG/DOC/DOCX, ≤ 10 MB each), `notes?` |
| POST   | `/forms/stage-5`                  | multipart/form-data | `reviewNotes?` — validates all prior stages then marks `completed` |
| DELETE | `/forms/:id/documents/:index`     | —                   | Remove a single uploaded file                   |

### Example response envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [ /* forms */ ],
  "meta": {
    "total": 23, "page": 1, "limit": 10, "totalPages": 3,
    "hasNextPage": true, "hasPrevPage": false
  }
}
```

---

## 5 · Frontend architecture

```
client/creditx/src/
├── api/forms.api.js          # Forms API client (multipart helper, list, resume)
├── auth/auth.js              # Session / refresh guards for TanStack Router
├── components/
│   ├── Stepper.jsx
│   ├── auth/{AuthLayout, IconInput, PasswordInput}.jsx
│   └── form/FormField.jsx    # TextField / NumberField / SelectField / TextAreaField
├── pages/
│   ├── Login.jsx · Register.jsx
│   ├── Dashboard.jsx         # stats, resume banner, recent forms, quick actions
│   ├── MultiSelectStepsForm.jsx  # wizard shell — hydrates stageData from server
│   ├── FormList.jsx          # table (≥ md) + card list (< md), filters, drawer
│   └── form/Stage1–5.jsx     # individual stage components
├── schema/form.schema.js     # Zod schemas (mirror backend DTOs)
├── store/formStore.js        # Zustand + persist — formId, stageData, hydrate helpers
└── router.jsx                # Route tree with requireAuth / requireGuest guards
```

### Zustand form store

- `stageData` holds working values for every stage.
- `hydrateStagesFromForm(serverForm)` mirrors the server document back into the store when resuming.
- `persist` middleware saves the draft under `creditx-form-draft` so in-progress typing survives reloads.

### TanStack Form

Every stage uses `useForm({ validators: { onSubmit: zodValidator(schema), onBlur: zodValidator(schema) } })`. `zodValidator` turns Zod issues into the `{ fields }` shape TanStack Form expects and routes each message to the right field error.

### Refresh flow on the client

`apiClient.js` is a single Axios instance with:

1. Request interceptor — attach `Authorization: Bearer <accessToken>`.
2. Single-flight `refreshAccessToken()` — calls `/auth/refresh` with raw Axios (bypassing the response interceptor to avoid recursion).
3. Response interceptor — on 401 for any non-auth endpoint, run refresh and retry the original request once.
4. Concurrent 401s share the same refresh promise, so only one refresh ever runs at a time.

---

## 6 · Security notes

- **HTTP-only cookies** for both tokens — no JS access, so XSS cannot exfiltrate them.
- **SameSite=lax** — prevents CSRF for state-changing POSTs from cross-site contexts.
- **secure flag** auto-enables when `NODE_ENV=production`.
- **Refresh-token rotation** — every refresh invalidates the previous refresh token's DB hash, so token replay is caught on the next call.
- **Global `ValidationPipe({ whitelist: true, transform: true })`** strips unknown keys before the controller sees the payload.
- **`withCredentials: true`** on the frontend so the refresh cookie is sent on every request, plus a matching CORS origin + `credentials: true` on the server.
- **Bcrypt** (salt 10) for password hashes AND for the refresh-token DB hash.

---

## 7 · Running the full stack

Terminal 1:

```bash
cd server && npm run start:dev
```

Terminal 2:

```bash
cd client/creditx && npm run dev
```

Open `http://localhost:5173`.

Verify in Swagger: `http://localhost:5001/api/docs`.
