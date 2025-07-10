const express = require('express');
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Music = require('./models/Music');
const SongBundle = require('./models/SongBundle');
const User = require('./models/User');
const Package = require('./models/Package');
const Order = require('./models/Order');
const Category = require('./models/Category');
require('dotenv').config({ path: './config.env' });
const archiver = require('archiver');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const tmp = require('tmp');

// Remove YouTube cookies logic
// (No YOUTUBE_COOKIES, no getUserCookies, no /api/upload-cookies, no 'Cookie' header in ytdl requests)

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app']
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://mg-lduu.vercel.app'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint for Railway
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Mongolian Music Downloader API is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed!'), false);
    }
  }
});

// Serve uploads folder
app.use('/uploads', express.static('uploads'));

// Image upload endpoint
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Connect to MongoDB with retry mechanism
const connectWithRetry = () => {
  console.log('🔄 Attempting to connect to MongoDB...');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mongolian-music', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    retryReads: true,
    retryWrites: true,
    w: 'majority'
  }).catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

const db = mongoose.connection;

// Enhanced error handling for MongoDB connection
db.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    code: error.code
  });
});

db.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

db.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

db.once('open', () => {
  console.log('✅ Connected to MongoDB successfully');
  createDefaultAdmin();
  // seedDefaultPackages(); // REMOVE THIS LINE to stop auto-creating price bundles
});

async function seedDefaultPackages() {
  const defaults = [
    { name: 'Жижиг багц', price: 5000 },
    { name: 'Дунд багц', price: 10000 },
    { name: 'Том багц', price: 20000 },
  ];
  for (const pkg of defaults) {
    const exists = await Package.findOne({ name: pkg.name });
    if (!exists) {
      await Package.create(pkg);
      console.log('Seeded package:', pkg.name);
    }
  }
}

// Create default admin user
async function createDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        password: 'Andii0817@',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Default admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: Andii0817@');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
}

// Admin login route
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await User.findOne({ username, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        categories: user.categories || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update normal login to only allow user role and auto-register if not found
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Утасны дугаар болон нууц үг шаардлагатай.' });
    }
    // Try to find user by phone number (username)
    let user = await User.findOne({ username, role: 'user' });
    if (!user) {
      // Auto-register: create new user
      user = new User({ username, password, role: 'user', isActive: true });
      await user.save();
    } else {
      // If user exists, check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Нууц үг буруу байна.' });
      }
      if (!user.isActive) {
        return res.status(401).json({ error: 'Таны бүртгэл идэвхгүй байна.' });
      }
    }
    // Generate token and respond
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        categories: user.categories || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Серверийн алдаа. Дахин оролдоно уу.' });
  }
});

// Verify token route
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Get current user data with categories
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      categories: user.categories || [],
      cookies: user.cookies,
      cookiesUpdatedAt: user.cookiesUpdatedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload text file with YouTube links (protected)
app.post('/api/upload-links', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    const savedMusic = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (ytdl.validateURL(line)) {
        try {
          // Get video info to extract title
          const info = await ytdl.getInfo(line, {
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            }
          });
          const title = info.videoDetails.title;
          const artist = 'Unknown Artist'; // You can modify this based on your needs

          // Check if music already exists
          const existingMusic = await Music.findOne({ youtubeUrl: line });
          if (!existingMusic) {
            const music = new Music({ 
              title, 
              artist, 
              youtubeUrl: line,
              category: 'zohiolyn' // Categorize as Зохиолын дуу
            });
            await music.save();
            savedMusic.push(music);
          }
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error.message}`);
        }
      } else {
        errors.push(`Line ${i + 1}: Invalid YouTube URL`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: `Successfully processed ${savedMusic.length} links`,
      saved: savedMusic.length,
      errors: errors,
      totalLines: lines.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save music to database
app.post('/api/music', async (req, res) => {
  try {
    const { title, artist, youtubeUrl } = req.body;
    
    if (!title || !artist || !youtubeUrl) {
      return res.status(400).json({ error: 'Title, artist, and YouTube URL are required' });
    }

    const existingMusic = await Music.findOne({ youtubeUrl });
    if (existingMusic) {
      return res.status(400).json({ error: 'Music with this URL already exists' });
    }

    const music = new Music({ title, artist, youtubeUrl });
    await music.save();
    
    res.json(music);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all music
app.get('/api/music', async (req, res) => {
  try {
    const music = await Music.find().sort({ createdAt: -1 });
    res.json(music);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get music by category
app.get('/api/music/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const music = await Music.find({ category }).sort({ createdAt: -1 });
    res.json(music);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new song bundle (protected)
app.post('/api/song-bundle', authenticateToken, async (req, res) => {
  try {
    const { name, links, imageBase64, piece, category } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Bundle name is required' });
    }
    // Convert string links to {name:'', url:link} objects for backward compatibility
    let safeLinks = Array.isArray(links) ? links.map(l =>
      typeof l === 'string' ? { name: '', url: l } : l
    ) : [];
    if (safeLinks.some(l => !l.name && !l.url)) {
      return res.status(400).json({ error: 'Each song must have a name or url' });
    }
    const bundle = new SongBundle({ name, links: safeLinks, imageBase64: imageBase64 || '', piece: piece || 0, category: category || '' });
    await bundle.save();
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a song bundle by ID
app.put('/api/song-bundle/:id', async (req, res) => {
  try {
    let safeLinks = Array.isArray(req.body.links) ? req.body.links.map(l =>
      typeof l === 'string' ? { name: '', url: l } : l
    ) : [];
    if (safeLinks.some(l => !l.name && !l.url)) {
      return res.status(400).json({ error: 'Each song must have a name or url' });
    }
    const bundle = await SongBundle.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        imageUrl: req.body.imageUrl,
        imageBase64: req.body.imageBase64,
        links: safeLinks,
        piece: req.body.piece,
        category: req.body.category
      },
      { new: true }
    );
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete song bundle (protected)
app.delete('/api/song-bundle/:id', authenticateToken, async (req, res) => {
  try {
    const bundle = await SongBundle.findByIdAndDelete(req.params.id);
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    res.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all song bundles (protected - for admin)
app.get('/api/song-bundle/all', authenticateToken, async (req, res) => {
  try {
    const bundles = await SongBundle.find().sort({ createdAt: -1 });
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all song bundles (public - for homepage)
app.get('/api/bundles', async (req, res) => {
  try {
    const bundles = await SongBundle.find().sort({ createdAt: -1 });
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin stats endpoint (protected)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const totalBundles = await SongBundle.countDocuments();
    const totalSongs = await SongBundle.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$links' } } } }
    ]);
    const totalMusic = await Music.countDocuments();
    
    res.json({
      totalBundles,
      totalSongs: totalSongs[0]?.total || 0,
      totalMusic,
      totalDownloads: 0 // You can implement download tracking later
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all users (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const users = await User.find({}, 'id _id username role isActive createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete a user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const userId = req.params.id;
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Download single music
app.get('/download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Get video info to get the title
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    
    res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');
    
    const stream = ytdl(url, { 
      filter: 'audioonly', 
      quality: 'highestaudio',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    
    stream.on('error', (err) => {
      console.log('Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });
    
    stream.pipe(res);
    
  } catch (error) {
    console.log('Download error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Download bundle (multiple files)
app.get('/download-bundle/:bundleId', async (req, res) => {
  try {
    const bundle = await SongBundle.findById(req.params.bundleId);
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // For now, we'll download the first track
    // In a production app, you'd want to zip multiple files
    if (bundle.links.length > 0) {
      const firstMusic = bundle.links[0];
      res.header('Content-Disposition', `attachment; filename="${bundle.name}.mp3"`);
      ytdl(firstMusic.youtubeUrl, { filter: 'audioonly', quality: 'highestaudio', requestOptions: { headers: {} } })
        .pipe(res);
    } else {
      res.status(400).json({ error: 'Bundle is empty' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Progress tracking ---
const progressMap = new Map(); // key: progressKey, value: { processed, total, done }
const sseClients = new Map(); // key: progressKey, value: Set of res

function getProgressKey(req, bundleId, type) {
  // Use session or IP+bundleId+type for demo (in production, use user/session ID)
  return `${req.ip || req.headers['x-forwarded-for'] || 'anon'}:${bundleId}:${type}`;
}

// SSE endpoint for progress
app.get('/api/bundle-progress/:bundleId', (req, res) => {
  const { bundleId } = req.params;
  const { type } = req.query; // 'mp3' or 'mp4'
  const progressKey = getProgressKey(req, bundleId, type);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial progress if exists
  const progress = progressMap.get(progressKey);
  if (progress) {
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
  }

  // Store client
  if (!sseClients.has(progressKey)) sseClients.set(progressKey, new Set());
  sseClients.get(progressKey).add(res);

  req.on('close', () => {
    sseClients.get(progressKey)?.delete(res);
  });
});

function sendProgress(progressKey, progress) {
  progressMap.set(progressKey, progress);
  const clients = sseClients.get(progressKey);
  if (clients) {
    for (const res of clients) {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    }
  }
}

// --- Update MP3 ZIP endpoint ---
app.get('/download-bundle-mp3/:bundleId', async (req, res) => {
  const progressKey = getProgressKey(req, req.params.bundleId, 'mp3');
  try {
    const bundle = await SongBundle.findById(req.params.bundleId);
    if (!bundle || !Array.isArray(bundle.links) || bundle.links.length === 0) {
      console.log('Bundle not found or empty');
      return res.status(404).json({ error: 'Bundle not found or empty' });
    }
    
    const safeName = bundle.name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_mp3.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    let count = 1;
    let processedCount = 0;
    const totalLinks = bundle.links.length;
    progressMap.set(progressKey, { processed: 0, total: totalLinks, done: false });
    sendProgress(progressKey, { processed: 0, total: totalLinks, done: false });
    for (const linkObj of bundle.links) {
      const url = typeof linkObj === 'string' ? linkObj : linkObj.url;
      if (!ytdl.validateURL(url)) {
        console.log(`Skipping invalid URL: ${url}`);
        continue;
      }
      try {
        const info = await ytdl.getInfo(url, {
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        });
        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        const stream = ytdl(url, { 
          filter: 'audioonly', 
          quality: 'highestaudio',
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        });
        archive.append(stream, { name: `${count}_${title}.mp3` });
        processedCount++;
        sendProgress(progressKey, { processed: processedCount, total: totalLinks, done: false });
      } catch (err) {
        console.log(`✗ Error processing link #${count}: ${url} - ${err.message}`);
      }
      count++;
    }
    archive.on('end', () => {
      sendProgress(progressKey, { processed: processedCount, total: totalLinks, done: true });
      setTimeout(() => { progressMap.delete(progressKey); sseClients.delete(progressKey); }, 10000);
    });
    archive.finalize();
    console.log('Archive finalized and sent to client.');
  } catch (error) {
    sendProgress(progressKey, { processed: 0, total: 0, done: true, error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// --- Update MP4 ZIP endpoint similarly ---
// (Repeat the same progress logic for /download-bundle-mp4/:bundleId)

// Download all links in a bundle as MP3 ZIP (legacy endpoint for Зохиолийн дуу багц 1)
app.get('/download-bundle-mp3', async (req, res) => {
  try {
    const bundle = await SongBundle.findOne({ name: 'Зохиолийн дуу багц 1' });
    if (!bundle || !Array.isArray(bundle.links) || bundle.links.length === 0) {
      console.log('Bundle not found or empty');
      return res.status(404).json({ error: 'Bundle not found or empty' });
    }
    
    res.setHeader('Content-Disposition', 'attachment; filename="zohioliin_duu_mp3.zip"');
    res.setHeader('Content-Type', 'application/zip');
    
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });
    
    archive.pipe(res);
    
    let count = 1;
    let processedCount = 0;
    const totalLinks = bundle.links.length;
    
    console.log(`Starting MP3 download for ${totalLinks} links...`);
    
    for (const link of bundle.links) {
      if (!ytdl.validateURL(link)) {
        console.log(`Skipping invalid URL: ${link}`);
        continue;
      }
      
      try {
        console.log(`Processing MP3 ${count}/${totalLinks}: ${link}`);
        
        // Get video info first to get the title
        const info = await ytdl.getInfo(link, {
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        });
        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        
        const stream = ytdl(link, { 
          filter: 'audioonly', 
          quality: 'highestaudio',
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        });
        
        archive.append(stream, { name: `${count}_${title}.mp3` });
        processedCount++;
        console.log(`✓ Added MP3 ${count}/${totalLinks}: ${title}`);
        
      } catch (err) {
        console.log(`✗ Error processing link #${count}: ${link} - ${err.message}`);
        // Continue with next link instead of failing completely
      }
      count++;
    }
    
    archive.on('error', err => {
      console.log('Archiver error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });
    
    archive.on('end', () => {
      console.log(`✓ Archive completed. Successfully processed ${processedCount}/${totalLinks} files.`);
    });
    
    archive.finalize();
    console.log('Archive finalized and sent to client.');
    
  } catch (error) {
    console.log('General error in /download-bundle-mp3:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Download all links in a bundle as MP4 ZIP (by ID)
app.get('/download-bundle-mp4/:bundleId', async (req, res) => {
  const progressKey = getProgressKey(req, req.params.bundleId, 'mp4');
  try {
    const bundle = await SongBundle.findById(req.params.bundleId);
    if (!bundle || !Array.isArray(bundle.links) || bundle.links.length === 0) {
      return res.status(404).json({ error: 'Bundle not found or empty' });
    }

    const safeNameMp4 = bundle.name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeNameMp4}_mp4.zip"`);
    res.setHeader('Content-Type', 'application/zip');

    const archiverLib = require('archiver');
    const archive = archiverLib('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    let count = 1;
    let processedCount = 0;
    let added = 0;
    let lastError = ''; // Initialize lastError
    const totalLinks = bundle.links.length;
    progressMap.set(progressKey, { processed: 0, total: totalLinks, done: false });
    sendProgress(progressKey, { processed: 0, total: totalLinks, done: false });

    for (const linkObj of bundle.links) {
      // Get the URL from the object or string
      const rawUrl = typeof linkObj === 'string' ? linkObj : linkObj.url;
      // Strip query parameters from the YouTube link
      const cleanLink = rawUrl.split('?')[0];
      if (!ytdl.validateURL(cleanLink)) {
        console.log(`Skipping invalid URL: ${rawUrl}`);
        continue;
      }
      try {
        console.log(`Adding MP4 for link #${count}: ${rawUrl}`);
        const info = await ytdl.getInfo(cleanLink, {
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        });
        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

        // Create temp files for video and audio
        const videoTmp = tmp.fileSync({ postfix: '.mp4' });
        const audioTmp = tmp.fileSync({ postfix: '.mp3' });
        const mergedTmp = tmp.fileSync({ postfix: '.mp4' });

        // Download video and audio streams to temp files
        await new Promise((resolve, reject) => {
          const videoStream = ytdl(cleanLink, {
            quality: 'highestvideo',
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            }
          });
          const videoWrite = fs.createWriteStream(videoTmp.name);
          videoStream.pipe(videoWrite);
          videoWrite.on('finish', resolve);
          videoWrite.on('error', reject);
          videoStream.on('error', reject);
        });
        await new Promise((resolve, reject) => {
          const audioStream = ytdl(cleanLink, {
            quality: 'highestaudio',
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            }
          });
          const audioWrite = fs.createWriteStream(audioTmp.name);
          audioStream.pipe(audioWrite);
          audioWrite.on('finish', resolve);
          audioWrite.on('error', reject);
          audioStream.on('error', reject);
        });

        // Merge video and audio into mergedTmp
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(videoTmp.name)
            .input(audioTmp.name)
            .videoCodec('copy')
            .audioCodec('aac')
            .save(mergedTmp.name)
            .on('end', resolve)
            .on('error', reject);
        });

        // Append merged file to archive
        const mergedStream = fs.createReadStream(mergedTmp.name);
        archive.append(mergedStream, { name: `${count}_${title}.mp4` });
        processedCount++;
        added++;
        sendProgress(progressKey, { processed: processedCount, total: totalLinks, done: false });

        // Clean up temp files only after the stream is closed
        mergedStream.on('close', () => {
          videoTmp.removeCallback();
          audioTmp.removeCallback();
          mergedTmp.removeCallback();
        });
      } catch (err) {
        console.log(`Error processing link #${count}: ${rawUrl} - ${err.message}`);
        lastError = err.message;
      }
      count++;
    }

    if (added === 0) {
      archive.abort();
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(400).json({ error: lastError || 'No valid videos to download.' });
      }
      return;
    }

    archive.on('error', err => {
      console.log('Archiver error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });

    archive.on('end', () => {
      sendProgress(progressKey, { processed: processedCount, total: totalLinks, done: true });
      setTimeout(() => { progressMap.delete(progressKey); sseClients.delete(progressKey); }, 10000);
      console.log(`Archive completed. Processed ${processedCount} files.`);
    });

    archive.finalize();
    console.log('Archive finalized and sent to client.');

  } catch (error) {
    console.log('General error in /download-bundle-mp4:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Download all links in a bundle as MP4 ZIP (legacy endpoint for Зохиолийн дуу багц 1)
app.get('/download-bundle-mp4', async (req, res) => {
  try {
    const bundle = await SongBundle.findOne({ name: 'Зохиолийн дуу багц 1' });
    if (!bundle || !Array.isArray(bundle.links) || bundle.links.length === 0) {
      return res.status(404).json({ error: 'Bundle not found or empty' });
    }
    
    res.setHeader('Content-Disposition', 'attachment; filename="zohioliin_duu_mp4.zip"');
    res.setHeader('Content-Type', 'application/zip');
    
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });
    
    archive.pipe(res);
    
    let count = 1;
    let processedCount = 0;
    
    for (const link of bundle.links) {
      // Strip query parameters from the YouTube link
      const cleanLink = link.split('?')[0];
      if (!ytdl.validateURL(cleanLink)) {
        console.log(`Skipping invalid URL: ${link}`);
        continue;
      }
      
      try {
        console.log(`Adding MP4 for link #${count}: ${link}`);
        
        // Get video info first to get the title
        const info = await ytdl.getInfo(cleanLink, {
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Cookie': YOUTUBE_COOKIES // This line is removed
            }
          }
        });
        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        
        const stream = ytdl(cleanLink, { 
          quality: 'highestvideo',
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Cookie': YOUTUBE_COOKIES // This line is removed
            }
          }
        });
        
        archive.append(stream, { name: `${count}_${title}.mp4` });
        processedCount++;
        
      } catch (err) {
        console.log(`Error processing link #${count}: ${link} - ${err.message}`);
        // Continue with next link instead of failing completely
      }
      count++;
    }
    
    archive.on('error', err => {
      console.log('Archiver error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });
    
    archive.on('end', () => {
      console.log(`Archive completed. Processed ${processedCount} files.`);
    });
    
    archive.finalize();
    console.log('Archive finalized and sent to client.');
    
  } catch (error) {
    console.log('General error in /download-bundle-mp4:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Restore /api/upload-cookies endpoint and user cookie logic
// Add back user.cookies and user.cookiesUpdatedAt in responses
// Use user cookie for ytdl requests if available

// Upload cookies endpoint
app.post('/api/upload-cookies', authenticateToken, async (req, res) => {
  try {
    const { cookies } = req.body;
    if (!cookies) {
      return res.status(400).json({ error: 'Cookies are required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.cookies = cookies;
    user.cookiesUpdatedAt = new Date();
    await user.save();
    res.json({ message: 'Cookies uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload cookies' });
  }
});

// Helper function to get user cookies
async function getUserCookies(userId) {
  try {
    if (!userId) return '';
    const user = await User.findById(userId);
    if (user && user.cookies && user.cookies.trim()) {
      return user.cookies;
    }
    return '';
  } catch (error) {
    return '';
  }
}

// In all ytdl-core requests, use user cookies if available
// Example for MP4 download:
// ... inside your MP4/MP3 download endpoints ...
// const userCookies = await getUserCookies(decoded.userId);
// ytdl(url, { ..., requestOptions: { headers: { ...(userCookies ? { 'Cookie': userCookies } : {}) } } })

// Get all packages
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await Package.find({}).sort({ price: 1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Create a new package (admin only)
app.post('/api/packages', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const { name, price, description } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const pkg = await Package.create({ name, price, description });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Update a package (admin only)
app.put('/api/packages/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const { price, description } = req.body;
    const update = {};
    if (price !== undefined) update.price = price;
    if (description !== undefined) update.description = description;
    const pkg = await Package.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// Delete a package (admin only)
app.delete('/api/packages/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const deleted = await Package.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Package not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { accountName, packageName, packagePrice } = req.body;
    if (!accountName || !packageName || !packagePrice) {
      return res.status(400).json({ error: 'Account name, package name, and price are required' });
    }
    const order = await Order.create({ 
      accountName, 
      packageName, 
      packagePrice,
      categories: [] // Initialize empty categories array
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders (admin only)
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const orders = await Order.find({}).populate('categories').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status and categories (admin only)
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const { status, categories } = req.body;
    console.log('Received request body:', req.body);
    console.log('Status:', status);
    console.log('Categories:', categories);
    
    const update = {};
    if (status !== undefined) update.status = status;
    if (categories !== undefined) update.categories = categories;
    
    console.log('Updating order:', req.params.id);
    console.log('Update data:', update);
    
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    console.log('Updated order:', order);
    
    // Handle category management based on status
    if (categories && categories.length > 0) {
      try {
        console.log('Looking for user with username:', order.accountName);
        const user = await User.findOne({ username: order.accountName });
        console.log('Found user:', user);
        if (user) {
          // Get category names from category IDs
          const categoryNames = await Category.find({ _id: { $in: categories } }).select('name');
          const categoryNameList = categoryNames.map(cat => cat.name);
          
          if (status === 'completed') {
            // Add categories to user when order is completed
            const existingCategories = user.categories || [];
            const newCategories = categoryNameList.filter(catName => !existingCategories.includes(catName));
            console.log('Existing categories:', existingCategories);
            console.log('New categories to add:', newCategories);
            if (newCategories.length > 0) {
              user.categories = [...existingCategories, ...newCategories];
              await user.save();
              console.log('User categories added:', user.categories);
            }
          } else if (status === 'cancelled') {
            // Remove categories from user when order is cancelled
            const existingCategories = user.categories || [];
            const categoriesToRemove = categoryNameList.filter(catName => existingCategories.includes(catName));
            console.log('Existing categories:', existingCategories);
            console.log('Categories to remove:', categoriesToRemove);
            if (categoriesToRemove.length > 0) {
              user.categories = existingCategories.filter(catName => !categoriesToRemove.includes(catName));
              await user.save();
              console.log('User categories removed:', user.categories);
            }
          }
        }
      } catch (userError) {
        console.error('Error updating user categories:', userError);
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order (admin only)
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    // Get the order before deleting to access its categories and account name
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // If order has categories and is completed, remove them from user
    if (order.categories && order.categories.length > 0 && order.status === 'completed') {
      try {
        console.log('Looking for user with username:', order.accountName);
        const user = await User.findOne({ username: order.accountName });
        console.log('Found user:', user);
        if (user) {
          // Get category names from category IDs
          const categoryNames = await Category.find({ _id: { $in: order.categories } }).select('name');
          const categoryNameList = categoryNames.map(cat => cat.name);
          
          // Remove categories from user
          const existingCategories = user.categories || [];
          const categoriesToRemove = categoryNameList.filter(catName => existingCategories.includes(catName));
          console.log('Existing categories:', existingCategories);
          console.log('Categories to remove:', categoriesToRemove);
          if (categoriesToRemove.length > 0) {
            user.categories = existingCategories.filter(catName => !categoriesToRemove.includes(catName));
            await user.save();
            console.log('User categories removed after order deletion:', user.categories);
          }
        }
      } catch (userError) {
        console.error('Error removing user categories after order deletion:', userError);
      }
    }
    
    // Delete the order
    const deleted = await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a new category (admin only)
app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const category = await Category.create({ name, description, color });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category (admin only)
app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const { name, description, color } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (color !== undefined) update.color = color;
    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category (admin only)
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 