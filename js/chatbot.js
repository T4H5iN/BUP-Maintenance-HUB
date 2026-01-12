/**
 * Chatbot functionality for BUP Maintenance HUB
 * Integrates with Gemini API for intelligent responses
 */

// Configuration
const CHATBOT_CONFIG = {
  initialMessage: "Hi! I'm the BUP Maintenance HUB Assistant. How can I help you today?",
  placeholderText: "Type your message...",
  contextLength: 10, // Number of messages to include in context
  typingDelay: { min: 300, max: 1500 }, // Simulated typing delay range in ms
  suggestedQuestions: [
    "How do I report a maintenance issue?",
    "How can I check the status of my report?",
    "Who do I contact for urgent maintenance?",
    "What information should I include in my report?"
  ]
};

// State management
let chatbotState = {
  isOpen: false,
  conversationHistory: [],
  isWaitingForResponse: false
};

// DOM elements
let chatbotContainer, chatbotMessages, chatInput, sendButton, chatbotToggle;

/**
 * Initialize the chatbot
 */
function initChatbot() {
  // Create chatbot HTML structure
  createChatbotHTML();

  // Get DOM references
  chatbotContainer = document.querySelector('.chatbot-container');
  chatbotMessages = document.querySelector('.chatbot-messages');
  chatInput = document.querySelector('.chat-input');
  sendButton = document.querySelector('.send-btn');
  chatbotToggle = document.querySelector('.chatbot-toggle');

  // Set up event listeners
  setupEventListeners();

  // Add initial bot message
  addBotMessage(CHATBOT_CONFIG.initialMessage);

  // Add suggested questions
  addSuggestedQuestions();

  console.log('Chatbot initialized successfully');
}

/**
 * Create the chatbot HTML structure and append to body
 */
function createChatbotHTML() {
  const chatbotHTML = `
    <div class="chatbot-container">
      <div class="chatbot-header">
        <h3><i class="fas fa-robot"></i> BUP Maintenance Assistant</h3>
        <button class="close-btn" aria-label="Close chatbot">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="chatbot-messages"></div>
      <div class="chat-input-container">
        <textarea 
          class="chat-input" 
          placeholder="${CHATBOT_CONFIG.placeholderText}"
          rows="1"
          aria-label="Chat message"
        ></textarea>
        <button class="send-btn" aria-label="Send message">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
    <button class="chatbot-toggle" aria-label="Toggle chatbot">
      <i class="fas fa-comment-dots chat-icon"></i>
      <i class="fas fa-times close-icon"></i>
    </button>
  `;

  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
}

/**
 * Set up event listeners for chatbot interactions
 */
function setupEventListeners() {
  // Toggle chatbot visibility
  chatbotToggle.addEventListener('click', toggleChatbot);

  // Close button
  document.querySelector('.close-btn').addEventListener('click', closeChatbot);

  // Send message on button click
  sendButton.addEventListener('click', sendMessage);

  // Send message on Enter key (but allow Shift+Enter for new line)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }

    // Auto-resize textarea
    setTimeout(() => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
    }, 0);
  });

  // Disable button when input is empty
  chatInput.addEventListener('input', () => {
    sendButton.disabled = chatInput.value.trim() === '';

    // Auto-resize textarea
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
  });
}

/**
 * Toggle chatbot visibility
 */
function toggleChatbot() {
  chatbotState.isOpen = !chatbotState.isOpen;
  chatbotContainer.classList.toggle('open', chatbotState.isOpen);
  chatbotToggle.classList.toggle('open', chatbotState.isOpen);

  if (chatbotState.isOpen) {
    chatInput.focus();
  }
}

/**
 * Close the chatbot
 */
function closeChatbot() {
  chatbotState.isOpen = false;
  chatbotContainer.classList.remove('open');
  chatbotToggle.classList.remove('open');
}

/**
 * Send a user message
 */
function sendMessage() {
  const message = chatInput.value.trim();

  if (message === '' || chatbotState.isWaitingForResponse) return;

  // Add user message to UI
  addUserMessage(message);

  // Clear input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendButton.disabled = true;

  // Show typing indicator
  showTypingIndicator();

  // Update state
  chatbotState.isWaitingForResponse = true;

  // Send to backend and get response
  sendToChatbotAPI(message);
}

/**
 * Add a user message to the chat
 */
function addUserMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', 'user-message');
  messageElement.textContent = message;

  chatbotMessages.appendChild(messageElement);
  scrollToBottom();

  // Add to conversation history
  chatbotState.conversationHistory.push({
    role: 'user',
    content: message
  });

  // Limit history length
  if (chatbotState.conversationHistory.length > CHATBOT_CONFIG.contextLength * 2) {
    chatbotState.conversationHistory = chatbotState.conversationHistory.slice(-CHATBOT_CONFIG.contextLength * 2);
  }
}

/**
 * Format message text to handle links and other formatting
 */
function formatMessageLinks(text) {
  if (!text) return '';

  let formattedText = text;

  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  formattedText = formattedText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  // Handle numbered lists (lines starting with 1., 2., etc.)
  formattedText = handleNumberedLists(formattedText);

  // Handle bullet points (lines starting with - or *)
  formattedText = handleBulletPoints(formattedText);

  // Handle bold text (**text** or __text__)
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedText = formattedText.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Handle italic text (*text* or _text_)
  formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle paragraphs (double line breaks)
  formattedText = formattedText.replace(/\n\s*\n/g, '</p><p>');

  // Wrap the entire text in paragraph tags if not already
  if (!formattedText.startsWith('<p>')) {
    formattedText = '<p>' + formattedText + '</p>';
  }

  return formattedText;
}

/**
 * Handle conversion of numbered lists to HTML
 */
function handleNumberedLists(text) {
  // Check if the text contains any numbered list items
  const hasNumberedList = /^\s*\d+\.\s+/m.test(text);

  if (!hasNumberedList) {
    return text;
  }

  let inList = false;
  const lines = text.split('\n');
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = /^\s*\d+\.\s+/.test(line);

    if (isListItem) {
      if (!inList) {
        // Start a new list
        result.push('<ol>');
        inList = true;
      }
      // Add the list item, removing the number and period
      const content = line.replace(/^\s*\d+\.\s+/, '');
      result.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        // End the current list
        result.push('</ol>');
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    // Close the list if we're still in one
    result.push('</ol>');
  }

  return result.join('\n');
}

/**
 * Handle conversion of bullet points to HTML
 */
function handleBulletPoints(text) {
  // Check if the text contains any bullet list items
  const hasBulletList = /^\s*[-*]\s+/m.test(text);

  if (!hasBulletList) {
    return text;
  }

  let inList = false;
  const lines = text.split('\n');
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = /^\s*[-*]\s+/.test(line);

    if (isListItem) {
      if (!inList) {
        // Start a new list
        result.push('<ul>');
        inList = true;
      }
      // Add the list item, removing the bullet
      const content = line.replace(/^\s*[-*]\s+/, '');
      result.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        // End the current list
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    // Close the list if we're still in one
    result.push('</ul>');
  }

  return result.join('\n');
}

/**
 * Add a bot message to the chat with improved formatting
 */
function addBotMessage(message) {
  // Remove typing indicator if present
  removeTypingIndicator();

  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', 'bot-message');

  // Handle markdown-like formatting for links and other text formatting
  const formattedMessage = formatMessageLinks(message);
  messageElement.innerHTML = formattedMessage;

  chatbotMessages.appendChild(messageElement);
  scrollToBottom();

  // Add to conversation history
  chatbotState.conversationHistory.push({
    role: 'assistant',
    content: message
  });
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  const typingElement = document.createElement('div');
  typingElement.classList.add('chat-message', 'bot-message', 'thinking');
  typingElement.id = 'typing-indicator';

  // Add bouncing dots
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    typingElement.appendChild(dot);
  }

  chatbotMessages.appendChild(typingElement);
  scrollToBottom();
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

/**
 * Add suggested questions as clickable options
 */
function addSuggestedQuestions() {
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.classList.add('bot-message');
  suggestionsContainer.innerHTML = '<p>Here are some questions you might have:</p>';

  const suggestionsList = document.createElement('ul');
  suggestionsList.style.paddingLeft = '20px';
  suggestionsList.style.marginTop = '8px';

  CHATBOT_CONFIG.suggestedQuestions.forEach(question => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = question;
    link.style.color = 'var(--primary-color)';
    link.style.textDecoration = 'none';

    link.addEventListener('click', (e) => {
      e.preventDefault();
      chatInput.value = question;
      sendButton.disabled = false;
      sendMessage();
    });

    item.appendChild(link);
    suggestionsList.appendChild(item);
  });

  suggestionsContainer.appendChild(suggestionsList);
  chatbotMessages.appendChild(suggestionsContainer);
}

/**
 * Send message to chatbot API
 */
async function sendToChatbotAPI(message) {
  try {
    // Get conversation history for context
    const recentMessages = chatbotState.conversationHistory.slice(-CHATBOT_CONFIG.contextLength * 2);

    // Prepare data for API
    const requestData = {
      messages: recentMessages,
      currentUser: getCurrentUser()
    };

    // Send to backend API
    const response = await fetch('/api/chatbot/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('bup-token') || ''}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Simulate typing delay for more natural conversation
    const typingDelay = Math.random() *
      (CHATBOT_CONFIG.typingDelay.max - CHATBOT_CONFIG.typingDelay.min) +
      CHATBOT_CONFIG.typingDelay.min;

    setTimeout(() => {
      addBotMessage(data.response);
      chatbotState.isWaitingForResponse = false;
    }, typingDelay);

  } catch (error) {
    console.error('Chatbot API error:', error);

    // Fallback response if API fails
    setTimeout(() => {
      addBotMessage("I'm sorry, I'm having trouble connecting to my brain right now. Please try again later or contact support for immediate assistance.");
      chatbotState.isWaitingForResponse = false;
    }, 1000);
  }
}

/**
 * Get current user information for context
 */
function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('bup-current-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return {
        role: user.role || 'user',
        email: user.email || '',
        name: user.name || '',
        department: user.dept || ''
      };
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }

  return { role: 'guest' };
}

// Initialize chatbot on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure the page is fully loaded
  setTimeout(initChatbot, 1000);
});

// Expose functions globally
window.initChatbot = initChatbot;
window.toggleChatbot = toggleChatbot;
window.closeChatbot = closeChatbot;
