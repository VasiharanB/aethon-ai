const mysql = require("mysql2");
const db = mysql.createConnection({ host: "localhost", user: "root", password: "", database: "portfolio" });


db.query(
  "DELETE t1 FROM student_results t1 INNER JOIN student_results t2 WHERE t1.id > t2.id AND t1.assessment_id = t2.assessment_id AND t1.student_email = t2.student_email",
  (err) => {
    if (err) {
      console.error("Error deleting duplicates:", err);
      process.exit(1);
    }
    console.log("Deleted duplicates.");

    
    db.query(
      "ALTER TABLE student_results ADD UNIQUE KEY unique_assessment_student (assessment_id, student_email)",
      (err2) => {
        if (err2 && err2.code !== 'ER_DUP_KEYNAME') {
          console.error("Error adding constraint:", err2);
        } else {
          console.log("Added UNIQUE constraint successfully.");
        }
        process.exit(0);
      }
    );
  }
);
