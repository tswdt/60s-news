-- 用户表
CREATE TABLE users (
  user_id VARCHAR(64) PRIMARY KEY,
  nick_name VARCHAR(100),
  avatar_url VARCHAR(255),
  gender TINYINT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 题库表
CREATE TABLE questions (
  id INT PRIMARY KEY,
  dimension VARCHAR(50),
  question TEXT,
  optionA VARCHAR(255),
  scoreA INT,
  optionB VARCHAR(255),
  scoreB INT,
  optionC VARCHAR(255),
  scoreC INT,
  optionD VARCHAR(255),
  scoreD INT
);

-- 答题记录
CREATE TABLE answers (
  answer_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64),
  question_id INT,
  selected_option CHAR(1),
  score INT,
  answer_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- 局表（room）
CREATE TABLE rooms (
  room_id VARCHAR(64) PRIMARY KEY,
  creator VARCHAR(64),
  status VARCHAR(20),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  finish_time DATETIME
);

-- 局参与用户表
CREATE TABLE room_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(64),
  user_id VARCHAR(64),
  join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 结果表
CREATE TABLE results (
  room_id VARCHAR(64),
  user_id VARCHAR(64),
  score FLOAT,
  type VARCHAR(50),
  data JSON,
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 分享记录
CREATE TABLE share_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(64),
  from_user VARCHAR(64),
  to_user VARCHAR(64),
  click_time DATETIME
);

-- 广告曝光记录
CREATE TABLE ad_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64),
  ad_type VARCHAR(50),
  event_type VARCHAR(50),
  revenue FLOAT,
  event_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
