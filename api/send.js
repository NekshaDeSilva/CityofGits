// /api/send.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
  const ASTRA_DB_KEYSPACE = process.env.ASTRA_DB_KEYSPACE;
  const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const CHAT_COLLECTION = 'cityofgitsdatas';

  const ASTRA_COLLECTION_URL = `${ASTRA_DB_API_ENDPOINT}/api/rest/v2/namespaces/${ASTRA_DB_KEYSPACE}/collections/${CHAT_COLLECTION}`;

  const payload = {
    message,
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
      const text = await response.text();
      throw new Error(text);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}
