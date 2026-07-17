const db = require("./db");

db.query("SHOW COLUMNS FROM assigned_students LIKE 'started'", (err, results) => {
  if (err) {
    console.error("Error checking columns:", err);
    process.exit(1);
  }
  if (results.length === 0) {
    console.log("Column 'started' does NOT exist. Creating it...");
    db.query("ALTER TABLE assigned_students ADD COLUMN started TINYINT(1) DEFAULT 0 AFTER auto_submitted", (err2) => {
      if (err2) console.error("Error adding 'started':", err2);
      else console.log("Column 'started' added successfully.");
      
      checkResumeCount();
    });
  } else {
    console.log("Column 'started' exists.");
    checkResumeCount();
  }
});

function checkResumeCount() {
  db.query("SHOW COLUMNS FROM assigned_students LIKE 'resume_count'", (err, results) => {
    if (err) {
      console.error("Error checking resume_count:", err);
      process.exit(1);
    }
    if (results.length === 0) {
      console.log("Column 'resume_count' does NOT exist. Creating it...");
      db.query("ALTER TABLE assigned_students ADD COLUMN resume_count INT DEFAULT 0 AFTER started", (err2) => {
        if (err2) console.error("Error adding 'resume_count':", err2);
        else console.log("Column 'resume_count' added successfully.");
        process.exit(0);
      });
    } else {
      console.log("Column 'resume_count' exists.");
      process.exit(0);
    }
  });
}
