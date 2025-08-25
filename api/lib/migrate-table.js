import pool from './db.js';

const migrateTable = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Starting table migration...');
    
    // First, backup existing data if any
    console.log('Checking for existing data...');
    const existingData = await client.query('SELECT * FROM surveys');
    
    if (existingData.rows.length > 0) {
      console.log(`Found ${existingData.rows.length} existing records. Creating backup...`);
      // Create a backup table
      await client.query(`
        CREATE TABLE surveys_backup AS
        SELECT * FROM surveys;
      `);
      console.log('Backup created as surveys_backup table');
    }
    
    // Drop the old table
    console.log('Dropping old table...');
    await client.query('DROP TABLE IF EXISTS surveys');
    
    // Create the new table with individual columns
    console.log('Creating new table structure...');
    await client.query(`
      CREATE TABLE surveys (
        user_name VARCHAR(255) PRIMARY KEY,
        survey_type VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        -- Student survey questions (29 questions + image)
        q1_name TEXT,
        q2_gender TEXT,
        q3_age TEXT,
        q4_place_of_origin TEXT,
        q5_current_residence TEXT,
        q6_year_completion TEXT,
        q7_education TEXT,
        q8_program_enrolled TEXT,
        q9_motivation_enroll TEXT,
        q10_motivation_job_market TEXT,
        q11_career_growth TEXT,
        q12_family_community_role TEXT,
        q13_role_models TEXT,
        q14_personal_goals TEXT,
        q15_left_job_reason TEXT,
        q16_work_life_balance TEXT,
        q17_discrimination TEXT,
        q18_skills_match TEXT,
        q19_communication_problems TEXT,
        q20_soft_skills_challenges TEXT,
        q21_other_left_job_reasons TEXT,
        q22_cultural_challenges TEXT,
        q23_current_employment_status TEXT,
        q24_job_duration TEXT,
        q25_monthly_income TEXT,
        q26_motivation_stay TEXT,
        q27_job_challenges TEXT,
        q28_overcome_challenges TEXT,
        q29_advice_for_others TEXT,
        image_url TEXT
      );
    `);
    
    console.log('New table created successfully!');
    
    // If there was existing data, try to migrate what we can
    if (existingData.rows.length > 0) {
      console.log('Attempting to migrate existing data...');
      
      for (const row of existingData.rows) {
        try {
          await client.query(`
            INSERT INTO surveys (user_name, survey_type, image_url, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_name) DO UPDATE SET
              survey_type = EXCLUDED.survey_type,
              image_url = EXCLUDED.image_url,
              created_at = EXCLUDED.created_at
          `, [row.user_name, row.survey_type, row.image_url, row.created_at]);
        } catch (err) {
          console.warn(`Failed to migrate record for user ${row.user_name}:`, err.message);
        }
      }
      
      console.log('Data migration completed. Check surveys_backup table for original data.');
    }
    
    console.log('Table migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run the migration
migrateTable().catch(console.error);
