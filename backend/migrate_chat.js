const { sql, poolPromise } = require('./src/config/database');

async function run() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatMessages' and xtype='U')
            BEGIN
                CREATE TABLE ChatMessages (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    user_id INT NOT NULL,
                    role NVARCHAR(50) NOT NULL,
                    content NVARCHAR(MAX) NOT NULL,
                    created_at DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_ChatMessages_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
                );
            END
        `);
        console.log('Migration done.');
        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}
run();
