CREATE DATABASE IF NOT EXISTS akgs_empire;
USE akgs_empire;

-- جدول المستخدمين (لحفظ النقاط والمحافظ)
CREATE TABLE IF NOT EXISTS users (
    visitor_id VARCHAR(255) PRIMARY KEY,
    wallet_address VARCHAR(255),
    kick_username VARCHAR(255),
  instagram_username VARCHAR(255),
  twitter_username VARCHAR(255),
  threads_username VARCHAR(255),
  email VARCHAR(255),
  g_code VARCHAR(255),
  total_points INT DEFAULT 0,
  weekly_points INT DEFAULT 0,
  weekly_comments INT DEFAULT 0,
  chat_messages_count INT DEFAULT 0,
  referral_code VARCHAR(10) UNIQUE,
    referred_by VARCHAR(255),
    referral_count INT DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by) REFERENCES users(visitor_id) ON DELETE SET NULL
);

-- جدول المطالبات (المهام)
CREATE TABLE IF NOT EXISTS user_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id VARCHAR(255) NOT NULL,
    task_id INT NOT NULL,
    reward INT DEFAULT 0,
    platform VARCHAR(50),
    is_recurring BOOLEAN DEFAULT FALSE, -- هل المهمة متكررة؟
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES users(visitor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_claim (visitor_id, task_id) -- يمنع تكرار نفس المهمة (إلا إذا كانت متكررة، سنعالج ذلك برمجياً)
);
