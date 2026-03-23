# Code Review Guidelines

## Must Check
- API endpoints have proper error handling and return correct HTTP status codes
- Database operations use try/catch and handle connection failures gracefully
- No hardcoded secrets, API keys, or credentials in the code
- New routes/endpoints have corresponding test coverage
- Input validation on all user-facing endpoints (file uploads, form data)
- Authentication middleware is applied to protected routes

## Security
- File upload validation (type, size) is enforced
- No SQL/NoSQL injection vulnerabilities (user input not directly in queries)
- CORS configuration is appropriate
- JWT tokens are validated correctly

## Code Quality
- No console.log left in production code (use proper logging)
- Functions are reasonably sized and focused
- TypeScript types are properly defined (frontend)
- No unused imports or dead code

## Skip
- package-lock.json changes
- Auto-generated files
- .env.example (template only, no real secrets)
