const { sql, poolPromise } = require('./src/config/database');

async function migrateOAuth() {
    try {
        const pool = await poolPromise;
        console.log('Connected to database. Running OAuth migration...');

        // 1. Add google_id
        console.log('Adding google_id column...');
        try {
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Users') AND name = 'google_id'
                )
                BEGIN
                    ALTER TABLE Users ADD google_id NVARCHAR(255) NULL;
                END
            `);
            
            // Try adding unique filtered index
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.indexes 
                    WHERE object_id = OBJECT_ID('Users') AND name = 'UQ_Users_GoogleId'
                )
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_GoogleId ON Users(google_id) WHERE google_id IS NOT NULL;
                END
            `);
            console.log('google_id added successfully.');
        } catch (e) {
            console.log('google_id error:', e.message);
        }

        // 2. Add github_id
        console.log('Adding github_id column...');
        try {
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Users') AND name = 'github_id'
                )
                BEGIN
                    ALTER TABLE Users ADD github_id NVARCHAR(255) NULL;
                END
            `);

            // Try adding unique filtered index
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.indexes 
                    WHERE object_id = OBJECT_ID('Users') AND name = 'UQ_Users_GithubId'
                )
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_GithubId ON Users(github_id) WHERE github_id IS NOT NULL;
                END
            `);
            console.log('github_id added successfully.');
        } catch (e) {
            console.log('github_id error:', e.message);
        }

        // 3. Alter password_hash to allow NULL
        console.log('Altering password_hash to allow NULL...');
        try {
            await pool.request().query(`
                ALTER TABLE Users ALTER COLUMN password_hash NVARCHAR(255) NULL;
            `);
            console.log('password_hash altered successfully.');
        } catch (e) {
            console.log('password_hash alter error:', e.message);
        }

        console.log('OAuth Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrateOAuth();
