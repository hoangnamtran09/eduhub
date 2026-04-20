const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Using database URL:', connectionString ? 'URL is set' : 'URL NOT SET');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Extension "vector" enabled');
  } catch (err) {
    console.error('Error enabling extension:', err);
  } finally {
    await client.end();
  }
}

main();
