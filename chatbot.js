async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  appendMessage('user', message);
  input.value = '';

  const botMsg = appendMessage('bot', '...');
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    botMsg.textContent = data.reply;
  } catch (error) {
    botMsg.textContent = 'Error reaching Gemini server.';
  }
}

function quickAsk(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

function appendMessage(sender, message) {
  const chatBox = document.getElementById('chat-box');
  const p = document.createElement('p');
  p.className = sender;
  p.textContent = (sender === 'user' ? 'You: ' : 'Bot: ') + message;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
  return p;
}
