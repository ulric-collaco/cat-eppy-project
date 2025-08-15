const pool = require('./db.js');

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255) NOT NULL,
    survey_type VARCHAR(255) NOT NULL,
    question1 TEXT,
    question2 TEXT,
    question3 TEXT,
    -- store dynamic or additional follow-up answers here as JSON
    custom_questions JSONB,
    image_url TEXT,
    image_public_id TEXT
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