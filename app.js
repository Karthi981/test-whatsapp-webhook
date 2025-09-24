// Import modules
const express = require('express');
const fs = require('fs');
const path = require('path');

// Create app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN || 'YOUR_VERIFY_TOKEN';

// Ensure log folder exists
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Log file path
const logFile = path.join(logDir, 'webhook.log');

// Helper function to log events
function logEvent(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const logEntry = `${timestamp} - ${message}\n`;
  fs.appendFileSync(logFile, logEntry, { encoding: 'utf8' });
  console.log(logEntry);
}

// -------------------
// GET /whatsapp/v1/webhook - verification
// -------------------
app.get('/whatsapp/v1/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  logEvent(`Webhook verification attempt - mode: ${mode}, token: ${token}, challenge: ${challenge}`);

  if (mode === 'subscribe' && token === verifyToken) {
    logEvent('Webhook verified successfully');
    res.status(200).send(challenge); // Respond with plain text
  } else {
    logEvent('Webhook verification failed');
    res.status(403).end();
  }
});

// -------------------
// POST /whatsapp/v1/webhook - webhook events
// -------------------
app.post('/whatsapp/v1/webhook', (req, res) => {
  const body = req.body;
  logEvent(`Webhook POST received: ${JSON.stringify(body, null, 2)}`);
  res.status(200).end();
});

// -------------------
// GET /log - show all logs
// -------------------
app.get('/log', (req, res) => {
  if (!fs.existsSync(logFile)) {
    return res.send('<h3>No logs yet.</h3>');
  }
  const logs = fs.readFileSync(logFile, 'utf8');
  // Simple HTML display
  res.send(`<pre>${logs}</pre>`);
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
