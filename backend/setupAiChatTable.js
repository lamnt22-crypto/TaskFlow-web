require('dotenv').config();
const { sql, poolPromise } = require('./src/config/database');

async function setup() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatMessages' and xtype='U')
            BEGIN
                CREATE TABLE ChatMessages (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_id INT NOT NULL,
                    role NVARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
                    content NVARCHAR(MAX) NOT NULL,
                    created_at DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
                )
                PRINT 'ChatMessages table created successfully.'
            END
            ELSE
            BEGIN
                PRINT 'ChatMessages table already exists.'
            END
        `);
        console.log("Chat table setup script executed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Database error:", err);
        process.exit(1);
    }
}
setup();
