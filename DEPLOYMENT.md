# 🚀 Deployment Guide

## Overview
This guide will help you deploy the Mongolian Music Downloader application to:
- **Backend**: Railway
- **Frontend**: Vercel  
- **Database**: MongoDB Atlas

## 📋 Prerequisites
- GitHub account
- Railway account
- Vercel account
- MongoDB Atlas account

---

## 🗄️ MongoDB Atlas Setup

### 1. Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project
3. Build a new cluster (Free tier recommended)
4. Choose your preferred cloud provider and region

### 2. Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Set privileges to "Read and write to any database"

### 3. Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Add your IP address
4. For production: Click "Allow Access from Anywhere" (0.0.0.0/0)

### 4. Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `mongolian-music`

---

## 🔧 Backend Deployment (Railway)

### 1. Prepare Backend Code
1. Ensure your backend code is in a GitHub repository
2. Make sure `package.json` has the correct start script
3. Verify all dependencies are listed

### 2. Deploy to Railway
1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Set the root directory to `backend` (if your backend is in a subfolder)

### 3. Configure Environment Variables
In Railway dashboard, add these environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mongolian-music
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
PORT=4000
```

### 4. Deploy
1. Railway will automatically detect the Node.js project
2. It will install dependencies and start the server
3. Note the generated domain (e.g., `https://your-app.railway.app`)

---

## 🎨 Frontend Deployment (Vercel)

### 1. Prepare Frontend Code
1. Update all API calls to use environment variables
2. Create `.env.local` file for local development:

```env
REACT_APP_API_URL=http://localhost:4000
```

### 2. Deploy to Vercel
1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set the root directory to `frontend` (if your frontend is in a subfolder)
5. Configure build settings:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

### 3. Configure Environment Variables
In Vercel dashboard, add:

```env
REACT_APP_API_URL=https://your-railway-app.railway.app
```

### 4. Deploy
1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Note the generated domain

---

## 🔗 Update Frontend API URLs

### Option 1: Use Configuration File (Recommended)
The `config.js` file will automatically handle different environments.

### Option 2: Manual Update
If you prefer to update URLs manually, replace all instances of:
```javascript
'http://localhost:4000'
```
with:
```javascript
process.env.REACT_APP_API_URL || 'https://your-railway-app.railway.app'
```

---

## 🔒 Security Considerations

### 1. JWT Secret
- Use a strong, random JWT secret in production
- Never commit secrets to version control

### 2. CORS Configuration
- Backend is configured to only accept requests from your frontend domain
- Update `FRONTEND_URL` in Railway environment variables

### 3. MongoDB Security
- Use strong database passwords
- Enable MongoDB Atlas security features
- Consider using MongoDB Atlas App Services for additional security

---

## 🧪 Testing Deployment

### 1. Test Backend
```bash
curl https://your-railway-app.railway.app/
# Should return: {"status":"OK","message":"Mongolian Music Downloader API is running"}
```

### 2. Test Frontend
1. Visit your Vercel domain
2. Test user registration/login
3. Test music download functionality
4. Test admin panel

### 3. Test Database Connection
1. Check Railway logs for MongoDB connection success
2. Verify data is being saved/retrieved correctly

---

## 🔄 Payment System Deployment Notes

### Current Payment System
- **Manual Bank Transfer**: Khan Bank (IBAN: 400005000, Account: 5167487270)
- **Order Management**: Through admin panel
- **Status Tracking**: Pending → Completed/Cancelled

### Recommended Improvements for Production
1. **Payment Gateway Integration**: Consider integrating with local payment gateways
2. **Payment Verification**: Implement webhook verification
3. **Email Notifications**: Add order confirmation emails
4. **SMS Notifications**: Add payment confirmation SMS
5. **Receipt Generation**: Automated receipt generation

---

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues
1. **Port Issues**: Ensure `PORT` environment variable is set
2. **MongoDB Connection**: Check connection string and network access
3. **CORS Errors**: Verify `FRONTEND_URL` is correct

#### Frontend Issues
1. **API Calls Failing**: Check `REACT_APP_API_URL` environment variable
2. **Build Failures**: Check for missing dependencies
3. **CORS Errors**: Ensure backend CORS is configured correctly

#### Database Issues
1. **Connection Timeout**: Check MongoDB Atlas network access
2. **Authentication Errors**: Verify database username/password
3. **Permission Errors**: Check database user privileges

### Getting Help
1. Check Railway logs for backend errors
2. Check Vercel build logs for frontend errors
3. Check MongoDB Atlas logs for database issues
4. Review browser console for frontend errors

---

## 📞 Support
For deployment issues, check:
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com) 