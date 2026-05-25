# Codeitz CRM 🚀

Codeitz CRM is a powerful, full-stack B2B SaaS platform designed to streamline Lead Generation, CRM pipeline management, quoting, invoicing, and team collaboration. With built-in web scraping, Google Places API integration, and bulk WhatsApp capabilities, it is built to help agencies, freelancers, and businesses close more deals.

## Features

- **Lead Scraping**: Dual-method scraping (Google Places API + Puppeteer browser automation).
- **CRM Kanban Board**: Visual drag-and-drop pipeline for managing lead stages.
- **Bulk WhatsApp Sender**: Personalised messaging with custom templates directly from the CRM.
- **Follow-up Calendar**: Stay on top of reminders, call logs, and upcoming meetings.
- **Quotes & Invoices**: Professional, GST-ready quotes and invoices with Razorpay integrations.
- **Multi-tenant / Workspaces**: Manage multiple businesses with role-based access control.

---

## 🛠 Prerequisites

Before deploying the application, make sure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Atlas or local instance)
- API Keys: Razorpay, Cloudinary, Google Places API, Gemini AI (optional).

---

## 💻 Local Setup & Deployment

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd codeitz
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**:
   In the `server` directory, create a `.env` file and populate it with the following keys:
   ```env
   # General Configuration
   PORT=5000
   NODE_ENV=development

   # Database Setup
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0...

   # Authentication Options
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=1h
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   JWT_REFRESH_EXPIRE=30d

   # Email Integration
   RESEND_API_KEY=your_resend_api_key
   FROM_EMAIL=onboarding@resend.dev
   FROM_NAME="Codlitz CRM"

   # Cloudinary Setup (Media Storage)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Razorpay Integration
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret

   # Google Places / AI
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Install Client Dependencies**:
   Open a new terminal, navigate to the `client` directory:
   ```bash
   cd client
   npm install
   ```

5. **Run the Application Locally**:
   - Start the backend server:
     ```bash
     cd server
     npm run dev
     ```
     The server will run on `http://localhost:5000`.
   
   - Start the frontend application:
     ```bash
     cd client
     npm run dev
     ```
     The client will be available at `http://localhost:5173`.

---

## 🌍 Vercel Deployment (Frontend)

Vercel is the recommended platform for deploying the React (Vite) frontend.

1. Create an account on [Vercel](https://vercel.com).
2. Install the Vercel CLI (optional) or link your GitHub repository.
3. In your Vercel Dashboard, create a **New Project** and select the `client` directory as your root directory.
4. Set the framework preset to **Vite**.
5. Build Settings (Vercel should auto-detect this, but just in case):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Add an environment variable in Vercel for your backend API URL if your frontend fetches it dynamically (e.g., `VITE_API_BASE_URL=https://your-backend-url.onrender.com`).
7. Click **Deploy**.

*Note: Since the frontend uses React Router, ensure that Vercel routes all requests to `index.html`. You can add a `vercel.json` in the `client` folder if necessary:*
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🚀 Backend Deployment (Render / Heroku)

For the Node.js/Express backend, platforms like [Render](https://render.com) or [Heroku](https://heroku.com) are recommended.

**Render Example:**
1. Connect your repository to Render and create a new **Web Service**.
2. Set the Root Directory to `server`.
3. Set the Environment to `Node`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Under **Environment Variables**, copy everything from your local `.env` file.
7. Deploy the service.

*(Important: If using Puppeteer for scraping, you might need to configure additional build packs or environment variables to install Chromium dependencies on your hosting provider.)*

---

## 👨‍💻 Support & Issues
If you face any issues during the deployment or setup, please check the logs or contact the developer via support@codeitz.com.
