# CivicFlow Backend API Documentation

## 1. Overview

CivicFlow is a backend service designed to power a civic engagement platform. It enables citizens to report local issues (e.g., potholes, broken streetlights), which can then be tracked, managed, and resolved by municipal departments. The system is built to be scalable, secure, and transparent, providing a clear audit trail for every reported issue.

## 2. Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM (Object Data Modeling):** Mongoose
- **Authentication:** bcrypt for password hashing
- **Environment Variables:** dotenv

## 3. Project Structure

The backend codebase is organized for clarity and scalability:

```
backend/
├── src/
│   ├── config/
│   │   └── database.js   # Manages MongoDB connection
│   ├── models/
│   │   ├── User.js         # User schema and logic
│   │   ├── Complaint.js    # Complaint schema
│   │   ├── ... (other models)
│   │   └── index.js        # Central exporter for all models
│   ├── controllers/      # (To be created) Request/response handlers
│   ├── routes/           # (To be created) API route definitions
│   ├── services/         # (To be created) Business logic
│   └── middleware/       # (To be created) Express middleware (e.g., auth)
├── .env                  # Environment variables (not committed)
├── server.js             # Main server entry point
└── app.js                # Express application setup and middleware
```

## 4. Data Models (Schemas)

The core of the application is its data structure, defined using Mongoose schemas.

### `User`
- **Purpose:** Manages user accounts and authentication.
- **Key Fields:** `username`, `email` (unique), `password`, `role`.
- **Security:**
  - Passwords are automatically hashed using `bcrypt` before being saved to the database.
  - A `comparePassword` method is provided for secure login verification.
- **Roles:** `user`, `admin`, `official`, `moderator` to support different permission levels.

### `Complaint`
- **Purpose:** The central entity representing a civic issue reported by a user.
- **Key Fields:** `title`, `category`, `status`, `priority`, `userId` (reporter), `assignedDept`.
- **Geolocation:**
  - The `location` field uses a GeoJSON `Point` type with a `2dsphere` index. This is a powerful feature that enables efficient geospatial queries, such as finding all complaints within a certain radius.
- **Status Flow:** `pending` -> `reviewing` -> `in_progress` -> `resolved` / `rejected`.

### `Department`
- **Purpose:** Represents municipal departments (e.g., "Public Works", "Sanitation") that are assigned to handle complaints.

### `Comment`
- **Purpose:** Allows for threaded discussions on a specific complaint, linking a `User` and a `Complaint`.

### `ActivityLog`
- **Purpose:** Provides a complete audit trail for a complaint. It logs every significant action, such as status changes, creating a history of the complaint's lifecycle.

### `Notification`
- **Purpose:** A system to inform users about important events, such as updates to their submitted complaints.

### `Media`
- **Purpose:** Allows users to attach media files (images, videos) to a complaint by storing the file's URL.

### `AiPrediction`
- **Purpose:** A forward-looking model for integrating AI. It can store results from an AI analysis of a complaint, such as automatic categorization, priority scoring, or sentiment analysis.

## 5. Setup and Installation

To run the server locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd CivicFlow/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create Environment File:**
    Create a `.env` file in the `backend` directory and add the following variables:
    ```
    MONGO_URI=<your_mongodb_connection_string>
    PORT=8000
    ADMIN_REGISTRATION_CODE=<secure_admin_invite_code>
    ```

  4.  **Department Codes:** Store a short memorable code for each department, such as `23BCE1000`, in the department record. Officials register with that code, and the backend uses it to assign the `official` role automatically.

5.  **Registration Flow:** Citizens register with username, email, phone, and password only. Officials add the department access code on the same form. Admin accounts should be created with the protected admin invite code rather than exposing a role selector on the public form.

  6.  **Start the Server:**
    ```bash
    npm start
    ```
    The server will connect to the database and start listening on the specified port.

## 6. Next Steps

The current foundation is solid. The immediate next steps involve building out the API layer:

1.  **Implement Authentication:** Create routes and controllers for user registration (`/api/auth/register`) and login (`/api/auth/login`).
2.  **Develop CRUD Endpoints:** Build the API routes and controllers for managing complaints, comments, and other resources.
3.  **Create Protective Middleware:** Implement middleware to secure routes, ensuring only authenticated and authorized users can perform certain actions.