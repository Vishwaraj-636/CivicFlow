# Quick Testing Guide

## System Status
✅ **Backend**: Running on http://localhost:3000
✅ **Frontend**: Running on http://localhost:5174

---

## Test Scenarios

### Scenario 1: Register & Login as Citizen

1. Open http://localhost:5174/register
2. Fill in:
   - Full Name: `John Citizen`
   - Email: `john@example.com`
   - Contact: `1234567890`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Create Account"
4. Should redirect to `/login`
5. Login with:
   - Email: `john@example.com`
   - Password: `password123`
6. Should see welcome message

✅ **Expected**: User logged in with role = "citizen"

---

### Scenario 2: Request Department Staff Role

1. Open http://localhost:5174/request-dept-staff
2. Fill in:
   - Full Name: `Jane Staff`
   - Email: `jane@example.com`
   - Contact: `9876543210`
   - Department: `Public Health`
   - Password: `password456`
   - Confirm Password: `password456`
3. Click "Submit Request"
4. Should show success message

✅ **Expected**: Request created with status = "pending"

---

### Scenario 3: Validation Tests

**Test 3a: Invalid Email**
1. Try to register with email: `invalidemail`
2. Should show error: "Please provide a valid email address"

**Test 3b: Invalid Contact**
1. Try to register with contact: `123` (not 10 digits)
2. Should show error: "Contact number must be 10 digits long"

**Test 3c: Short Password**
1. Try to register with password: `pass` (less than 6 chars)
2. Should show error: "Password must be at least 6 characters long"

**Test 3d: Short Name**
1. Try to register with fullname: `Jo` (less than 3 chars)
2. Should show error: "Full name must be at least 3 characters long"

**Test 3e: Password Mismatch**
1. Try to register with password: `password123` and confirm: `password456`
2. Should show error: "Passwords do not match"

✅ **Expected**: All validations working correctly

---

### Scenario 4: Duplicate User Prevention

1. Register user: `john@example.com`
2. Try to register again with same email
3. Should show error: "User already exists"

1. Register user with contact: `1234567890`
2. Try to register another user with same contact
3. Should show error: "User already exists"

✅ **Expected**: Duplicates prevented

---

### Scenario 5: Duplicate Request Prevention

1. Submit dept staff request with email: `jane@example.com`
2. Try to submit another request with same email
3. Should show error: "You already have a pending request for department staff role"

✅ **Expected**: Duplicate requests prevented

---

## API Testing (Using Postman/Curl)

### Test: Register Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "contact": "1234567890",
    "password": "password123",
    "fullname": "Test User"
  }'
```

### Test: Login Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test: Request Dept Staff
```bash
curl -X POST http://localhost:3000/api/request/dept-staff \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@example.com",
    "contact": "9876543210",
    "password": "password456",
    "fullname": "Staff User",
    "department": "Public Health"
  }'
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000/5173 already in use | Kill existing process or use different port |
| CORS errors | Check backend CORS settings (should allow localhost:5174) |
| MongoDB connection error | Verify MongoDB URI in .env file |
| "Cannot find module" errors | Run `npm install` in both backend and frontend |
| Frontend compilation error | Check for syntax errors in modified files |
| Validation not working | Ensure both backend and frontend validators are in sync |

---

## Next Steps

1. **Admin Panel** - Create dashboard for admins to approve/reject requests
2. **JWT Middleware** - Protect routes with authentication middleware
3. **Email Notifications** - Send confirmation emails for requests
4. **Dashboard** - Create user dashboard showing their information and status
5. **Password Reset** - Implement forgot password functionality
6. **Session Management** - Store JWT in secure HTTP-only cookies

---

## File Locations Quick Reference

| Component | Location |
|-----------|----------|
| User Model | `BACKEND/src/model/user.model.js` |
| Request Model | `BACKEND/src/model/deptStaffRequest.model.js` |
| Auth Controller | `BACKEND/src/controller/auth.controller.js` |
| Request Controller | `BACKEND/src/controller/deptStaffRequest.controller.js` |
| Auth Validator | `BACKEND/src/validator/auth.validator.js` |
| Request Validator | `BACKEND/src/validator/deptStaffRequest.validator.js` |
| Auth Routes | `BACKEND/src/routes/auth.routes.js` |
| Request Routes | `BACKEND/src/routes/request.routes.js` |
| Register Page | `FRONTEND/src/features/auth/pages/register.jsx` |
| Login Page | `FRONTEND/src/features/auth/pages/Login.jsx` |
| Request Page | `FRONTEND/src/features/auth/pages/DeptStaffRequest.jsx` |
| Auth API | `FRONTEND/src/features/auth/services/auth.api.js` |
| useAuth Hook | `FRONTEND/src/features/auth/hook/useAuth.js` |
| Routes | `FRONTEND/src/app/app.routes.jsx` |
