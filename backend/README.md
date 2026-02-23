# PetBhai Backend API

This is the backend API server for PetBhai, built with Express.js and TypeScript.

## Project Structure

The backend is a separate Node.js project with its own dependencies and build configuration. It's designed to work alongside the frontend React application but can be run independently.

```
backend/
├── src/
│   ├── data/           # Mock data for development
│   ├── routes/         # API route handlers
│   ├── db.ts          # In-memory database
│   ├── index.ts       # Express app entry point
│   └── types.ts       # TypeScript type definitions
├── package.json       # Backend dependencies
└── tsconfig.json      # TypeScript configuration
```

## Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend` directory (optional for development):

```
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
ADMIN_EMAILS=petbhaibd@gmail.com
```

### Admin Access Control

- `ADMIN_EMAILS` is a comma-separated allowlist of emails that receive `admin` role automatically.
- Default allowlist is `petbhaibd@gmail.com` when `ADMIN_EMAILS` is not set.
- Role is re-synced on every login/social-login, so non-allowlisted emails are downgraded to `customer`.
- Always set a strong `JWT_SECRET` in production (minimum 32 characters).

## Development

Run the development server with hot-reloading:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript.

## Smoke Test (Pet Management)

Run a quick end-to-end API smoke test for secured pet/reminder endpoints:

```bash
npm run smoke:pet
```

Optional target override:

```bash
SMOKE_BASE_URL=http://localhost:5000/api npm run smoke:pet
```

## Smoke Test (Admin Order Status)

Run authorization and payload-hardening checks for admin order status updates:

```bash
npm run smoke:admin-order
```

Optional overrides:

```bash
SMOKE_BASE_URL=http://localhost:5000/api ADMIN_SMOKE_EMAIL=petbhaibd@gmail.com npm run smoke:admin-order
```

## Smoke Test (Post Stream / Realtime)

Run a realtime stream check for `/api/posts/stream` to verify SSE connection and post-update events:

```bash
npm run smoke:post-stream
```

Optional target override:

```bash
SMOKE_BASE_URL=http://localhost:5000/api npm run smoke:post-stream
```

## Production

Run the production server:

```bash
npm start
```

Make sure to build the project first with `npm run build`.

## API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

### Articles

- `GET /api/articles` - Get all articles
- `GET /api/articles/:id` - Get article by ID

### Vets

- `GET /api/vets` - Get all veterinarians
- `GET /api/vets/:id` - Get vet by ID

### Animals

- `GET /api/animals` - Get all animals for adoption
- `GET /api/animals/:id` - Get animal by ID

### Brands

- `GET /api/brands` - Get all brands
- `GET /api/brands/:id` - Get brand by ID

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `PUT /api/auth/:id` - Update user profile
- `POST /api/auth/:id/wishlist` - Add to wishlist
- `DELETE /api/auth/:id/wishlist/:productId` - Remove from wishlist
- `POST /api/auth/:id/favorites` - Add animal to favorites
- `DELETE /api/auth/:id/favorites/:animalId` - Remove from favorites
- `POST /api/auth/:id/subscribe` - Subscribe to Plus membership

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/user/:userId` - Get user's order history

## Health Check

- `GET /api/health` - Check if the API is running

## Notes

- This backend uses an in-memory database for development. Data will be lost when the server restarts.
- For production, integrate with a real database (MongoDB, PostgreSQL, etc.)
- Add proper authentication with JWT tokens for production use
- Implement input validation and error handling
- Add rate limiting and security middleware

## CORS

The backend is configured to accept requests from any origin during development. Configure CORS properly for production.

## Next Steps

1. Set up a real database connection
2. Implement JWT authentication
3. Add input validation with libraries like Joi or express-validator
4. Add unit tests for API endpoints
5. Deploy to a hosting service (Render, Railway, Heroku, etc.)
