// /api/latest.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
  const ASTRA_DB_KEYSPACE = process.env.ASTRA_DB_KEYSPACE;
  const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const CHAT_COLLECTION = 'cityofgitsdatas';

  const ASTRA_COLLECTION_URL = `${ASTRA_DB_API_ENDPOINT}/api/rest/v2/namespaces/${ASTRA_DB_KEYSPACE}/collections/${CHAT_COLLECTION}?page-size=20`;

  try {
    const response = await fetch(ASTRA_COLLECTION_URL, {
      headers: {
        'X-Cassandra-Token': ASTRA_DB_APPLICATION_TOKEN
      }
    });

    const data = await response.json();
    const docs = data?.data ? Object.values(data.data) : [];

    const sorted = docs
      .filter(doc => doc.timestamp)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(200).json(sorted.slice(-5));
  } catch (error) {
    console.error('Error fetching latest messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
