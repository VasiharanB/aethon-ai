const mysql = require("mysql2");
const db = mysql.createConnection({
  host: "localhost", user: "root", password: "", database: "portfolio"
});

db.connect(err => {
  if (err) { console.error(err); process.exit(1); }

  const email = "shameem123@gmail.com";
  
  
  db.query(`INSERT INTO assessments (title, start_time, end_time, description, total_time) VALUES (?, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 2 DAY, ?, ?)`, 
  ["Full Stack Engineering Assessment", "A comprehensive test covering React and Node.js", 60], 
  (err, res) => {
    if (err) { console.error(err); return; }
    const assessmentId = res.insertId;
    console.log("Created Assessment ID:", assessmentId);

    
    const assigned = [
      [assessmentId, email, 1],
      [assessmentId, "student2@gmail.com", 1],
      [assessmentId, "student3@gmail.com", 1],
      [assessmentId, "student4@gmail.com", 1],
      [assessmentId, "student5@gmail.com", 1]
    ];
    db.query(`INSERT INTO assigned_students (assessment_id, student_email, submitted) VALUES ?`, [assigned], (err) => {
      if (err) { console.error(err); }
      console.log("Assigned students");

      
      const results = [
        [assessmentId, email, 85, 85.00],
        [assessmentId, "student2@gmail.com", 92, 92.00],
        [assessmentId, "student3@gmail.com", 78, 78.00],
        [assessmentId, "student4@gmail.com", 65, 65.00],
        [assessmentId, "student5@gmail.com", 45, 45.00]
      ];
      db.query(`INSERT INTO student_results (assessment_id, student_email, score, percentage) VALUES ?`, [results], (err) => {
         if (err) { console.error(err); }
         console.log("Inserted mock results");

         
         const questions = [
            [assessmentId, "React", 0, "mcq", "React Hook", "Which hook?", "use", "use2", "use3", "useState", "useState", "Easy", 10],
            [assessmentId, "Node", 0, "mcq", "Node server", "Which framework?", "Express", "Flask", "Django", "Spring", "Express", "Easy", 10]
         ];
         db.query(`INSERT INTO questions (assessment_id, section_name, section_id, question_type, question_title, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks) VALUES ?`, [questions], (err) => {
            if (err) { console.error(err); }
            console.log("Inserted mock questions");
            process.exit(0);
         });
      });
    });
  });
});
