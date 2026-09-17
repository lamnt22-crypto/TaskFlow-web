const { sql, poolPromise } = require('./src/config/database');

async function createTable() {
  try {
    const pool = await poolPromise;
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Subtasks' and xtype='U')
      BEGIN
        CREATE TABLE Subtasks (
            id INT IDENTITY(1,1) PRIMARY KEY,
            task_id INT NOT NULL,
            title NVARCHAR(255) NOT NULL,
            is_completed BIT DEFAULT 0,
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE(),
            CONSTRAINT FK_Subtasks_Tasks FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE
        );
        PRINT 'Table Subtasks created successfully.';
      END
      ELSE
      BEGIN
        PRINT 'Table Subtasks already exists.';
      END
    `;
    await pool.request().query(query);
    process.exit(0);
  } catch (err) {
    console.error('Error creating Subtasks table:', err);
    process.exit(1);
  }
}

createTable();
