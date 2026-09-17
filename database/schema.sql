-- =========================================
-- TaskFlow Database Schema Script
-- =========================================

-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TaskFlowDB')
BEGIN
    CREATE DATABASE TaskFlowDB;
END
GO

USE TaskFlowDB;
GO

-- 1. Users Table
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    current_streak INT DEFAULT 0,
    highest_streak INT DEFAULT 0,
    last_active_date DATE NULL
);

-- 2. Categories Table
CREATE TABLE Categories (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    color NVARCHAR(20) DEFAULT '#000000',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Categories_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    -- Unique constraint required to allow composite foreign key from Tasks
    CONSTRAINT UQ_Categories_Id_UserId UNIQUE (id, user_id)
);

-- 3. Tasks Table
CREATE TABLE Tasks (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    category_id INT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'TODO', -- TODO, IN_PROGRESS, COMPLETED
    priority NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    due_date DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Tasks_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    
    -- Enforce that if a task has a category, the category MUST belong to the same user.
    -- If category_id is NULL, SQL Server bypasses this composite FK check.
    CONSTRAINT FK_Tasks_Categories FOREIGN KEY (category_id, user_id) REFERENCES Categories(id, user_id) ON DELETE NO ACTION,
    
    -- Status and Priority CHECK constraints
    CONSTRAINT CHK_Tasks_Status CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT CHK_Tasks_Priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
);

-- 4. Subtasks Table
CREATE TABLE Subtasks (
    id INT PRIMARY KEY IDENTITY(1,1),
    task_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    estimated_time NVARCHAR(100) NULL,
    is_completed BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Subtasks_Tasks FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE
);

-- 5. RefreshTokens Table
CREATE TABLE RefreshTokens (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    hashed_token NVARCHAR(512) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 6. ChatMessages Table
CREATE TABLE ChatMessages (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    role NVARCHAR(50) NOT NULL, -- 'user' or 'assistant'
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ChatMessages_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 7. DailyActivity Table (Heatmap)
CREATE TABLE DailyActivity (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    activity_date DATE NOT NULL,
    tasks_completed INT DEFAULT 0,
    CONSTRAINT FK_DailyActivity_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_DailyActivity_UserDate UNIQUE (user_id, activity_date)
);

-- =========================================
-- Indexes for Performance
-- =========================================
CREATE INDEX IX_Tasks_user_id ON Tasks(user_id);
CREATE INDEX IX_Tasks_category_id ON Tasks(category_id);
CREATE INDEX IX_Tasks_status ON Tasks(status);
CREATE INDEX IX_Tasks_priority ON Tasks(priority);
CREATE INDEX IX_Tasks_due_date ON Tasks(due_date);

CREATE INDEX IX_Categories_user_id ON Categories(user_id);
CREATE INDEX IX_RefreshTokens_user_id ON RefreshTokens(user_id);
