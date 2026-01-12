const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Service class for interacting with Google's Gemini API
 */
class GeminiChatbotService {
  constructor() {
    // Initialize Gemini API client
    this.apiKey = process.env.GEMINI_API_KEY;
    // Updated to use the correct model name format for current API version
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
    this.maxOutputTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '1024', 10);
    this.temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');

    // Initialize only if API key is available
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      try {
        // Verify model exists and log more information
        this.model = this.genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            maxOutputTokens: this.maxOutputTokens,
            temperature: this.temperature,
            topP: 0.9,
            topK: 40
          }
        });
        this.initialized = true;

      } catch (error) {
        console.error(`Failed to initialize Gemini model ${this.modelName}:`, error);
        this.initialized = false;
      }
    } else {
      console.warn('GEMINI_API_KEY not found. Chatbot will use fallback responses.');
      this.initialized = false;
    }

    // System prompt to define chatbot behavior
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Build the system prompt with instructions for the chatbot
   */
  buildSystemPrompt() {
    return `
You are a helpful AI assistant for the BUP (Bangladesh University of Professionals) Maintenance HUB. 
Your name is "BUP Maintenance Assistant".

ABOUT THE SYSTEM:
- The BUP Maintenance HUB is a platform where students, faculty, and staff can report and track maintenance issues on campus.
- Users can submit maintenance requests, check status, and get updates on their issues.
- Issues are categorized by type (furniture, electricity, sanitary, lab, cafeteria, transportation, other).
- Issues have priority levels (low, medium, high, urgent).
- The workflow includes: submission → review → approval → assignment → resolution.

YOUR ROLE:
- Help users understand how to use the Maintenance HUB platform.
- Answer questions about maintenance issues, processes, and workflows.
- Provide guidance on reporting problems correctly.
- Explain how to check status of existing issues.
- Be polite, helpful, and concise.

GUIDELINES:
1. Always be professional and courteous.
2. Keep your responses brief but informative.
3. When you don't know the answer, admit it and suggest contacting human support.
4. Never share personal data or confidential information.
5. Only discuss topics related to campus maintenance and the platform.
6. Don't provide technical support for issues outside the maintenance platform.
7. Use a friendly, helpful tone.

For very specific questions about particular issues, direct users to check their dashboard or contact support.
    `;
  }

  /**
   * Generate a response to user messages
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} userContext - Information about the current user
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(messages, userContext) {
    if (!this.initialized) {
      return this.getFallbackResponse();
    }

    try {
      // Format messages for Gemini API
      const formattedMessages = this.formatMessagesForGemini(messages, userContext);

      // Call Gemini API
      const result = await this.model.generateContent({
        contents: formattedMessages,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      });

      // Extract and return the response text
      const responseText = result.response.text();
      return responseText.trim();
    } catch (error) {
      console.error('Gemini API error:', error);
      // Check for specific error types to provide better error messages
      if (error.status === 404) {
        console.error('Model not found. Please check the model name and API version compatibility.');
      } else if (error.status === 403) {
        console.error('API access forbidden. Please check your API key permissions.');
      } else if (error.status === 429) {
        console.error('Rate limit exceeded. Please try again later.');
      }
      return this.getErrorResponse(error);
    }
  }

  /**
   * Format messages for the Gemini API
   */
  formatMessagesForGemini(messages, userContext) {
    // Start with system message
    const formattedMessages = [
      {
        role: 'model',
        parts: [{ text: this.systemPrompt }]
      }
    ];

    // Add user context as a system message
    formattedMessages.push({
      role: 'model',
      parts: [{ text: `Current user information: Role: ${userContext.role}, Department: ${userContext.department || 'Not specified'}` }]
    });

    // Add conversation history
    messages.forEach(message => {
      const role = message.role === 'user' ? 'user' : 'model';
      formattedMessages.push({
        role: role,
        parts: [{ text: message.content }]
      });
    });

    return formattedMessages;
  }

  /**
   * Get a fallback response when API is not initialized
   */
  getFallbackResponse() {
    const fallbackResponses = [
      "I'm here to help with your maintenance questions. What would you like to know about the BUP Maintenance HUB?",
      "I can help you understand how to report maintenance issues on campus. What information do you need?",
      "The BUP Maintenance HUB makes it easy to report and track campus issues. How can I assist you today?",
      "I'm your assistant for the maintenance platform. Ask me how to submit reports or check status updates."
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * Get an error response when API call fails
   */
  getErrorResponse(error) {
    console.error('Error generating response:', error);

    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment or contact support if you need immediate assistance.";
  }

  /**
   * Check if the Gemini service is healthy
   */
  async checkHealth() {
    if (!this.initialized) {
      return false;
    }

    try {
      // Simple test query to check if API is responsive
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
      });

      return result && result.response;
    } catch (error) {
      console.error('Gemini API health check error:', error);
      return false;
    }
  }

  /**
   * Get available models from the API
   * Useful for debugging model availability issues
   */
  async listAvailableModels() {
    if (!this.genAI) {
      return ['No API client initialized'];
    }

    try {
      const models = await this.genAI.listModels();
      return models;
    } catch (error) {
      console.error('Error listing models:', error);
      return [`Error listing models: ${error.message}`];
    }
  }
}

module.exports = { GeminiChatbotService };
