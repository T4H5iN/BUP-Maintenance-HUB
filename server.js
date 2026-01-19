const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Load environment variables
dotenv.config();

// Fix Mongoose deprecation warning
mongoose.set('strictQuery', true);

// Import Cloudinary service
const { uploadToCloudinary } = require('./services/cloudinary');

const userRoutes = require('./routes/user.routes');
const issueRoutes = require('./routes/issue.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const notificationRoutes = require('./routes/notification.routes');

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
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);

// Configure multer for memory storage (for Cloudinary upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Image upload route - uploads to Cloudinary
app.post('/api/upload', upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded'
            });
        }

        // Upload all files to Cloudinary
        const uploadPromises = req.files.map(file =>
            uploadToCloudinary(file.buffer, 'bup-issues')
        );

        const results = await Promise.all(uploadPromises);

        // Return the Cloudinary URLs
        const filePaths = results.map(result => result.secure_url);
        res.json({ success: true, filePaths });

    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading files',
            error: error.message
        });
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
if (!process.env.MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Exit process on failed connection to make error more visible
        process.exit(1);
    });
