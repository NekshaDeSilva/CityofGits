import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  // Pull environment variables
  const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
  const ASTRA_DB_KEYSPACE = process.env.ASTRA_DB_KEYSPACE;
  const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const CHAT_COLLECTION = 'cityofgitsdatas';

  if (!ASTRA_DB_API_ENDPOINT || !ASTRA_DB_KEYSPACE || !ASTRA_DB_APPLICATION_TOKEN) {
    console.error('Missing env vars:');
    console.error('ASTRA_DB_API_ENDPOINT:', ASTRA_DB_API_ENDPOINT);
    console.error('ASTRA_DB_KEYSPACE:', ASTRA_DB_KEYSPACE);
    console.error('ASTRA_DB_APPLICATION_TOKEN:', !!ASTRA_DB_APPLICATION_TOKEN);
    return res.status(500).json({ error: 'Missing Astra DB environment configuration' });
  }

  const ASTRA_COLLECTION_URL = `${ASTRA_DB_API_ENDPOINT}/api/rest/v2/namespaces/${ASTRA_DB_KEYSPACE}/collections/${CHAT_COLLECTION}`;
  const payload = { message: message.trim(), timestamp: new Date().toISOString() };

  console.log('Sending to:', ASTRA_COLLECTION_URL);
  console.log('Payload:', payload);

  try {
    const response = await fetch(ASTRA_COLLECTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cassandra-Token': ASTRA_DB_APPLICATION_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('AstraDB response:', response.status, responseText);

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to store message', detail: responseText });
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Failed to send message', detail: error.message });
  }
}
