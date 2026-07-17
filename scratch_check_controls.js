const db = require("./db");
db.query("SELECT * FROM exam_controls WHERE assessment_id = 60", (err, results) => {
  console.log("Exam controls for ID 60:", results);
  process.exit(0);
});
