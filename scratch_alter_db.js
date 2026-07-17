const mysql = require("mysql2");
const db = mysql.createConnection({
  host: "localhost", user: "root", password: "", database: "portfolio"
});

db.connect(err => {
  if (err) { console.error(err); process.exit(1); }

  db.query("ALTER TABLE student_results ADD COLUMN assessment_title VARCHAR(255) AFTER assessment_id", (err) => {
    if (err && !err.message.includes("Duplicate column")) console.error(err);
    console.log("Added assessment_title column");
    
    
    db.query(`
      UPDATE student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      SET sr.assessment_title = a.title
    `, (err) => {
      if (err) console.error(err);
      console.log("Updated existing rows with titles");
      process.exit(0);
    });
  });
});
