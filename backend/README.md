# Internship & Placement System - Backend API

This directory contains the backend services for the Internship and Placement Engine. It provides a robust, role-based RESTful API designed to manage the entire application lifecycle—from internship/job creation to student applications, interviews, and final onboarding.

## 🚀 Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (using `pg` driver)
- **Authentication:** JSON Web Tokens (JWT)
- **File Uploads:** Multer (for resume handling)
- **Environment Management:** `dotenv`

## 🏗️ Architecture
The backend strictly follows a **Feature-Based Modular Architecture**. All business logic and routes are divided into feature-specific directories under `src/modules/`:

- `auth`: 3-role registration, login, and `/me` validation.
- `students`: Profile CRUD, resume upload, dashboard statistics.
- `companies`: Profile CRUD, management of owned listings and applicants.
- `internships`: Public browsing, company CRUD, student application handling.
- `jobs`: Full-time equivalent of the internships module.
- `applications`: Application lifecycle management and status tracking.
- `interviews`: Scheduling, listing, and updates by application.
- `offers`: Issuance, acceptance, rejection, and cascading status updates.
- `onboarding`: Initiation (post-offer acceptance), tracking, and updates.
- `coordinators`: System-level oversight, student/company management, and reporting.

## 🔐 Security & Middleware
- **`authMiddleware.js`**: Verifies the JWT sent in the `Authorization` header.
- **`roleGuard`**: A middleware factory that restricts endpoints to specific user roles (e.g., `roleGuard(['coordinator', 'company'])`).
- **`errorHandler.js`**: Centralized error interceptor ensuring all API errors return a uniform JSON format, preventing sensitive stack traces in production.

## 🛠️ Setup & Installation

**1. Database Initialization**
Ensure you have a PostgreSQL server running locally or externally.
```bash
# Create a local development database
createdb internship_job_db

# Run the schema definition script
psql -d internship_job_db -f schema.sql
```

**2. Environment Configuration**
Create a `.env` file in the root of the `backend/` directory:
```env
PORT=5001
DATABASE_URL=postgres://user:password@localhost:5432/internship_job_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

**3. Install Dependencies & Seed**
```bash
npm install

# Seed the database with the initial testing setup
npm run seed
```
> **Seed Details:** The seeder creates 1 Coordinator, 2 Companies, 2 Students, 2 Internships, and 2 Jobs. All passwords are set to `password123`.

**4. Start the Server**
```bash
# Development mode (Nodemon)
npm run dev

# Production
npm start
```
