const pool = require('./db.js');

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255) NOT NULL,
    survey_type VARCHAR(255) NOT NULL,
    question1 TEXT NOT NULL,
    question2 TEXT NOT NULL,
    question3 TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_public_id TEXT NOT NULL
  );
`;

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(createTableQuery);
    console.log('Table "surveys" created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
    pool.end();
  }
};

createTables();