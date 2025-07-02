const express = require('express');
const router = express.Router();
const { GeminiChatbotService } = require('../services/gemini-api');
const jwt = require('jsonwebtoken');

// Initialize the chatbot service
const chatbotService = new GeminiChatbotService();

/**
 * Authentication middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // Continue as guest if no token
    req.user = { role: 'guest' };
    return next();
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = user;
  } catch (err) {
    // Invalid token, continue as guest
    req.user = { role: 'guest' };
  }
  
  next();
};

/**
 * POST /api/chatbot/gemini
 * Main endpoint for chatbot interactions
 */
router.post('/gemini', authenticateToken, async (req, res) => {
  try {
    const { messages, currentUser } = req.body;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    // Use authenticated user or provided user info
    const userContext = {
      role: req.user.role || currentUser?.role || 'guest',
      email: req.user.email || currentUser?.email || '',
      name: req.user.name || currentUser?.name || '',
      department: req.user.dept || currentUser?.department || ''
    };
    
    // Get response from Gemini
    const response = await chatbotService.generateResponse(messages, userContext);
    
    // Return the response
    res.json({ response });
  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/chatbot/health
 * Health check endpoint for the chatbot service
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await chatbotService.checkHealth();
    
    if (isHealthy) {
      return res.json({ status: 'ok', message: 'Chatbot service is healthy' });
    } else {
      return res.status(503).json({ status: 'error', message: 'Chatbot service is unavailable' });
    }
  } catch (error) {
    console.error('Chatbot health check error:', error);
    res.status(500).json({ status: 'error', message: 'Error checking chatbot health' });
  }
});

/**
 * GET /api/chatbot/models
 * List available models for debugging
 */
router.get('/models', async (req, res) => {
  try {
    const models = await chatbotService.listAvailableModels();
    return res.json({ models });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

module.exports = router;
