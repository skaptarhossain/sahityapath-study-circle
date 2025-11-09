/**
 * Proxy server for SahityaPath Study Circle
 * Routes /api/generate requests to Google Gemini API
 */

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sahityapath-proxy' });
});

// Gemini API proxy endpoint
app.post('/api/generate', async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_KEY not configured. Please add it to your environment variables or .env file.' 
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(response.status).json({ 
        error: 'Gemini API request failed',
        details: errorText 
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';
    
    res.json({ text, output: text });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Proxy server listening on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API endpoint: http://localhost:${PORT}/api/generate`);
  if (!process.env.GEMINI_KEY) {
    console.warn('⚠ Warning: GEMINI_KEY environment variable is not set');
  }
});
