# Search Leads Backend

## Dependencies

- Prisma
- Supabase
- Node.js
- TypeScript
- Express

## How to run

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. test the API using Postman or any other API testing tool by hitting the endpoint `http://localhost:5050/health`

## API Endpoints

### User

- GET `/health` - Check if the API is running
- POST `/api/user/register` - Register a new user
- GET `/api/user/getUser` - Get a user's details 
- POST `/api/user/addCredits` - add Credits to a user's account
- GET `/api/user/getCredits` - Get a user's credits
- POST `/api/user/searchlead` - search for leads
- GET `/api/user/getCostPerLead` - Get cost per leads