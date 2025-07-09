const mongoose = require('mongoose');
const SongBundle = require('./models/SongBundle');
require('dotenv').config({ path: './config.env' });

async function checkBundles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mongolian-music', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Find all bundles
    const bundles = await SongBundle.find({}).sort({ createdAt: -1 });
    
    console.log(`\n📦 Found ${bundles.length} bundles in database:`);
    
    if (bundles.length === 0) {
      console.log('No bundles found. Create some bundles first!');
    } else {
      bundles.forEach((bundle, index) => {
        console.log(`\n${index + 1}. Bundle: "${bundle.name}"`);
        console.log(`   ID: ${bundle._id}`);
        console.log(`   Links: ${bundle.links ? bundle.links.length : 0}`);
        console.log(`   Piece: ${bundle.piece}`);
        console.log(`   Image URL: ${bundle.imageUrl || 'None'}`);
        console.log(`   Created: ${bundle.createdAt}`);
      });
    }

    // Check if the specific bundle exists
    const zohioliinBundle = await SongBundle.findOne({ name: 'Зохиолийн дуу багц 1' });
    if (zohioliinBundle) {
      console.log('\n✅ "Зохиолийн дуу багц 1" bundle found!');
    } else {
      console.log('\n❌ "Зохиолийн дуу багц 1" bundle NOT found!');
      console.log('This is why the front page is not showing any bundles.');
    }

  } catch (error) {
    console.error('❌ Error checking bundles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
checkBundles(); 