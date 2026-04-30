# Attendance Management System (MERN)

A premium, full-stack Attendance Management System that tracks employee attendance using location and live photo verification. Designed with a modern glassmorphic UI, role-based access control, and comprehensive reporting.

## Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS, Lucide React
- **State Management:** Redux Toolkit + RTK Query
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Logging:** Morgan
- **Security:** JWT (JSON Web Tokens), Bcryptjs, HTTP-only Cookies

## Features

### Role-Based Access Control (RBAC)
- **Employee:** Can punch in/out, view personal history, and request overtime.
- **Manager:** Can view team attendance, approve/reject overtime, and verify team selfies.
- **Admin:** Full system-wide visibility and management capabilities.

### Attendance Flow
- **Live Selfie:** Captured directly from the webcam (no file uploads permitted).
- **Geolocation:** Captures latitude and longitude for every punch action.
- **Auto-Calculations:** Calculates working hours and classifies shifts as "Completed" (≥ 8h) or "Incomplete".

### Dashboards & Analytics
- **Visual Analytics:** Weekly hour charts and team presence metrics.
- **OT Workflow:** End-to-end overtime request and approval system.
- **Verification:** Admin/Manager portal to verify photo authenticity and mark attendance as valid/invalid.

### Reporting
- **Export Formats:** Generate and download reports in **CSV** and **PDF**.
- **Filtering:** Filter records by date range and user.

## Architecture Overview
The project follows a modular structure with a clear separation of concerns:
- **Backend:** MVC-like pattern with `controllers`, `models`, `routes`, and `middlewares`.
- **Frontend:** Feature-based structure (`features/auth`, `features/attendance`, etc.) using Redux for global state and RTK Query for efficient API communication.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on the provided configuration:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret
   CORS_ORIGIN=http://localhost:5173
   ```
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```
4. Start the development server: `npm run dev`

## Assumptions Made
1. **Camera/GPS:** The system assumes the user grants browser permissions for camera and location access.
2. **Standard Shift:** A standard working shift is fixed at 8 hours for completion status.
3. **Storage:** Selfie images are currently stored as Base64 strings in MongoDB for simplicity (production would typically use S3/Cloudinary).
