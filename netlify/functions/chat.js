exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const allowedOrigins = [
    'https://harmonious-kitten-9abf39.netlify.app',
    'http://localhost:3000'
  ];
  const origin = event.headers.origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': corsOrigin },
        body: JSON.stringify({ error: 'Invalid request' })
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: 'You are HealthBuddy AI, a compassionate health assistant. Help users understand their symptoms with empathy and clarity. Ask one clarifying question at a time (duration, then severity 1-10). Give practical home care advice. Always state clearly when to see a doctor or call 112. End every response with a one-line disclaimer. Keep replies under 5 sentences. Understand both English and Romanian.',
        messages: messages
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': corsOrigin },
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
