const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codeitz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed default Super Admin user if empty
    const User = require('../models/User');
    const adminCount = await User.countDocuments({ role: 'Super Admin' });
    if (adminCount === 0) {
      console.log('Seeding default Super Admin user...');
      await User.create({
        name: 'Coditz Admin',
        email: 'admin@coditz.com',
        password: 'admincoditz123',
        role: 'Super Admin',
        isVerified: true,
        status: 'active'
      });
      console.log('Super Admin user seeded successfully!');
    }

    // Auto-seed default SaaS packages and coupon offers if empty
    const Package = require('../models/Package');
    const Offer = require('../models/Offer');

    const packageCount = await Package.countDocuments();
    if (packageCount === 0) {
      console.log('Seeding default SaaS pricing packages...');
      await Package.create([
        {
          name: 'Free Trial',
          price: 0,
          durationDays: 3,
          limitLeads: 100,
          description: 'Try all core features of Codeitz for 3 days.',
          features: ['100 Scraped Leads total', 'Real-time Scraper logs console', 'Invoices & Quote tools'],
          isPopular: false,
          isActive: true
        },
        {
          name: 'Monthly',
          price: 299,
          durationDays: 30,
          limitLeads: 1000,
          description: 'Best for growing teams and active freelancers.',
          features: ['1,000 Scraped Leads / month', 'Real-time Scraper logs console', 'Invoices & Quote tools'],
          isPopular: false,
          isActive: true
        },
        {
          name: '6 Month',
          price: 3000,
          durationDays: 180,
          limitLeads: 8000,
          description: 'Perfect for agencies running medium outbound workflows.',
          features: ['8,000 Scraped Leads / month', 'Custom theme workspace colors', 'Multi-Workspace switching'],
          isPopular: true,
          isActive: true
        },
        {
          name: 'Yearly',
          price: 5000,
          durationDays: 365,
          limitLeads: 999999,
          description: 'Ultimate package for unlimited maps crawling actions.',
          features: ['Unlimited Leads generation', 'Priority Puppeteer sandbox slots', 'Full White-label logo assets support'],
          isPopular: false,
          isActive: true
        }
      ]);
      console.log('SaaS packages seeded successfully!');
    }

    const offerCount = await Offer.countDocuments();
    if (offerCount === 0) {
      console.log('Seeding default launch promo code...');
      await Offer.create({
        code: 'WELCOME20',
        discountPercent: 20,
        description: 'Launch Discount - Get 20% off on all pricing packages!',
        isActive: true
      });
      console.log('Promo codes seeded successfully!');
    }

  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn('WARNING: The Express server is running without an active MongoDB connection.');
    console.warn('Please check your network connection, database credentials, or ensure your IP address is whitelisted (0.0.0.0/0) in MongoDB Atlas.');
  }
};

module.exports = connectDB;
