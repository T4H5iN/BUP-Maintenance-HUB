/**
 * Service class for Rule-Based Chatbot (No AI API usage)
 */
class RuleBasedChatbotService {
  constructor() {
    this.initialized = true;

    // Knowledge base for the chatbot
    this.knowledgeBase = [
      {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'start'],
        response: "Hello! I'm the BUP Maintenance Assistant. I can help you with reporting issues, checking status, or contact information. How can I assist you today?"
      },
      {
        keywords: ['report', 'create', 'submit', 'new issue', 'complaint'],
        response: "To report a new maintenance issue:\n1. Go to the 'Report Issue' page.\n2. Fill in the location and description.\n3. Select the category (Electrical, Plumbing, etc.).\n4. Upload a photo if possible.\n5. Click 'Submit'.\n\nYour issue will be tracked immediately!"
      },
      {
        keywords: ['status', 'track', 'progress', 'update', 'check'],
        response: "You can check the status of your reported issues in the 'My Issues' dashboard. The status will show as 'Pending', 'Assigned', 'In Progress', or 'Resolved'."
      },
      {
        keywords: ['contact', 'call', 'email', 'admin', 'support', 'phone'],
        response: "You can contact the Maintenance Department directly:\n\nEmail: maintenance@bup.edu.bd\nPhone: +880-1234-567890\nLocation: Administrative Building, Room 101."
      },
      {
        keywords: ['electricity', 'light', 'fan', 'power', 'socket', 'bulb'],
        response: "For electrical issues like faulty lights, fans, or power sockets, please select the 'Electricity' category when reporting. If it's a dangerous hazard (sparks, fire), please call the emergency line immediately."
      },
      {
        keywords: ['water', 'plumbing', 'leak', 'tap', 'sink', 'toilet', 'bathroom'],
        response: "For plumbing issues like water leaks, broken taps, or bathroom problems, please use the 'Sanitary' category. Our plumbers are available from 8 AM to 4 PM."
      },
      {
        keywords: ['ac', 'air conditioner', 'cooling', 'warm'],
        response: "AC maintenance requests are handled by the HVAC team. Please report it under 'Electricity' or 'Others' and specify 'AC' in the description. Mention the room number clearly."
      },
      {
        keywords: ['internet', 'wifi', 'network', 'slow'],
        response: "Internet and WiFi issues are handled by the ICT Cell, not the Maintenance Department. Please contact the ICT helpdesk at ict@bup.edu.bd."
      },
      {
        keywords: ['bus', 'transport', 'schedule', 'ticket'],
        response: "I focus on facility maintenance. For bus schedules and transport queries, please check the 'Transportation' section on the BUP website or contact the Transport Section."
      },
      {
        keywords: ['furniture', 'chair', 'table', 'desk', 'bench', 'broken'],
        response: "Broken furniture can be reported under the 'Furniture' category. Please attach a photo of the damage to help us bring the right tools."
      },
      {
        keywords: ['clean', 'dust', 'garbage', 'trash', 'dirty'],
        response: "Cleaning requests should be reported under 'Civil' or 'Others'. Our janitorial staff checks these requests daily."
      },
      {
        keywords: ['emergency', 'fire', 'smoke', 'danger'],
        response: "🔴 URGENT: If this is a life-threatening emergency (Fire, Gas Leak), call the BUP Emergency Hotline immediately: 333 or 999. Do not wait for the app."
      },
      {
        keywords: ['thank', 'thanks', 'good', 'bye'],
        response: "You're welcome! Happy to help. Have a great day at BUP!"
      }
    ];

    this.defaultResponse = "I'm not sure I understood that specific question. I can help you with:\n\n- Reporting Issues\n- Checking Status\n- Contacting Support\n- Specifics about Electrical, Plumbing, or Furniture problems.\n\nPlease try phrasing your question with one of these topics.";
  }

  /**
   * generateResponse - Matches user input against keywords to find the best response.
   * @param {Array} messages - Array of message objects (we only care about the last one)
   * @param {Object} userContext - (Optional) User info, unused in simple rule-based but kept for signature compatibility
   */
  async generateResponse(messages, userContext) {
    if (!messages || messages.length === 0) {
      return this.defaultResponse;
    }

    // Get the last message from the user
    const lastMessage = messages[messages.length - 1];
    const userText = (lastMessage.content || "").toLowerCase();

    // 1. Direct Keyword Matching
    for (const item of this.knowledgeBase) {
      // Check if ANY keyword exists in the user text
      const match = item.keywords.some(keyword => userText.includes(keyword));
      if (match) {
        return item.response;
      }
    }

    // 2. Fallback
    return this.defaultResponse;
  }

  /**
   * Health check
   */
  async checkHealth() {
    return true; // Always healthy
  }

  /**
   * List available models (Legacy compatibility)
   */
  async listAvailableModels() {
    return ['rule-based-v1'];
  }
}

module.exports = { GeminiChatbotService: RuleBasedChatbotService };
