# HMS Express Backend

This is the backend service for the Hostel Management System (HMS), acting as the central authorization and business logic layer.

## Architecture
- **Framework**: Express.js (Node.js)
- **Database**: Supabase PostgreSQL
- **Validation**: Zod
- **Security**: Helmet, CORS, custom RBAC middleware

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in the Supabase details.

3. Start development server:
   ```bash
   npm run dev
   ```

## Testing
Run tests using Vitest:
```bash
npm test
```

## Authentication & RBAC Flow
1. Frontend obtains a JWT from Supabase Auth.
2. Frontend sends requests with `Authorization: Bearer <token>`.
3. Backend (`requireAuth`) securely verifies the JWT via Supabase Auth.
4. Backend fetches the user's role from the `profiles` table using the verified `user.id`.
5. The `req.user` object is populated.
6. The `requireRole('warden')` middleware enforces business restrictions.
7. Any operations involving `student_id` ALWAYS use the verified `req.user.id`, never trusting frontend-provided IDs for authorization.
