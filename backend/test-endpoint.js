const mongoose = require('mongoose');
const SongBundle = require('./models/SongBundle');
require('dotenv').config({ path: './config.env' });

async function testEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mongolian-music', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      sslValidate: false,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false
    });
    
    console.log('Connected to MongoDB');

    // Test the same query that the endpoint uses
    const bundles = await SongBundle.find().sort({ createdAt: -1 });
    
    console.log(`\n📦 Found ${bundles.length} bundles using the same query as the endpoint:`);
    
    if (bundles.length === 0) {
      console.log('❌ No bundles found - this explains why the homepage is empty!');
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

    // Test the exact endpoint logic
    console.log('\n🔍 Testing endpoint logic...');
    const endpointBundles = await SongBundle.find().sort({ createdAt: -1 });
    console.log(`Endpoint would return ${endpointBundles.length} bundles`);

  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
testEndpoint(); 