# PetBhai Implementation Guide

## 🚀 What Has Been Implemented

This document outlines all the features that have been implemented and what still needs manual setup.

### ✅ Completed Features

#### 1. Testing Infrastructure

- **Jest Configuration** (`jest.config.cjs`)
- **Test Setup** (`jest.setup.ts`) with mocks for browser APIs
- **Sample Tests**:
  - `__tests__/components/ProductCard.test.tsx`
  - `__tests__/contexts/CartContext.test.tsx`
  - `__tests__/contexts/AuthContext.test.tsx`

**To run tests:**

```bash
npm test
# or for coverage
npm run test:coverage
```

#### 2. Form Validation

- **Zod Schemas** (`lib/validations.ts`) - 12 comprehensive validation schemas
- **Reusable Form Components** (`components/FormFields.tsx`)

**Usage:**

```tsx
import { loginSchema } from '@/lib/validations';
import { FormField, SubmitButton } from '@/components/FormFields';

// Validate form data
const result = loginSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

#### 3. Loading States & Skeletons

- **Skeleton Components** (`components/Skeletons.tsx`)
  - ProductCardSkeleton
  - ArticleCardSkeleton
  - VetCardSkeleton
  - AnimalCardSkeleton
  - PostSkeleton
  - Spinner
  - LoadingOverlay
  - ProfileSkeleton
  - DetailPageSkeleton

#### 4. Navigation & SEO

- **Breadcrumbs** (`components/Breadcrumb.tsx`) with schema.org markup
- **SEO Component** (`components/SEO.tsx`) with Open Graph, Twitter Cards, and structured data

#### 5. Product Features

- **Stock Status** (`components/StockBadge.tsx`)
- **Share Buttons** (`components/ShareButtons.tsx`)
- **Recently Viewed** (`contexts/RecentlyViewedContext.tsx`, `components/RecentlyViewedProducts.tsx`)

#### 6. Filter Hooks

- **URL-based Filters** (`hooks/useFilters.ts`)
  - useShopFilters
  - useBlogFilters
  - useAdoptionFilters

#### 7. Utility Hooks

- **General Utilities** (`hooks/useUtilities.ts`)
  - useAsync
  - useDebounce
  - useLocalStorage
  - useMediaQuery
  - useClickOutside
  - useCopyToClipboard
  - And more...

#### 8. Accessibility

- **Accessibility Components** (`components/Accessibility.tsx`)
  - SkipToContent
  - AccessibleButton
  - useFocusTrap
  - useAnnounce
  - AccessibleDialog
  - Tooltip

#### 9. Backend Middleware

- **Authentication** (`backend/src/middleware/auth.ts`)
  - JWT token generation/verification
  - requireAuth, optionalAuth, requireAdmin, requirePlusMember
- **Rate Limiting** (`backend/src/middleware/rateLimiter.ts`)
  - apiLimiter, authLimiter, aiLimiter, orderLimiter
- **Validation** (`backend/src/middleware/validation.ts`)
  - Zod-based request validation

#### 10. Enhanced Order Management

- Order status tracking
- Order history with status updates
- Cancel order functionality
- Admin order management endpoints

---

## 🔧 Manual Setup Required

### 1. Payment Gateway Integration

#### Option A: bKash Payment Gateway

```bash
# 1. Register at https://developer.bkash.com/
# 2. Get your sandbox/production credentials
# 3. Create backend route:
```

```typescript
// backend/src/routes/paymentRoutes.ts
import { Router } from 'express';

const router = Router();

// bKash payment initiation
router.post('/bkash/create', async (req, res) => {
  const { amount, orderId } = req.body;

  // TODO: Implement bKash API call
  // API Docs: https://developer.bkash.com/docs

  // 1. Get grant token
  // 2. Create payment
  // 3. Return payment URL
});

router.post('/bkash/execute', async (req, res) => {
  const { paymentID } = req.body;
  // Execute payment after user approval
});

export default router;
```

#### Option B: SSLCommerz

```bash
# 1. Register at https://developer.sslcommerz.com/
# 2. Install: npm install sslcommerz-lts
```

```typescript
// backend/src/routes/paymentRoutes.ts
import SSLCommerz from 'sslcommerz-lts';

const sslcz = new SSLCommerz(STORE_ID, STORE_PASSWORD, IS_LIVE);

router.post('/sslcommerz/init', async (req, res) => {
  const data = {
    total_amount: req.body.amount,
    currency: 'BDT',
    tran_id: req.body.orderId,
    success_url: `${FRONTEND_URL}/payment/success`,
    fail_url: `${FRONTEND_URL}/payment/fail`,
    cancel_url: `${FRONTEND_URL}/payment/cancel`,
    // ... other required fields
  };

  const response = await sslcz.init(data);
  res.json({ gatewayUrl: response.GatewayPageURL });
});
```

### 2. Email Service Setup

#### Using SendGrid

```bash
npm install @sendgrid/mail
```

```typescript
// backend/src/services/emailService.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendEmail = async (to: string, subject: string, html: string) => {
  await sgMail.send({
    to,
    from: 'noreply@petbhai.com',
    subject,
    html,
  });
};

// Email templates
export const sendOrderConfirmation = async (email: string, order: Order) => {
  const html = `
    <h1>Order Confirmed!</h1>
    <p>Thank you for your order #${order.orderId}</p>
    <!-- Add more details -->
  `;
  await sendEmail(email, 'Order Confirmation - PetBhai', html);
};
```

### 3. SMS Notifications

#### Using Twilio (or local provider like SSL Wireless)

```bash
npm install twilio
```

```typescript
// backend/src/services/smsService.ts
import twilio from 'twilio';

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

export const sendSMS = async (to: string, message: string) => {
  await client.messages.create({
    body: message,
    from: TWILIO_PHONE,
    to,
  });
};
```

### 4. Database Setup

#### MongoDB Option

```bash
npm install mongoose
```

```typescript
// backend/src/db/mongoose.ts
import mongoose from 'mongoose';

export const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('MongoDB connected');
};

// User Schema example
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    isPlusMember: { type: Boolean, default: false },
    wishlist: [{ type: mongoose.Types.ObjectId, ref: 'Product' }],
    orderHistory: [{ type: mongoose.Types.ObjectId, ref: 'Order' }],
  },
  { timestamps: true }
);
```

#### PostgreSQL Option (with Prisma)

```bash
npm install prisma @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  name        String
  password    String
  isPlusMember Boolean @default(false)
  orders      Order[]
  createdAt   DateTime @default(now())
}

model Order {
  id          Int      @id @default(autoincrement())
  orderId     String   @unique
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  total       Float
  status      String   @default("pending")
  items       Json
  createdAt   DateTime @default(now())
}
```

### 5. Image Upload (Cloudinary)

```bash
npm install cloudinary multer
```

```typescript
// backend/src/services/uploadService.ts
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file: Express.Multer.File) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'petbhai',
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  });
  return result.secure_url;
};
```

### 6. Analytics Setup

#### Google Analytics 4

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

```typescript
// services/analytics.ts
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Usage
trackEvent('add_to_cart', { item_id: product.id, item_name: product.name });
trackEvent('purchase', { transaction_id: order.orderId, value: order.total });
```

### 7. Push Notifications (Firebase)

```bash
npm install firebase
```

```typescript
// services/pushNotifications.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
    // Send token to your server
    return token;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
```

---

## 📦 Environment Variables

Create a `.env` file with:

```env
# Frontend (.env.local)
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain

# Backend (.env)
PORT=5000
JWT_SECRET=your_super_secret_key_change_in_production
MONGODB_URI=mongodb://localhost:27017/petbhai
GEMINI_API_KEY=your_gemini_key

# Payment
BKASH_APP_KEY=your_key
BKASH_APP_SECRET=your_secret
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_password

# Email
SENDGRID_API_KEY=your_key

# SMS
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=your_phone

# Upload
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## 🏃 Running the Project

```bash
# Install dependencies
npm install
cd backend && npm install

# Start development
npm run dev           # Frontend (port 3000)
cd backend && npm run dev  # Backend (port 5000)

# Build for production
npm run build
cd backend && npm run build

# Run tests
npm test
npm run test:coverage
```

---

## 📝 Next Steps

1. **Choose and integrate a database** (MongoDB or PostgreSQL)
2. **Set up payment gateway** (bKash or SSLCommerz)
3. **Configure email service** for order notifications
4. **Set up image hosting** (Cloudinary)
5. **Add analytics** for tracking user behavior
6. **Deploy backend** (Vercel, Railway, or Render)
7. **Set up CI/CD** for automated testing and deployment

---

## 📚 Additional Resources

- [bKash Developer Docs](https://developer.bkash.com/)
- [SSLCommerz Docs](https://developer.sslcommerz.com/)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Firebase Docs](https://firebase.google.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
