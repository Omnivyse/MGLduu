const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

async function checkAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mongolian-music', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (adminUser) {
      console.log('✅ Admin user found in database:');
      console.log({
        id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role,
        isActive: adminUser.isActive,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt
      });
      
      // Test password verification
      const isValidPassword = await adminUser.comparePassword('Andii0817@');
      console.log('Password verification test:', isValidPassword ? '✅ PASS' : '❌ FAIL');
      
    } else {
      console.log('❌ Admin user not found in database');
      console.log('Run: node create-admin.js to create the admin user');
    }

    // List all users
    const allUsers = await User.find({});
    console.log('\n📋 All users in database:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
checkAdminUser(); 