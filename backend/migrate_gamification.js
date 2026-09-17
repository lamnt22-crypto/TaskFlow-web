const { poolPromise } = require('./src/config/database');

async function run() {
    try {
        const pool = await poolPromise;
        
        // Add columns to Users table if they don't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'current_streak')
            BEGIN
                ALTER TABLE Users ADD current_streak INT DEFAULT 0;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'highest_streak')
            BEGIN
                ALTER TABLE Users ADD highest_streak INT DEFAULT 0;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'last_active_date')
            BEGIN
                ALTER TABLE Users ADD last_active_date DATE NULL;
            END
        `);
        
        // Create DailyActivity table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DailyActivity' and xtype='U')
            BEGIN
                CREATE TABLE DailyActivity (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    user_id INT NOT NULL,
                    activity_date DATE NOT NULL,
                    tasks_completed INT DEFAULT 0,
                    CONSTRAINT FK_DailyActivity_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                    CONSTRAINT UQ_DailyActivity_UserDate UNIQUE (user_id, activity_date)
                );
            END
        `);
        
        console.log('Migration for Gamification done.');
        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}
run();
