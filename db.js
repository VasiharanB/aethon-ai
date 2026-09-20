const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("MySQL Pool Connected");

function addColumnIfNotExists(table, column, definition) {
  db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
    if (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column")) {
        return;
      }
      console.error(`Error adding column ${column} to ${table}:`, err);
    } else {
      console.log(`Column ${column} added to table ${table}`);
    }
  });
}

addColumnIfNotExists("assigned_students", "auto_submitted", "TINYINT(1) DEFAULT 0 AFTER submitted");
addColumnIfNotExists("assigned_students", "started", "TINYINT(1) DEFAULT 0 AFTER auto_submitted");
addColumnIfNotExists("assigned_students", "resume_count", "INT DEFAULT 0 AFTER started");
addColumnIfNotExists("student_results", "auto_submitted", "TINYINT(1) DEFAULT 0 AFTER score");
addColumnIfNotExists("proctoring_logs", "status", "VARCHAR(50) DEFAULT 'Review' AFTER file_path");
addColumnIfNotExists("student_answers", "language", "VARCHAR(50) DEFAULT NULL");
addColumnIfNotExists("users", "joining_year", "INT DEFAULT NULL");
addColumnIfNotExists("users", "passing_year", "INT DEFAULT NULL");

db.query(`
  CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    question_id INT NOT NULL,
    selected_option VARCHAR(255) DEFAULT NULL,
    code_submitted TEXT DEFAULT NULL,
    is_correct TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_question (assessment_id, student_email, question_id),
    CONSTRAINT fk_answers_assessment FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
`, (err) => {
  if (err) {
    console.error("Error creating student_answers table:", err);
  } else {
    console.log("student_answers table verified/created.");
  }
});

module.exports = db;
