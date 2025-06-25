const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const userRoutes = require('./routes/user.routes');
const issueRoutes = require('./routes/issue.routes'); // Add this line
// If you want to use auth.routes.js, uncomment the next line:
// const authRoutes = require('./routes/auth.routes');

dotenv.config();
const app = express();
app.use(express.json()); 
app.use(cors()); // Allow cross-origin requests

app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes); // Add this line
// If you want to use /api/auth/register and /api/auth/login, uncomment the next line:
// app.use('/api/auth', authRoutes); 

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
.then (() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch (err => console.error('DB connection error:', err));
