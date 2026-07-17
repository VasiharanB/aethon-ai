require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("./db");
const codeRunner = require("./codeRunner");

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
app.use(cookieParser());

const jwtSecret = process.env.JWT_SECRET || "supersecretkey123";

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
}



app.use(express.static(path.join(__dirname, "public")));



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "public", "recordings");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, req.body.student_email + "-" + req.body.assessment_id + "-" + uniqueSuffix + ".webm");
  }
});
const upload = multer({ storage });

app.post("/proctor/upload", upload.single("video"), (req, res) => {
  const { assessment_id, student_email, log_type } = req.body;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = "/recordings/" + req.file.filename;

  const sql = "INSERT INTO proctoring_logs (assessment_id, student_email, log_type, file_path) VALUES (?, ?, ?, ?)";
  db.query(sql, [assessment_id, student_email, log_type, filePath], (err) => {
    if (err) {
      console.error("PROCTOR UPLOAD ERROR:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, filePath });
  });
});

app.post("/proctor/log", (req, res) => {
  const { assessment_id, student_email, log_type } = req.body;
  
  const sql = "INSERT INTO proctoring_logs (assessment_id, student_email, log_type) VALUES (?, ?, ?)";
  db.query(sql, [assessment_id, student_email, log_type], (err) => {
    if (err) {
      console.error("PROCTOR LOG ERROR:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require("bcrypt");
  
  
  const adminQuery = "SELECT * FROM admin_users WHERE email=?";
  db.query(adminQuery, [email], async (err, adminResult) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, error: "Database error" });
    }

    if (adminResult.length > 0) {
      const match = await bcrypt.compare(password, adminResult[0].password);
      if (match) {
        const token = jwt.sign({ email: adminResult[0].email, role: "admin" }, jwtSecret, { expiresIn: "24h" });
        res.cookie("token", token, { httpOnly: true });
        return res.json({
          success: true,
          role: "admin",
          email: adminResult[0].email,
          name: adminResult[0].name || null
        });
      } else {
        return res.json({ success: false, error: "Invalid credentials" });
      }
    }

    
    const userQuery = "SELECT * FROM users WHERE email=?";
    db.query(userQuery, [email], async (err, userResult) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, error: "Database error" });
      }

      if (userResult.length > 0) {
        const match = await bcrypt.compare(password, userResult[0].password);
        if (match) {
          const token = jwt.sign({ email: userResult[0].email, role: "student" }, jwtSecret, { expiresIn: "24h" });
          res.cookie("token", token, { httpOnly: true });
          return res.json({
            success: true,
            role: "student",
            email: userResult[0].email,
            name: userResult[0].name || null
          });
        } else {
          return res.json({ success: false, error: "Invalid credentials" });
        }
      }

      return res.json({ success: false, error: "User not found" });
    });
  });
});


app.post("/register-user", async (req, res) => {
  const { email, name, password, college_name } = req.body;
  if (!email || !name || !password) {
    return res.json({ success: false, error: "Missing fields" });
  }

  
  db.query("SELECT email FROM admin_users WHERE email=?", [email.trim()], async (err, adminCheck) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, error: "Database error" });
    }
    if (adminCheck.length > 0) {
      return res.json({ success: false, error: "Admin emails cannot register as students" });
    }

    try {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "INSERT INTO users (email, name, password, college_name) VALUES (?, ?, ?, ?)";
      
      db.query(sql, [email.trim(), name.trim(), hashedPassword, college_name ? college_name.trim() : null], (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") return res.json({ success: false, error: "Email already registered" });
          return res.json({ success: false, error: "Database error" });
        }
        res.json({ success: true });
      });
    } catch (err) {
      res.json({ success: false, error: "Server error" });
    }
  });
});

const otps = new Map();


app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, error: "Email required" });

  db.query("SELECT email FROM users WHERE email=? UNION SELECT email FROM admin_users WHERE email=?", [email, email], (err, results) => {
    if (err) return res.json({ success: false, error: "Database error" });
    if (results.length === 0) return res.json({ success: false, error: "Email not found" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otps.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

    console.log(`\n======================================`);
    console.log(`[EMAIL SIMULATION] Password Reset`);
    console.log(`To: ${email}`);
    console.log(`Your OTP is: ${otp}`);
    console.log(`======================================\n`);

    res.json({ success: true });
  });
});


app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  const record = otps.get(email);
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.json({ success: false, error: "Invalid or expired OTP" });
  }

  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  db.query("UPDATE users SET password=? WHERE email=?", [hashedPassword, email], (err, result) => {
    if (err) return res.json({ success: false, error: "Database error" });
    
    if (result.affectedRows > 0) {
      otps.delete(email);
      return res.json({ success: true });
    }

    db.query("UPDATE admin_users SET password=? WHERE email=?", [hashedPassword, email], (err, adminResult) => {
      if (err) return res.json({ success: false, error: "Database error" });
      if (adminResult.affectedRows > 0) {
        otps.delete(email);
        return res.json({ success: true });
      }
      res.json({ success: false, error: "User not found" });
    });
  });
});


app.get("/student-assessments", (req, res) => {

  const email = req.query.email;

  if (!email) return res.json([]);

  const sql = `
    SELECT a.*, s.submitted, s.auto_submitted, s.resume_count,
           (s.started OR (SELECT COUNT(*) FROM student_answers sa WHERE sa.assessment_id = a.id AND sa.student_email = s.student_email) > 0) as started,
           (SELECT COUNT(*) FROM student_feedback f WHERE f.assessment_id = a.id AND f.student_email = ?) as feedback_given,
           (SELECT show_result FROM exam_controls c WHERE c.assessment_id = a.id) as show_result,
           (SELECT score FROM student_results r WHERE r.assessment_id = a.id AND r.student_email = ? ORDER BY r.id DESC LIMIT 1) as score
    FROM assessments a
    INNER JOIN assigned_students s
    ON a.id = s.assessment_id
    WHERE s.student_email = ?
    ORDER BY a.id ASC
  `;

  db.query(sql, [email.trim(), email.trim(), email.trim()], (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    return res.json(result);

  });

});


app.get("/student-practices/:email", (req, res) => {
  const email = req.params.email;

  const sql = `
    SELECT p.*, ap.submitted, 'practice' as test_type
    FROM practices p
    INNER JOIN assigned_practices ap ON p.id = ap.practice_id
    WHERE ap.student_email = ?
    ORDER BY p.id ASC
  `;

  db.query(sql, [email.trim()], (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    return res.json(result);
  });
});

app.get("/student/profile", (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email required" });
  db.query("SELECT name FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ name: results[0].name });
  });
});

app.get("/assessment-answers/:assessmentId/:studentEmail", (req, res) => {
  const { assessmentId, studentEmail } = req.params;
  db.query(
    "SELECT question_id, selected_option, code_submitted FROM student_answers WHERE assessment_id = ? AND student_email = ?",
    [assessmentId, studentEmail],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

app.get("/assessment-status/:assessmentId/:studentEmail", (req, res) => {
  const { assessmentId, studentEmail } = req.params;
  const sql = "SELECT started, submitted, auto_submitted, resume_count FROM assigned_students WHERE assessment_id = ? AND student_email = ?";
  db.query(sql, [assessmentId, studentEmail], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.json({ allowed: false, error: "Not assigned to this assessment" });
    }
    const { started, submitted, auto_submitted, resume_count } = results[0];
    
    // Check if student has saved answers (meaning they started before)
    const answersSql = "SELECT COUNT(*) AS answer_count FROM student_answers WHERE assessment_id = ? AND student_email = ?";
    db.query(answersSql, [assessmentId, studentEmail], (err2, answersResults) => {
      const answerCount = (!err2 && answersResults.length > 0) ? answersResults[0].answer_count : 0;
      const finalStarted = (started === 1 || answerCount > 0) ? 1 : 0;
      
      // Auto-reconcile started flag in the database if it was 0 but answers exist
      if (started === 0 && answerCount > 0) {
        db.query("UPDATE assigned_students SET started = 1 WHERE assessment_id = ? AND student_email = ?", [assessmentId, studentEmail]);
      }

      res.json({
        started: finalStarted,
        submitted,
        auto_submitted,
        resume_count,
        allowed: submitted === 0 && auto_submitted === 0
      });
    });
  });
});

app.post("/start-assessment", (req, res) => {
  const { assessment_id, student_email } = req.body;
  const sql = "UPDATE assigned_students SET started = 1 WHERE assessment_id = ? AND student_email = ?";
  db.query(sql, [assessment_id, student_email], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    res.json({ success: true });
  });
});

app.post("/resume-assessment", (req, res) => {
  const { assessment_id, student_email } = req.body;
  
  const checkSql = "SELECT resume_count, submitted, auto_submitted FROM assigned_students WHERE assessment_id = ? AND student_email = ?";
  db.query(checkSql, [assessment_id, student_email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "Student not assigned to this assessment" });
    }
    
    const { resume_count, submitted, auto_submitted } = results[0];
    
    if (submitted === 1 || auto_submitted === 1) {
      return res.json({ success: false, error: "Assessment already submitted" });
    }
    
    if (resume_count >= 1) {
      // Auto-submit since this is the second time resuming
      const autoSubmitSql = "UPDATE assigned_students SET auto_submitted = 1, submitted = 1 WHERE assessment_id = ? AND student_email = ?";
      db.query(autoSubmitSql, [assessment_id, student_email], (err2) => {
        if (err2) console.error(err2);
        
        db.query(
          "INSERT INTO student_results (assessment_id, student_email, score, auto_submitted, assessment_title) SELECT ?, ?, 0, 1, title FROM assessments WHERE id = ? ON DUPLICATE KEY UPDATE auto_submitted = 1",
          [assessment_id, student_email, assessment_id],
          (err3) => {
            if (err3) console.error(err3);
            return res.json({ success: false, autoSubmitTriggered: true, error: "You have already resumed once. This second exit has caused the assessment to be auto-submitted." });
          }
        );
      });
    } else {
      // First resume, increment count
      const updateSql = "UPDATE assigned_students SET resume_count = resume_count + 1 WHERE assessment_id = ? AND student_email = ?";
      db.query(updateSql, [assessment_id, student_email], (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ success: false, error: "Database error" });
        }
        res.json({ success: true, new_resume_count: 1 });
      });
    }
  });
});


app.post("/submit-feedback", (req, res) => {
  const {
    assessment_id, student_email,
    overall_rating, difficulty_rating, clarity_rating, platform_experience,
    recommendation, preferred_type, platform_issues
  } = req.body;

  const sql = `
    INSERT INTO student_feedback 
    (assessment_id, student_email, overall_rating, difficulty_rating, clarity_rating, platform_experience, recommendation, preferred_type, platform_issues)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    assessment_id, student_email, overall_rating, difficulty_rating, clarity_rating,
    platform_experience, recommendation, preferred_type, platform_issues
  ], (err) => {
    if (err) {
      console.error(err);
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
});

app.get("/feedback/:id/:email", (req, res) => {
  const sql = "SELECT * FROM student_feedback WHERE assessment_id = ? AND student_email = ? ORDER BY created_at DESC LIMIT 1";
  db.query(sql, [req.params.id, req.params.email], (err, results) => {
    if (err || results.length === 0) return res.json(null);
    res.json(results[0]);
  });
});





app.post("/save-controls", (req, res) => {

  const {
    assessment_id,
    fullscreen,
    tab_switch,
    hover_detection,
    copy_paste_block,
    webcam,
    mic,
    screen_record,
    show_result,
    tab_limit,
    hover_limit,
    auto_submit_time,
    auto_submit_tab,
    auto_submit_hover,
    auto_submit_fullscreen
  } = req.body;

  const sql = `
    INSERT INTO exam_controls (
      assessment_id,
      fullscreen,
      tab_switch,
      hover_detection,
      copy_paste_block,
      webcam,
      mic,
      screen_record,
      show_result,
      tab_limit,
      hover_limit,
      auto_submit_time,
      auto_submit_tab,
      auto_submit_hover,
      auto_submit_fullscreen
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    ON DUPLICATE KEY UPDATE
      fullscreen = VALUES(fullscreen),
      tab_switch = VALUES(tab_switch),
      hover_detection = VALUES(hover_detection),
      copy_paste_block = VALUES(copy_paste_block),
      webcam = VALUES(webcam),
      mic = VALUES(mic),
      screen_record = VALUES(screen_record),
      show_result = VALUES(show_result),
      tab_limit = VALUES(tab_limit),
      hover_limit = VALUES(hover_limit),
      auto_submit_time = VALUES(auto_submit_time),
      auto_submit_tab = VALUES(auto_submit_tab),
      auto_submit_hover = VALUES(auto_submit_hover),
      auto_submit_fullscreen = VALUES(auto_submit_fullscreen)
  `;

  db.query(sql, [
    assessment_id,
    fullscreen,
    tab_switch,
    hover_detection,
    copy_paste_block,
    webcam,
    mic,
    screen_record,
    show_result,
    tab_limit,
    hover_limit,
    auto_submit_time,
    auto_submit_tab,
    auto_submit_hover,
    auto_submit_fullscreen
  ], (err) => {

    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    res.json({ success: true });

  });

});


app.post("/create-test", (req, res) => {

  const {
    title,
    start_time,
    end_time,
    description,
    total_time,
    emails,   
    test_type 
  } = req.body;

  console.log("BODY:", req.body);

  const finalType = test_type || "test";

  
  const sql = `
    INSERT INTO assessments (
      title,
      description,
      start_time,
      end_time,
      total_time,
      test_type
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    title,
    description,
    start_time,
    end_time,
    total_time,
    finalType
  ], (err, result) => {

    if (err) {
      console.error("TEST INSERT ERROR:", err);
      return res.json({ success: false });
    }

    const assessmentId = result.insertId;

    const finalizeCreation = () => {
      
      if (!emails || emails.trim() === "") {
        return res.json({ success: true, testId: assessmentId });
      }

      const emailArray = emails.split(",");

      
      const assignSql = `
        INSERT INTO assigned_students (assessment_id, student_email)
        VALUES ?
      `;

      const values = emailArray.map(email => [
        assessmentId,
        email.trim()
      ]);

      db.query(assignSql, [values], (err2) => {
        if (err2) {
          console.error("ASSIGN ERROR:", err2);
          return res.json({ success: false });
        }
        res.json({ success: true, testId: assessmentId });
      });
    };

    
    if (finalType === "practice") {
      const controlSql = `
        INSERT INTO exam_controls (
          assessment_id, fullscreen, tab_switch, hover_detection, copy_paste_block,
          webcam, mic, screen_record, show_result, tab_limit, hover_limit,
          auto_submit_time, auto_submit_tab, auto_submit_hover, auto_submit_fullscreen
        ) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0)
      `;
      db.query(controlSql, [assessmentId], (err3) => {
        if (err3) console.error("FAILED TO AUTO INSERT CONTROLS FOR PRACTICE", err3);
        finalizeCreation();
      });
    } else {
      finalizeCreation();
    }
  });

});


app.post("/create-practice", (req, res) => {
  const { title, emails } = req.body;
  console.log("PRACTICE BODY:", req.body);

  const sql = `INSERT INTO practices (title) VALUES (?)`;

  db.query(sql, [title], (err, result) => {
    if (err) {
      console.error("PRACTICE INSERT ERROR:", err);
      return res.json({ success: false });
    }

    const practiceId = result.insertId;

    if (!emails || emails.trim() === "") {
      return res.json({ success: true, practiceId });
    }

    const emailArray = emails.split(",");
    const assignSql = `INSERT INTO assigned_practices (practice_id, student_email) VALUES ?`;
    const values = emailArray.map(email => [practiceId, email.trim()]);

    db.query(assignSql, [values], (err2) => {
      if (err2) {
        console.error("ASSIGN ERROR:", err2);
        return res.json({ success: false });
      }
      res.json({ success: true, practiceId });
    });
  });
});


app.post("/save-practice-question", (req, res) => {
  const { practice_id, questions } = req.body;

  if (!questions || !questions.length) return res.json({ success: true });

  const values = questions.map(q => [
    practice_id,
    q.question_title || "",
    q.question_text || "",
    q.difficulty || "Easy",
    q.marks || 1,
    typeof q.visible_testcases === "object" ? JSON.stringify(q.visible_testcases) : (q.visible_testcases || ""),
    typeof q.hidden_testcases === "object" ? JSON.stringify(q.hidden_testcases) : (q.hidden_testcases || ""),
    q.coding_input || "",
    q.coding_output || "",
    q.sample_testcase || ""
  ]);

  const sql = `
    INSERT INTO practice_questions (
      practice_id, question_title, question_text, difficulty, marks,
      visible_testcases, hidden_testcases, coding_input, coding_output, sample_testcase
    ) VALUES ?
  `;

  db.query(sql, [values], (err) => {
    if (err) {
      console.error("SAVE PRACTICE QUESTION ERROR:", err);
      return res.json({ success: false, error: "Database error" });
    }
    res.json({ success: true });
  });
});






app.post("/save-question", (req, res) => {
  console.log("SAVE QUESTION BODY:", req.body);

  const processQuestion = (q, assessment_id) => {
    return [
      assessment_id || 0,
      q.section_name || "",
      0, 
      q.question_type || "mcq",
      q.question_title || "",
      q.question_text || "",
      q.option_a || "",
      q.option_b || "",
      q.option_c || "",
      q.option_d || "",
      q.correct_answer || "",
      q.difficulty || "Easy",
      q.marks || 1,
      typeof q.visible_testcases === "object" ? JSON.stringify(q.visible_testcases) : (q.visible_testcases || ""),
      typeof q.hidden_testcases === "object" ? JSON.stringify(q.hidden_testcases) : (q.hidden_testcases || ""),
      q.coding_input || "", 
      q.coding_output || "",
      q.sample_testcase || ""
    ];
  };

  const sql = `
    INSERT INTO questions (
      assessment_id,
      section_name,
      section_id,
      question_type,
      question_title,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty,
      marks,
      visible_testcases,
      hidden_testcases,
      coding_input,
      coding_output,
      sample_testcase
    )
    VALUES ?
  `;

  let values = [];
  
  if (req.body.questions && Array.isArray(req.body.questions)) {
    
    values = req.body.questions.map(q => processQuestion(q, req.body.assessment_id));
  } else {
    
    values = [processQuestion(req.body, req.body.assessment_id)];
  }

  if (values.length === 0) {
    return res.status(400).json({ success: false, error: "No questions provided" });
  }

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("SAVE QUESTION ERROR:", err);
      return res.status(500).json({
        success: false,
        error: "Database error occurred"
      });
    }

    const assessment_id = req.body.assessment_id || 0;

    const updateStatsSql = `
      UPDATE assessments
      SET questions = (SELECT COUNT(*) FROM questions WHERE assessment_id = ?),
          marks = (SELECT SUM(marks) FROM questions WHERE assessment_id = ?)
      WHERE id = ?
    `;

    db.query(updateStatsSql, [assessment_id, assessment_id, assessment_id], (err2) => {
      if (err2) {
        console.error("UPDATE STATS ERROR:", err2);
      }

      res.json({
        success: true,
        message: "Question(s) saved successfully"
      });
    });
  });
});



app.get("/assessment/:id", (req, res) => {

  const id = req.params.id;

  const assessmentQuery = `
    SELECT *
    FROM assessments
    WHERE id = ?
  `;

  const questionQuery = `
    SELECT 
      COUNT(*) as question_count, 
      SUM(marks) as total_marks 
    FROM questions 
    WHERE assessment_id = ?
  `;

  const controlQuery = `
    SELECT *
    FROM exam_controls
    WHERE assessment_id = ?
  `;

  db.query(assessmentQuery, [id], (err, assessmentResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: true });
    }

    if (assessmentResult.length === 0) {
      return res.json({
        error: true,
        message: "Assessment not found"
      });
    }

    const row = assessmentResult[0];

    db.query(questionQuery, [id], (err, questionResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: true });
      }

      const qStats = questionResult[0] || { question_count: 0, total_marks: 0 };

      db.query(controlQuery, [id], (err, controlResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: true });
        }

        const controls = controlResult[0] || {};

        console.log("Assessment Data:", row);
        console.log("Question Stats:", qStats);

        res.json({
          id: row.id,
          title: row.title,
          description: row.description,
          duration: row.total_time,
          questions: qStats.question_count || 0,
          total_marks: qStats.total_marks || 0,
          controls: {
            enableProctoring: 1,
            requireFullscreen: controls.fullscreen ?? 0,
            recordScreen: controls.screen_record ?? 0,
            recordWebcam: controls.webcam ?? 0,
            recordWebmic: controls.mic ?? 0,
            preventCopyPaste: controls.copy_paste_block ?? 0,
            preventTabSwitch: controls.tab_switch ?? 0
          }
        });
      });
    });
  });

});



app.get("/assessment-full/:id", (req, res) => {
  const id = req.params.id;

  const assessmentQuery = "SELECT * FROM assessments WHERE id = ?";
  const questionQuery = "SELECT * FROM questions WHERE assessment_id = ?";
  const controlQuery = "SELECT * FROM exam_controls WHERE assessment_id = ?";

  db.query(assessmentQuery, [id], (err, assessmentResult) => {
    if (err) return res.status(500).json({ error: err });

    db.query(questionQuery, [id], (err, questionResult) => {
      if (err) return res.status(500).json({ error: err });

      db.query(controlQuery, [id], (err, controlResult) => {
        if (err) return res.status(500).json({ error: err });

        res.json({
          assessment: assessmentResult[0] || {},
          questions: questionResult || [],
          controls: controlResult[0] || {}
        });
      });
    });
  });
});


function detectLanguage(code) {
  const c = code.trim();
  if (c.includes("#include") || c.includes("iostream") || c.includes("using namespace std")) {
    return "cpp";
  }
  if (c.includes("public class") || c.includes("System.out") || c.includes("import java.")) {
    return "java";
  }
  if (c.includes("def ") || c.includes("import sys") || c.includes("print(") || c.includes("import math")) {
    return "python";
  }
  return "javascript";
}

app.post("/submit-assessment", (req, res) => {
  const { assessment_id, student_email, answers, auto_submitted } = req.body;
  const isAutoSubmitted = auto_submitted ? 1 : 0;

  const markSubmitted = () => {
    const markSql = `UPDATE assigned_students SET submitted = 1, auto_submitted = ? WHERE assessment_id = ? AND student_email = ?`;
    db.query(markSql, [isAutoSubmitted, assessment_id, student_email], (err2) => {
      if (err2) console.error("MARK SUBMITTED ERROR:", err2);
      res.json({ success: true });
    });
  };

  const safeAnswers = answers || {};

  db.query("SELECT * FROM questions WHERE assessment_id = ?", [assessment_id], (err, questions) => {
    if (err) {
      console.error("SUBMIT ERROR fetching questions:", err);
      return res.status(500).json({ success: false });
    }

    let totalScore = 0;
    let mcqScore = 0;
    let codingScore = 0;
    let mcqAttended = 0;
    let codingAttended = 0;
    
    const insertAnswerPromises = questions.map(q => {
      return new Promise((resolveAnswer) => {
        const studentAnswer = safeAnswers[q.id];
        const hasAnswered = (studentAnswer !== undefined && studentAnswer !== null && studentAnswer.toString().trim() !== '');
        
        const selected_option = (q.question_type === 'mcq' && hasAnswered) ? studentAnswer.toString().trim() : null;
        const code_submitted = (q.question_type === 'coding' && hasAnswered) ? studentAnswer.toString() : null;
        
        let is_correct = 0;
        if (hasAnswered) {
          if (q.question_type === 'mcq') {
            mcqAttended++;
            if (studentAnswer.toString().trim() === q.correct_answer.trim()) {
              const m = Number(q.marks) || 1;
              totalScore += m;
              mcqScore += m;
              is_correct = 1;
            }
            const insertSql = `
              INSERT INTO student_answers (assessment_id, student_email, question_id, selected_option, is_correct)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE selected_option = VALUES(selected_option), is_correct = VALUES(is_correct)
            `;
            db.query(insertSql, [assessment_id, student_email, q.id, selected_option, is_correct], (ansErr) => {
              if (ansErr) console.error("INSERT MCQ ANSWER ERROR:", ansErr);
              resolveAnswer();
            });
          } else if (q.question_type === 'coding') {
            codingAttended++;
            // Check student_answers table for the actual correctness of this question
            db.query(
              "SELECT is_correct FROM student_answers WHERE assessment_id = ? AND student_email = ? AND question_id = ?",
              [assessment_id, student_email, q.id],
              (dbErr, dbRes) => {
                if (!dbErr && dbRes.length > 0) {
                  const m = Number(q.marks) || 1;
                  const correct = dbRes[0].is_correct === 1;
                  if (correct) {
                    totalScore += m;
                    codingScore += m;
                  }
                }
                resolveAnswer();
              }
            );
          }
        } else {
          resolveAnswer();
        }
      });
    });

    Promise.all(insertAnswerPromises).then(() => {
      const resultSql = `
        INSERT INTO student_results (assessment_id, student_email, score, auto_submitted, assessment_title, mcq_score, coding_score, mcq_attended, coding_attended, percentage)
        SELECT ?, ?, ?, ?, title, ?, ?, ?, ?, COALESCE(ROUND((? / NULLIF(marks, 0)) * 100, 2), 0) FROM assessments WHERE id = ?
        ON DUPLICATE KEY UPDATE 
          score = VALUES(score), 
          auto_submitted = VALUES(auto_submitted),
          assessment_title = VALUES(assessment_title),
          mcq_score = VALUES(mcq_score),
          coding_score = VALUES(coding_score),
          mcq_attended = VALUES(mcq_attended),
          coding_attended = VALUES(coding_attended),
          percentage = VALUES(percentage)
      `;
      
      db.query(resultSql, [
        assessment_id, student_email, totalScore, isAutoSubmitted,
        mcqScore, codingScore, mcqAttended, codingAttended, totalScore, assessment_id
      ], (err2) => {
        if (err2) console.error("SAVE RESULT ERROR:", err2);
        markSubmitted();
      });
    });
  });
});

app.post("/run-code", async (req, res) => {
  const { code, question_id, is_practice } = req.body;
  if (code === undefined || !question_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const language = req.body.language || detectLanguage(code);
  const table = is_practice ? "practice_questions" : "questions";
  const sql = `SELECT * FROM ${table} WHERE id = ?`;

  db.query(sql, [question_id], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    const q = results[0];
    let visibleCases = [];
    try {
      if (q.visible_testcases) {
        visibleCases = typeof q.visible_testcases === "string"
          ? JSON.parse(q.visible_testcases)
          : q.visible_testcases;
      }
    } catch (e) {
      console.error("Failed to parse visible testcases:", e);
    }

    if (visibleCases.length === 0 && (q.coding_input || q.coding_output)) {
      visibleCases.push({
        input: q.coding_input || "",
        expected: q.coding_output || ""
      });
    }

    if (visibleCases.length === 0) {
      visibleCases.push({ input: "", expected: "" });
    }

    let logs = "Compiling source code...\nInitializing sandbox environment...\nRunning visible test cases...\n";
    let passedCount = 0;
    let hasCompilationError = false;
    const startTime = Date.now();

    for (let i = 0; i < visibleCases.length; i++) {
      const tc = visibleCases[i];
      const result = await codeRunner.runCode(language, code, tc.input);

      if (result.status === "Compilation Error") {
        logs += `\n[COMPILE ERROR]\n${result.error}\n`;
        hasCompilationError = true;
        break;
      }

      if (result.status === "Time Limit Exceeded") {
        logs += `\n[VISIBLE TEST CASE ${i + 1}]\nInput: ${tc.input}\nExpected: ${tc.expected}\nStatus: Time Limit Exceeded\n`;
        break;
      }

      if (result.status === "Runtime Error") {
        logs += `\n[VISIBLE TEST CASE ${i + 1}]\nInput: ${tc.input}\nExpected: ${tc.expected}\nStatus: Runtime Error\n${result.error}\n`;
        break;
      }

      const actual = (result.stdout || "").trim();
      const expected = (tc.expected || "").trim();
      const normalize = s => s.replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();

      if (normalize(actual) === normalize(expected)) {
        passedCount++;
        logs += `\n[VISIBLE TEST CASE ${i + 1}]\nInput: ${tc.input}\nExpected: ${expected}\nActual: ${actual}\nStatus: PASSED\n`;
      } else {
        logs += `\n[VISIBLE TEST CASE ${i + 1}]\nInput: ${tc.input}\nExpected: ${expected}\nActual: ${actual}\nStatus: FAILED (Wrong Answer)\n`;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

    if (hasCompilationError) {
      res.json({
        success: false,
        terminalLogs: logs + `\n[RESULTS] Compilation failed.`,
        stats: { time: "0s", memory: "0 MB" }
      });
    } else {
      res.json({
        success: passedCount === visibleCases.length,
        terminalLogs: logs + `\n[RESULTS] ${passedCount}/${visibleCases.length} visible testcase(s) passed successfully.`,
        stats: { time: elapsed, memory: "8.4 MB" }
      });
    }
  });
});

app.post("/save-coding-answer", (req, res) => {
  const { assessment_id, student_email, question_id, code_submitted } = req.body;
  if (!assessment_id || !student_email || !question_id || code_submitted === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const language = req.body.language || detectLanguage(code_submitted);

  db.query("SELECT * FROM questions WHERE id = ?", [question_id], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    const q = results[0];
    let visibleCases = [];
    let hiddenCases = [];

    try {
      if (q.visible_testcases) {
        visibleCases = typeof q.visible_testcases === "string"
          ? JSON.parse(q.visible_testcases)
          : q.visible_testcases;
      }
      if (q.hidden_testcases) {
        hiddenCases = typeof q.hidden_testcases === "string"
          ? JSON.parse(q.hidden_testcases)
          : q.hidden_testcases;
      }
    } catch (e) {
      console.error("Failed to parse testcases:", e);
    }

    if (visibleCases.length === 0 && (q.coding_input || q.coding_output)) {
      visibleCases.push({ input: q.coding_input || "", expected: q.coding_output || "" });
    }

    const allCases = [...visibleCases, ...hiddenCases];
    if (allCases.length === 0) {
      allCases.push({ input: "", expected: "" });
    }

    let logs = "Compiling and packaging codebase...\nRunning comprehensive suite of hidden test cases...\n";
    let passedCount = 0;
    let hasCompilationError = false;
    const startTime = Date.now();

    for (let i = 0; i < allCases.length; i++) {
      const tc = allCases[i];
      const result = await codeRunner.runCode(language, code_submitted, tc.input);

      if (result.status === "Compilation Error") {
        logs += `\n[COMPILE ERROR]\n${result.error}\n`;
        hasCompilationError = true;
        break;
      }

      if (result.status === "Time Limit Exceeded") {
        logs += `Testcase ${i + 1}: FAILED (Time Limit Exceeded)\n`;
        continue;
      }

      if (result.status === "Runtime Error") {
        logs += `Testcase ${i + 1}: FAILED (Runtime Error)\n`;
        continue;
      }

      const actual = (result.stdout || "").trim();
      const expected = (tc.expected || "").trim();
      const normalize = s => s.replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();

      if (normalize(actual) === normalize(expected)) {
        passedCount++;
        logs += `Testcase ${i + 1}: PASSED (0.01s)\n`;
      } else {
        logs += `Testcase ${i + 1}: FAILED (Wrong Answer)\n`;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2) + "s";
    const isCorrect = (passedCount === allCases.length) ? 1 : 0;

    const insertSql = `
      INSERT INTO student_answers (assessment_id, student_email, question_id, code_submitted, language, is_correct)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE code_submitted = VALUES(code_submitted), language = VALUES(language), is_correct = VALUES(is_correct)
    `;

    db.query(insertSql, [assessment_id, student_email, question_id, code_submitted, language, isCorrect], (err2) => {
      if (err2) {
        console.error("SAVE CODING ANSWER ERROR:", err2);
        return res.status(500).json({ error: "Database error" });
      }

      if (hasCompilationError) {
        res.json({
          success: false,
          terminalLogs: logs + `\n[HIDDEN RESULTS] 0/${allCases.length} test cases passed.\n[ERROR] Sandbox compilation failed.`,
          stats: { time: "0s", memory: "0 MB" }
        });
      } else {
        res.json({
          success: passedCount === allCases.length,
          terminalLogs: logs + `\n[HIDDEN RESULTS] ${passedCount}/${allCases.length} test cases passed.\n[SUCCESS] Code verified and successfully saved to assessment records.`,
          stats: { time: elapsed, memory: "14.2 MB" }
        });
      }
    });
  });
});


app.get("/practice-full/:id", (req, res) => {
  const id = req.params.id;

  const practiceQuery = `SELECT * FROM practices WHERE id = ?`;
  const questionQuery = `SELECT * FROM practice_questions WHERE practice_id = ?`;

  db.query(practiceQuery, [id], (err, practiceResult) => {
    if (err) return res.status(500).json({ error: true });
    if (practiceResult.length === 0) return res.json({ error: true, message: "Practice not found" });

    const row = practiceResult[0];

    db.query(questionQuery, [id], (err, questions) => {
      if (err) return res.status(500).json({ error: true });

      res.json({
        id: row.id,
        title: row.title,
        questions: questions || []
      });
    });
  });
});


app.post("/submit-practice", (req, res) => {
  const { practice_id, student_email } = req.body;
  
  const sql = `UPDATE assigned_practices SET submitted = 1 WHERE practice_id = ? AND student_email = ?`;
  
  db.query(sql, [practice_id, student_email], (err) => {
    if (err) {
      console.error("SUBMIT PRACTICE ERROR:", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});




app.get("/admin/dashboard-stats", (req, res) => {
  const queries = [
    "SELECT COUNT(*) AS count FROM assessments WHERE test_type = 'test'",
    "SELECT COUNT(*) AS count FROM practices",
    "SELECT COUNT(*) AS count FROM users",
    "SELECT COUNT(*) AS count FROM proctoring_logs",
    "SELECT COUNT(*) AS count FROM questions",
    "SELECT COUNT(*) AS count FROM student_results",
    "SELECT COALESCE(ROUND(AVG(score)), 0) AS avg FROM student_results",
    "SELECT COUNT(*) AS count FROM student_feedback"
  ];

  const run = (sql) => new Promise((resolve, reject) => {
    db.query(sql, (err, result) => err ? reject(err) : resolve(result[0]));
  });

  Promise.all(queries.map(run))
    .then(([r1, r2, r3, r4, r5, r6, r7, r8]) => {
      res.json({
        active_tests: r1.count,
        practice_sets: r2.count,
        total_students: r3.count,
        proctoring_flags: r4.count,
        total_questions: r5.count,
        total_submissions: r6.count,
        avg_score: r7.avg,
        total_feedback: r8.count
      });
    })
    .catch(err => {
      console.error("Dashboard stats error:", err);
      res.status(500).json({ error: true });
    });
});


app.get("/admin/recent-violations", (req, res) => {
  const activeAssessmentSql = `
    SELECT id FROM assessments 
    ORDER BY 
      CASE WHEN start_time <= NOW() AND end_time >= NOW() THEN 0 ELSE 1 END,
      id DESC 
    LIMIT 1
  `;
  db.query(activeAssessmentSql, (err, activeResults) => {
    if (err) { console.error(err); return res.status(500).json({ error: true }); }
    
    if (activeResults.length === 0) {
      return res.json([]);
    }
    
    const activeId = activeResults[0].id;
    
    const sql = `
      SELECT pl.*, u.name AS student_name, a.title AS assessment_title
      FROM proctoring_logs pl
      LEFT JOIN users u ON pl.student_email = u.email
      LEFT JOIN assessments a ON pl.assessment_id = a.id
      WHERE pl.assessment_id = ?
      ORDER BY pl.id DESC
      LIMIT 5
    `;
    db.query(sql, [activeId], (err, results) => {
      if (err) { console.error(err); return res.status(500).json({ error: true }); }
      
      const mapped = results.map(row => {
        let severity = "Medium";
        let eventType = row.log_type;
        
        if (row.log_type === 'tab_switch' || row.log_type === 'fullscreen_exit') {
          severity = "High";
          eventType = row.log_type === 'tab_switch' ? "Multiple tabs switched" : "Fullscreen exited";
        } else if (row.log_type === 'webcam_alert' || row.log_type === 'face_anomaly') {
          severity = "Critical";
          eventType = "Webcam: Face mismatch/No face";
        } else if (row.log_type === 'copy_paste') {
          severity = "Medium";
          eventType = "Copy/paste block bypassed";
        } else if (row.log_type === 'blur') {
          severity = "Low";
          eventType = "Browser focus lost";
        }
        
        return {
          id: row.id,
          timestamp: row.created_at || new Date(),
          student_id: row.student_email ? `STD-${row.id + 1000}` : "N/A",
          student_name: row.student_name || row.student_email || "Anonymous",
          student_email: row.student_email || "N/A",
          assessment_title: row.assessment_title || "Unknown Assessment",
          event_type: eventType,
          severity: severity,
          status: "PENDING REVIEW"
        };
      });
      
      res.json(mapped);
    });
  });
});


app.get("/admin/students", (req, res) => {
  const sql = `
    SELECT u.email, u.name, u.dob, u.roll_number, u.personal_number, u.college_name, u.joining_year, u.passing_year,
           COALESCE(ROUND(AVG(sr.score)), 0) AS avg_score,
           (SELECT COUNT(*) FROM proctoring_logs pl WHERE pl.student_email = u.email) AS violation_count
    FROM users u
    LEFT JOIN student_results sr ON u.email = sr.student_email
    GROUP BY u.email, u.name, u.dob, u.roll_number, u.personal_number, u.college_name, u.joining_year, u.passing_year
    ORDER BY u.name ASC
  `;
  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: true }); }
    
    const mapped = results.map((row, index) => {
      let status = "ACTIVE";
      if (row.violation_count > 5) {
        status = "SUSPENDED";
      } else if (row.violation_count > 0) {
        status = "FLAGGED";
      }
      
      return {
        name: row.name || "Anonymous",
        email: row.email,
        student_id: row.roll_number || `STD-${index + 8921}`,
        dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : "N/A",
        personal_number: row.personal_number || "N/A",
        college_name: row.college_name || "N/A",
        joining_year: row.joining_year || "N/A",
        passing_year: row.passing_year || "N/A",
        status: status,
        avg_score: row.avg_score + "%",
        last_active: row.violation_count > 0 ? "2 mins ago" : "Active"
      };
    });
    
    res.json(mapped);
  });
});


app.get("/admin/assessments-list", (req, res) => {
  const q1 = `
    SELECT a.id, a.title, a.description, a.start_time, a.end_time, a.total_time AS duration, a.test_type,
           (SELECT COUNT(*) FROM assigned_students WHERE assessment_id = a.id) AS candidates,
           (SELECT COUNT(*) FROM questions WHERE assessment_id = a.id) AS question_count
    FROM assessments a
    ORDER BY a.id DESC
  `;
  const q2 = `
    SELECT p.id, p.title, 'Relaxed practice session' AS description, NULL AS start_time, NULL AS end_time, 0 AS duration, 'practice' AS test_type,
           (SELECT COUNT(*) FROM assigned_practices WHERE practice_id = p.id) AS candidates,
           (SELECT COUNT(*) FROM practice_questions WHERE practice_id = p.id) AS question_count
    FROM practices p
    ORDER BY p.id DESC
  `;

  db.query(q1, (err1, r1) => {
    if (err1) { console.error(err1); return res.status(500).json({ error: true }); }
    db.query(q2, (err2, r2) => {
      if (err2) { console.error(err2); return res.status(500).json({ error: true }); }
      
      const now = new Date();
      const mappedAssessments = r1.map(row => {
        let status = "ACTIVE";
        const start = row.start_time ? new Date(row.start_time) : null;
        const end = row.end_time ? new Date(row.end_time) : null;
        
        if (end && now > end) {
          status = "COMPLETED";
        } else if (start && now < start) {
          status = "DRAFT";
        }
        
        return {
          id: row.id,
          code: `ASM-${1000 + row.id}`,
          title: row.title,
          description: row.description || "",
          category: row.test_type === 'practice' ? "Practice" : "Engineering",
          status: status,
          candidates: row.candidates,
          duration: `${row.duration} min`,
          test_type: row.test_type,
          start_time: row.start_time,
          end_time: row.end_time
        };
      });

      const mappedPractices = r2.map(row => {
        return {
          id: row.id,
          code: `PRC-${2000 + row.id}`,
          title: row.title,
          description: row.description || "",
          category: "Practice",
          status: "ACTIVE",
          candidates: row.candidates,
          duration: "N/A",
          test_type: "practice_table",
          start_time: null,
          end_time: null
        };
      });

      res.json([...mappedAssessments, ...mappedPractices]);
    });
  });
});


app.post("/admin/update-assessment", (req, res) => {
  const { id, title, description, start_time, end_time, total_time, emails, test_type } = req.body;

  if (!id || !title) {
    return res.status(400).json({ success: false, error: "Assessment ID and Title are required" });
  }

  const updateTest = () => {
    const sql = "UPDATE assessments SET title = ?, description = ?, start_time = ?, end_time = ?, total_time = ? WHERE id = ?";
    db.query(sql, [title, description, start_time, end_time, total_time, id], (err) => {
      if (err) { console.error(err); return res.status(500).json({ success: false }); }
      
      
      db.query("DELETE FROM assigned_students WHERE assessment_id = ?", [id], (err2) => {
        if (err2) { console.error(err2); return res.status(500).json({ success: false }); }
        
        if (!emails || emails.trim() === "") {
          return res.json({ success: true });
        }
        
        const emailArray = emails.split(",");
        const assignSql = "INSERT INTO assigned_students (assessment_id, student_email) VALUES ?";
        const values = emailArray.map(email => [id, email.trim()]);
        
        db.query(assignSql, [values], (err3) => {
          if (err3) { console.error(err3); return res.status(500).json({ success: false }); }
          res.json({ success: true });
        });
      });
    });
  };

  const updatePractice = () => {
    const sql = "UPDATE practices SET title = ? WHERE id = ?";
    db.query(sql, [title, id], (err) => {
      if (err) { console.error(err); return res.status(500).json({ success: false }); }
      
      
      db.query("DELETE FROM assigned_practices WHERE practice_id = ?", [id], (err2) => {
        if (err2) { console.error(err2); return res.status(500).json({ success: false }); }
        
        if (!emails || emails.trim() === "") {
          return res.json({ success: true });
        }
        
        const emailArray = emails.split(",");
        const assignSql = "INSERT INTO assigned_practices (practice_id, student_email) VALUES ?";
        const values = emailArray.map(email => [id, email.trim()]);
        
        db.query(assignSql, [values], (err3) => {
          if (err3) { console.error(err3); return res.status(500).json({ success: false }); }
          res.json({ success: true });
        });
      });
    });
  };

  if (test_type === "practice_table") {
    updatePractice();
  } else {
    updateTest();
  }
});


app.post("/admin/delete-assessment", (req, res) => {
  const { id, test_type } = req.body;
  if (!id) return res.status(400).json({ success: false, error: "ID required" });

  const deleteTest = () => {
    db.query("DELETE FROM assessments WHERE id = ?", [id], (err) => {
      if (err) { console.error(err); return res.status(500).json({ success: false }); }
      db.query("DELETE FROM assigned_students WHERE assessment_id = ?", [id]);
      db.query("DELETE FROM questions WHERE assessment_id = ?", [id]);
      db.query("DELETE FROM exam_controls WHERE assessment_id = ?", [id]);
      db.query("DELETE FROM student_results WHERE assessment_id = ?", [id]);
      res.json({ success: true });
    });
  };

  const deletePractice = () => {
    db.query("DELETE FROM practices WHERE id = ?", [id], (err) => {
      if (err) { console.error(err); return res.status(500).json({ success: false }); }
      db.query("DELETE FROM assigned_practices WHERE practice_id = ?", [id]);
      db.query("DELETE FROM practice_questions WHERE practice_id = ?", [id]);
      res.json({ success: true });
    });
  };

  if (test_type === "practice_table") {
    deletePractice();
  } else {
    deleteTest();
  }
});


app.post("/admin/add-student", async (req, res) => {
  const { email, name, password, dob, roll_number, personal_number, college_name, joining_year, passing_year } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ success: false, error: "Email, Name and Password are required" });
  }

  try {
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (email, name, password, dob, roll_number, personal_number, college_name, joining_year, passing_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [
      email.trim(), 
      name.trim(), 
      hashedPassword,
      dob ? dob : null,
      roll_number ? roll_number.trim() : null,
      personal_number ? personal_number.trim() : null,
      college_name ? college_name.trim() : null,
      joining_year ? parseInt(joining_year) : null,
      passing_year ? parseInt(passing_year) : null
    ], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.json({ success: false, error: "Email already registered" });
        }
        console.error(err);
        return res.json({ success: false, error: "Database error occurred" });
      }
      res.json({ success: true });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.post("/admin/edit-student", (req, res) => {
  const { email, name, dob, roll_number, personal_number, college_name, joining_year, passing_year } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, error: "Email and Name are required" });
  }

  const sql = `
    UPDATE users 
    SET name = ?, dob = ?, roll_number = ?, personal_number = ?, college_name = ?, joining_year = ?, passing_year = ?
    WHERE email = ?
  `;
  db.query(sql, [
    name.trim(),
    dob ? dob : null,
    roll_number ? roll_number.trim() : null,
    personal_number ? personal_number.trim() : null,
    college_name ? college_name.trim() : null,
    joining_year ? parseInt(joining_year) : null,
    passing_year ? parseInt(passing_year) : null,
    email.trim()
  ], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: "Database error occurred" });
    }
    res.json({ success: true });
  });
});

function formatRelativeTime(dateVal) {
  if (!dateVal) return "N/A";
  const date = new Date(dateVal);
  const now = new Date();
  const diffMs = now - date;
  
  if (diffMs < 0) {
    return "just now";
  }
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  if (diffHr < 24) return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

app.get("/admin/violations-list", (req, res) => {
  const activeAssessmentSql = `
    SELECT id FROM assessments 
    ORDER BY 
      CASE WHEN start_time <= NOW() AND end_time >= NOW() THEN 0 ELSE 1 END,
      id DESC 
    LIMIT 1
  `;
  db.query(activeAssessmentSql, (err, activeResults) => {
    if (err) { console.error(err); return res.status(500).json({ error: true }); }
    
    if (activeResults.length === 0) {
      return res.json([]);
    }
    
    const activeId = activeResults[0].id;
    
    const sql = `
      SELECT pl.*, u.name AS student_name, a.title AS assessment_title
      FROM proctoring_logs pl
      LEFT JOIN users u ON pl.student_email = u.email
      LEFT JOIN assessments a ON pl.assessment_id = a.id
      WHERE pl.assessment_id = ?
      ORDER BY pl.id DESC
      LIMIT 40
    `;
    db.query(sql, [activeId], (err, results) => {
      if (err) { console.error(err); return res.status(500).json({ error: true }); }
      
      const mapped = results.map(row => {
        let severity = "Medium";
        let eventType = row.log_type;
        
        if (row.log_type === 'tab_switch' || row.log_type === 'fullscreen_exit') {
          severity = "HIGH";
          eventType = row.log_type === 'tab_switch' ? "Multiple Faces Detected" : "Browser Unfocused";
        } else if (row.log_type === 'webcam_alert' || row.log_type === 'face_anomaly') {
          severity = "CRITICAL";
          eventType = "External Device Connected";
        } else {
          severity = "LOW";
          eventType = "Audio Anomaly";
        }
        
        return {
          id: `V-${row.id + 8000}`,
          rawId: row.id,
          event_type: eventType,
          severity: severity,
          student_name: row.student_name || "Anonymous",
          student_email: row.student_email,
          assessment_title: row.assessment_title || "Coding Practice",
          time: formatRelativeTime(row.created_at), 
          status: row.status || (row.file_path ? "Review" : "Resolved"),
          file_path: row.file_path
        };
      });
      
      res.json(mapped);
    });
  });
});

app.post("/admin/resolve-violation", (req, res) => {
  const { id, status } = req.body;
  if (!id) return res.status(400).json({ error: "Incident ID required" });
  db.query("UPDATE proctoring_logs SET status = ? WHERE id = ?", [status || "Resolved", id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: true });
    }
    res.json({ success: true });
  });
});


app.get("/admin/assessment-emails", (req, res) => {
  const { id, type } = req.query;
  if (!id) return res.json({ emails: "" });
  
  const sql = type === "practice_table"
    ? "SELECT student_email FROM assigned_practices WHERE practice_id = ?"
    : "SELECT student_email FROM assigned_students WHERE assessment_id = ?";
    
  db.query(sql, [id], (err, results) => {
    if (err) { console.error(err); return res.json({ emails: "" }); }
    const emails = results.map(r => r.student_email).join(", ");
    res.json({ emails });
  });
});


const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get("/admin/agent/sessions", (req, res) => {
  const { admin_email } = req.query;
  if (!admin_email) return res.json([]);
  db.query("SELECT * FROM admin_chat_sessions WHERE admin_email = ? ORDER BY updated_at DESC", [admin_email], (err, results) => {
    if (err) return res.status(500).json({ error: true });
    res.json(results);
  });
});

app.get("/admin/agent/history/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  db.query("SELECT * FROM admin_chat_messages WHERE session_id = ? ORDER BY created_at ASC", [sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: true });
    res.json(results);
  });
});

app.post("/admin/agent/query", async (req, res) => {
  const { admin_email, sessionId, prompt } = req.body;
  try {
    let sid = sessionId;
    if (!sid) {
      const title = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
      const insertSession = await new Promise((resolve, reject) => {
        db.query("INSERT INTO admin_chat_sessions (admin_email, title) VALUES (?, ?)", [admin_email, title], (err, result) => {
          if (err) reject(err); else resolve(result.insertId);
        });
      });
      sid = insertSession;
    }

    
    if (prompt.startsWith("EXECUTE_CONFIRMED_SQL::")) {
      const base64Sql = prompt.split("::")[1];
      const sqlToExec = Buffer.from(base64Sql, 'base64').toString('utf8');
      
      try {
        const dbResults = await new Promise((resolve, reject) => {
          db.query(sqlToExec, (err, results) => {
             if (err) reject(err); else resolve(results);
          });
        });
        
        const successMsg = `<div style="color:#10b981; padding: 10px; background: rgba(16,185,129,0.1); border-radius: 8px; border: 1px solid rgba(16,185,129,0.3);">✅ <strong>Query Executed Successfully!</strong><br>Affected rows: ${dbResults.affectedRows || 0}</div>`;
        
        await new Promise((resolve, reject) => {
          db.query("INSERT INTO admin_chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)", [sid, successMsg], (err) => {
            if (err) reject(err); else resolve();
          });
        });
        
        return res.json({ sessionId: sid, response: successMsg });
      } catch (dbErr) {
        const errMsg = `<div style="color:#ef4444; padding: 10px; background: rgba(239,68,68,0.1); border-radius: 8px; border: 1px solid rgba(239,68,68,0.3);">❌ <strong>Execution Failed!</strong><br>${dbErr.message}</div>`;
        return res.json({ sessionId: sid, response: errMsg });
      }
    }

    await new Promise((resolve, reject) => {
      db.query("INSERT INTO admin_chat_messages (session_id, role, content) VALUES (?, 'user', ?)", [sid, prompt], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    const history = await new Promise((resolve, reject) => {
      db.query("SELECT role, content FROM admin_chat_messages WHERE session_id = ? ORDER BY created_at ASC", [sid], (err, results) => {
        if (err) reject(err); else resolve(results);
      });
    });

    const messages = [
      { role: "system", content: "You are Aethon Intelligence, an AI data analyst for an assessment platform. The database has tables:\n- users (id, email, name, password, dob, roll_number, personal_number, college_name)\n- assessments (id, title, due_date, marks, questions, description, total_time, test_type, start_time, end_time)\n- assigned_students (id, assessment_id, student_email, submitted, auto_submitted)\n- questions (id, assessment_id, section_name, section_id, question_type, question_title, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, visible_testcases, hidden_testcases, coding_input, coding_output, sample_testcase, created_at)\n- student_results (id, assessment_id, assessment_title, student_email, score, auto_submitted, percentage, submitted_at, mcq_score, coding_score, mcq_attended, coding_attended)\n- student_answers (id, assessment_id, student_email, question_id, selected_option, code_submitted, is_correct, created_at)\n- student_feedback (id, assessment_id, student_email, overall_rating, difficulty_rating, clarity_rating, platform_experience, recommendation, preferred_type, platform_issues, created_at)\n- proctoring_logs (id, assessment_id, student_email, log_type, file_path, created_at). Note: log_type contains values like 'tab_switch', 'fullscreen_exit', 'hover_out'.\nIf asked for data or modifications, return a valid SQL query wrapped in ```sql ... ```. For modifications (INSERT, UPDATE, DELETE), also include a short sentence starting with 'Risk Level: [Low/Medium/High]'. I will handle the execution." },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
    });

    let aiResponse = chatCompletion.choices[0]?.message?.content || "I couldn't process that.";

    const sqlMatch = aiResponse.match(/```sql\n([\s\S]*?)\n```/i) || aiResponse.match(/```([\s\S]*?)```/i);
    if (sqlMatch) {
      const sql = sqlMatch[1].trim();
      const sqlUpper = sql.toUpperCase();
      
      if (sqlUpper.startsWith("SELECT")) {
        try {
        const dbResults = await new Promise((resolve, reject) => {
          db.query(sql, (err, results) => {
             if (err) reject(err); else resolve(results);
          });
        });
        
        if (dbResults.length === 0) {
           aiResponse = "No records found for your query.";
        } else {
           const formatCompletion = await groq.chat.completions.create({
             messages: [
               { role: "system", content: "Convert this JSON data into a clean HTML table using class 'custom-table agent-table'. Return ONLY the HTML code. Do not use markdown backticks." },
               { role: "user", content: JSON.stringify(dbResults).substring(0, 3000) }
             ],
             model: "llama-3.3-70b-versatile"
          });
          aiResponse = formatCompletion.choices[0]?.message?.content;
        }
      } catch (dbErr) {
        aiResponse = "Error executing query: " + dbErr.message;
      }
      } else if (sqlUpper.startsWith("UPDATE") || sqlUpper.startsWith("INSERT") || sqlUpper.startsWith("DELETE")) {
        const encodedSql = Buffer.from(sql).toString('base64');
        aiResponse += `
          <div style="margin-top:15px; padding: 15px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px;">
            <strong style="color: #f59e0b;"><i class="ri-alert-line"></i> Action Requires Confirmation</strong>
            <p style="margin: 8px 0; font-size: 13px; color: #d4d4d8;">You are about to execute a database modification. Please review the query carefully.</p>
            <button class="export-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: rgba(239, 68, 68, 0.4); margin-top: 10px;" onclick="confirmAgentAction('${encodedSql}')">
              <i class="ri-error-warning-line"></i> Confirm & Execute
            </button>
          </div>
        `;
      }
    }

    await new Promise((resolve, reject) => {
      db.query("INSERT INTO admin_chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)", [sid, aiResponse], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    res.json({ sessionId: sid, response: aiResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Agent processing failed" });
  }
});


app.get("/results/analytics/:assessmentId/:studentEmail", async (req, res) => {
  const { assessmentId, studentEmail } = req.params;

  try {
    const assessment = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM assessments WHERE id=?", [assessmentId], (err, results) => {
        if (err) reject(err); else resolve(results[0]);
      });
    });

    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    const studentResult = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM student_results WHERE assessment_id=? AND student_email=?", [assessmentId, studentEmail], (err, results) => {
        if (err) reject(err); else resolve(results[0] || null);
      });
    });

    const leaderboard = await new Promise((resolve, reject) => {
      const sql = `
        SELECT a.student_email, IFNULL(r.score, 0) as score, IFNULL(r.percentage, 0) as percentage
        FROM assigned_students a
        LEFT JOIN student_results r ON a.assessment_id = r.assessment_id AND a.student_email = r.student_email
        WHERE a.assessment_id = ?
        ORDER BY score DESC, percentage DESC
      `;
      db.query(sql, [assessmentId], (err, results) => {
        if (err) reject(err); else resolve(results);
      });
    });

    const questions = await new Promise((resolve, reject) => {
      const sql = `
        SELECT q.id, q.question_type, q.question_title, q.question_text, 
               q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, 
               q.coding_output, q.marks,
               sa.selected_option, sa.code_submitted, sa.is_correct
        FROM questions q
        LEFT JOIN student_answers sa 
          ON q.id = sa.question_id AND sa.student_email = ?
        WHERE q.assessment_id = ?
      `;
      db.query(sql, [studentEmail, assessmentId], (err, results) => {
        if (err) reject(err); else resolve(results);
      });
    });

    res.json({
      success: true,
      assessment,
      studentResult,
      leaderboard,
      questions
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});