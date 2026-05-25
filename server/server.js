const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const socketUtil = require('./utils/socket');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketUtil.init(server);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading local uploads on frontend
}));

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins for flexible testing/deployment
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-business-id'],
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set static folder for local upload storage fallback
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import Route Files
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const teamRoutes = require('./routes/teamRoutes');
const leadRoutes = require('./routes/leadRoutes');
const crmRoutes = require('./routes/crmRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/subscriptions', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Codeitz CRM REST API is online and fully functional!',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
