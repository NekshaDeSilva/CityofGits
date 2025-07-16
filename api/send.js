// /api/send.js

import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('➡️ /api/send HIT');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Validate body content
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  // Load environment variables
  const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
  const ASTRA_DB_KEYSPACE = process.env.ASTRA_DB_KEYSPACE;
  const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;

  console.log('🔐 ENV Check:', {
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_KEYSPACE,
    ASTRA_DB_APPLICATION_TOKEN_SET: !!ASTRA_DB_APPLICATION_TOKEN
  });

  // Sanity check
  if (!ASTRA_DB_API_ENDPOINT || !ASTRA_DB_KEYSPACE || !ASTRA_DB_APPLICATION_TOKEN) {
    return res.status(500).json({ error: 'Missing Astra DB configuration' });
  }

  const CHAT_COLLECTION = 'cityofgitsdatas';
  const ASTRA_COLLECTION_URL = `${ASTRA_DB_API_ENDPOINT}/api/rest/v2/namespaces/${ASTRA_DB_KEYSPACE}/collections/${CHAT_COLLECTION}`;

  const payload = {
    message: message.trim(),
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(ASTRA_COLLECTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cassandra-Token': ASTRA_DB_APPLICATION_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AstraDB Error:', errorText);
      return res.status(500).json({ error: 'Failed to store message', details: errorText });
    }

    console.log('✅ Message stored successfully');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
