const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Fix Mongoose deprecation warning
mongoose.set('strictQuery', true);

const userRoutes = require('./routes/user.routes');
const issueRoutes = require('./routes/issue.routes');
const chatbotRoutes = require('./routes/chatbot.routes'); // Add this line

const app = express();
app.use(express.json()); 
app.use(cors());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve auth.html
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/chatbot', chatbotRoutes); // Add this line

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, 'image', 'issues');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'issue-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        // Accept only image files
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Serve static files from the image directory
app.use('/image', express.static(path.join(__dirname, 'image')));

// Image upload route
app.post('/api/upload', upload.array('images', 5), (req, res) => {
    try {
        // Return the paths to the uploaded files
        const filePaths = req.files.map(file => `/image/issues/${file.filename}`);
        res.json({ success: true, filePaths });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle other routes by serving index.html for client-side routing
app.get('*', (req, res) => {
    // Skip API routes and existing static files
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/image/')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

const PORT = process.env.PORT || 5000;

// Add error handling for MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    // Exit process on failed connection to make error more visible
    process.exit(1);
});