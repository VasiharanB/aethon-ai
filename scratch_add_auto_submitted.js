const mysql = require("mysql2");
const db = mysql.createConnection({
  host: "localhost", user: "root", password: "", database: "portfolio"
});

db.connect(err => {
  if (err) {
    console.error("DB Connection Error:", err);
    process.exit(1);
  }

  
  db.query("ALTER TABLE assigned_students ADD COLUMN auto_submitted TINYINT(1) DEFAULT 0 AFTER submitted", (err) => {
    if (err && !err.message.includes("Duplicate column")) {
      console.error("Error altering assigned_students:", err);
    } else {
      console.log("Successfully altered assigned_students table (added auto_submitted).");
    }

    
    db.query("ALTER TABLE student_results ADD COLUMN auto_submitted TINYINT(1) DEFAULT 0 AFTER score", (err) => {
      if (err && !err.message.includes("Duplicate column")) {
        console.error("Error altering student_results:", err);
      } else {
        console.log("Successfully altered student_results table (added auto_submitted).");
      }
      process.exit(0);
    });
  });
});
