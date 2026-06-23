require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("./db");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* =========================
   PROCTORING ROUTES
========================= */

// Configure Multer for video uploads
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

/* =========================
   LOGIN (ADMIN + USER)
========================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require("bcrypt");

  // 🔥 CHECK ADMIN
  const adminQuery = "SELECT * FROM admin_users WHERE email=?";

  db.query(adminQuery, [email], async (err, adminResult) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    if (adminResult.length > 0) {
      const match = await bcrypt.compare(password, adminResult[0].password);
      if (match) {
        return res.json({
          success: true,
          role: "admin",
          email: adminResult[0].email,
          name: adminResult[0].name || null
        });
      }
    }

    // 🔥 CHECK USER
    const userQuery = "SELECT * FROM users WHERE email=?";

    db.query(userQuery, [email], async (err, userResult) => {
      if (err) {
        console.log(err);
        return res.json({ success: false });
      }

      if (userResult.length > 0) {
        const match = await bcrypt.compare(password, userResult[0].password);
        if (match) {
          return res.json({
            success: true,
            role: "student",
            email: userResult[0].email,
            name: userResult[0].name || null
          });
        }
      }

      return res.json({ success: false });
    });
  });
});

const otps = new Map();

/* =========================
   FORGOT PASSWORD
========================= */
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

/* =========================
   RESET PASSWORD
========================= */
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

/* =========================
   STUDENT ASSESSMENTS
========================= */
app.get("/student-assessments", (req, res) => {

  const email = req.query.email;

  if (!email) return res.json([]);

  const sql = `
    SELECT a.*, s.submitted,
           (SELECT COUNT(*) FROM student_feedback f WHERE f.assessment_id = a.id AND f.student_email = ?) as feedback_given,
           (SELECT show_result FROM exam_controls c WHERE c.assessment_id = a.id) as show_result,
           (SELECT score FROM student_results r WHERE r.assessment_id = a.id AND r.student_email = ?) as score
    FROM assessments a
    INNER JOIN assigned_students s
    ON a.id = s.assessment_id
    WHERE s.student_email = ?
    ORDER BY a.id DESC
  `;

  db.query(sql, [email.trim(), email.trim(), email.trim()], (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    return res.json(result);

  });

});

/* =========================
   STUDENT PRACTICES
========================= */
app.get("/student-practices/:email", (req, res) => {
  const email = req.params.email;

  const sql = `
    SELECT p.*, ap.submitted, 'practice' as test_type
    FROM practices p
    INNER JOIN assigned_practices ap ON p.id = ap.practice_id
    WHERE ap.student_email = ?
    ORDER BY p.id DESC
  `;

  db.query(sql, [email.trim()], (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    return res.json(result);
  });
});

/* =========================
   FEEDBACK ROUTES
========================= */
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

/* =========================
   ADVANCED RESULTS
========================= */
app.get("/results/analytics/:id/:email", (req, res) => {
  const assessment_id = req.params.id;

  // 1. Get assessment details
  db.query("SELECT * FROM assessments WHERE id = ?", [assessment_id], (err, aRes) => {
    if (err || aRes.length === 0) return res.json({ error: "Not found" });
    const assessment = aRes[0];

    // 2. Get leaderboard from student_results directly
    const lbSql = `
      SELECT student_email, score
      FROM student_results
      WHERE assessment_id = ?
      ORDER BY score DESC
    `;
    db.query(lbSql, [assessment_id], (err, lbRes) => {
      res.json({
        assessment: {
          title: assessment.title,
          start_time: assessment.start_time,
          duration: assessment.total_time
        },
        leaderboard: lbRes || []
      });
    });
  });
});

/* =========================
   SAVE EXAM CONTROLS
========================= */
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

/* =========================
   CREATE TEST (FINAL FIXED)
========================= */
app.post("/create-test", (req, res) => {

  const {
    title,
    start_time,
    end_time,
    description,
    total_time,
    emails,   // 👈 coming from frontend
    test_type // 👈 test or practice
  } = req.body;

  console.log("BODY:", req.body);

  const finalType = test_type || "test";

  /* =========================
     INSERT INTO assessments
  ========================== */
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
      /* =========================
         HANDLE MULTIPLE EMAILS
      ========================== */
      if (!emails || emails.trim() === "") {
        return res.json({ success: true, testId: assessmentId });
      }

      const emailArray = emails.split(",");

      /* =========================
         INSERT INTO assigned_students
      ========================== */
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

    /* If Practice, auto-insert disabled controls to bypass Manage Controls step */
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

/* =========================
   CREATE PRACTICE (ISOLATED)
========================= */
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

/* =========================
   SAVE PRACTICE QUESTION
========================= */
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




/* =========================
   SAVE QUESTION
========================= */

app.post("/save-question", (req, res) => {
  console.log("SAVE QUESTION BODY:", req.body);

  const processQuestion = (q, assessment_id) => {
    return [
      assessment_id || 0,
      q.section_name || "",
      0, // section_id cannot be null
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
    // JSON Upload Array
    values = req.body.questions.map(q => processQuestion(q, req.body.assessment_id));
  } else {
    // Single Manual Question
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


/* =========================
   GET ASSESSMENT + CONTROLS
========================= */
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

/* =========================
   SUBMIT ASSESSMENT
========================= */
app.post("/submit-assessment", (req, res) => {
  const { assessment_id, student_email, answers } = req.body;

  const markSubmitted = () => {
    const markSql = `UPDATE assigned_students SET submitted = 1 WHERE assessment_id = ? AND student_email = ?`;
    db.query(markSql, [assessment_id, student_email], (err2) => {
      if (err2) console.error("MARK SUBMITTED ERROR:", err2);
      res.json({ success: true });
    });
  };

  if (!answers || Object.keys(answers).length === 0) {
    return markSubmitted();
  }

  // 1. Fetch all questions to evaluate answers
  db.query("SELECT * FROM questions WHERE assessment_id = ?", [assessment_id], (err, questions) => {
    if (err) {
      console.error("SUBMIT ERROR fetching questions:", err);
      return res.status(500).json({ success: false });
    }

    let totalScore = 0;
    
    // 2. Evaluate submitted answers
    for (const q of questions) {
      const studentAnswer = answers[q.id];
      if (studentAnswer) {
        if (q.question_type === 'mcq') {
          if (studentAnswer.trim() === q.correct_answer.trim()) {
            totalScore += Number(q.marks) || 1;
          }
        }
        // Note: Coding questions are not auto-graded on the server yet, so they receive 0.
      }
    }

    // 3. Save ONLY the final score to student_results
    const resultSql = `
      INSERT INTO student_results (assessment_id, student_email, score, assessment_title)
      SELECT ?, ?, ?, title FROM assessments WHERE id = ?
      ON DUPLICATE KEY UPDATE score = VALUES(score), assessment_title = VALUES(assessment_title)
    `;
    
    db.query(resultSql, [assessment_id, student_email, totalScore, assessment_id], (err2) => {
      if (err2) console.error("SAVE RESULT ERROR:", err2);
      
      markSubmitted();
    });
  });
});

/* =========================
   PRACTICE DETAILS (REACT ENDPOINT)
========================= */
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

/* =========================
   SUBMIT PRACTICE
========================= */
app.post("/submit-practice", (req, res) => {
  const { practice_id, student_email } = req.body;
  // WE ONLY MARK IT SUBMITTED, WE NEVER SAVE THE ANSWERS
  const sql = `UPDATE assigned_practices SET submitted = 1 WHERE practice_id = ? AND student_email = ?`;
  
  db.query(sql, [practice_id, student_email], (err) => {
    if (err) {
      console.error("SUBMIT PRACTICE ERROR:", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});

/* =========================
   ADMIN PANEL ADVANCED ENDPOINTS
========================= */

// 1. Dashboard Stats
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

// 2. Recent Security Violations (Telemetry Feed)
app.get("/admin/recent-violations", (req, res) => {
  const sql = `
    SELECT pl.*, u.name AS student_name, a.title AS assessment_title
    FROM proctoring_logs pl
    LEFT JOIN users u ON pl.student_email = u.email
    LEFT JOIN assessments a ON pl.assessment_id = a.id
    ORDER BY pl.id DESC
    LIMIT 5
  `;
  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: true }); }
    
    // Map log types to friendly names and severity levels
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

// 3. Students Management Directory
app.get("/admin/students", (req, res) => {
  const sql = `
    SELECT u.email, u.name, u.dob, u.roll_number, u.personal_number, u.college_name,
           COALESCE(ROUND(AVG(sr.score)), 0) AS avg_score,
           (SELECT COUNT(*) FROM proctoring_logs pl WHERE pl.student_email = u.email) AS violation_count
    FROM users u
    LEFT JOIN student_results sr ON u.email = sr.student_email
    GROUP BY u.email, u.name, u.dob, u.roll_number, u.personal_number, u.college_name
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
        status: status,
        avg_score: row.avg_score + "%",
        last_active: row.violation_count > 0 ? "2 mins ago" : "Active"
      };
    });
    
    res.json(mapped);
  });
});

// 4. Assessments List (Tests & Practices)
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
          test_type: row.test_type
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
          test_type: "practice_table"
        };
      });

      res.json([...mappedAssessments, ...mappedPractices]);
    });
  });
});

// 5. Update Assessment Detail & Student Assignments
app.post("/admin/update-assessment", (req, res) => {
  const { id, title, description, start_time, end_time, total_time, emails, test_type } = req.body;

  if (!id || !title) {
    return res.status(400).json({ success: false, error: "Assessment ID and Title are required" });
  }

  const updateTest = () => {
    const sql = "UPDATE assessments SET title = ?, description = ?, start_time = ?, end_time = ?, total_time = ? WHERE id = ?";
    db.query(sql, [title, description, start_time, end_time, total_time, id], (err) => {
      if (err) { console.error(err); return res.status(500).json({ success: false }); }
      
      // Update Assigned emails
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
      
      // Update Assigned emails
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

// 6. Delete Assessment
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

// 7. Add Student Manually
app.post("/admin/add-student", async (req, res) => {
  const { email, name, password, dob, roll_number, personal_number, college_name } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ success: false, error: "Email, Name and Password are required" });
  }

  try {
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (email, name, password, dob, roll_number, personal_number, college_name) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [
      email.trim(), 
      name.trim(), 
      hashedPassword,
      dob ? dob : null,
      roll_number ? roll_number.trim() : null,
      personal_number ? personal_number.trim() : null,
      college_name ? college_name.trim() : null
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

// 8. Security Violations List (Detail View)
app.get("/admin/violations-list", (req, res) => {
  const sql = `
    SELECT pl.*, u.name AS student_name, a.title AS assessment_title
    FROM proctoring_logs pl
    LEFT JOIN users u ON pl.student_email = u.email
    LEFT JOIN assessments a ON pl.assessment_id = a.id
    ORDER BY pl.id DESC
  `;
  db.query(sql, (err, results) => {
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
        time: "2 mins ago", // friendly formatted
        status: row.file_path ? "Review" : "Resolved",
        file_path: row.file_path
      };
    });
    
    res.json(mapped);
  });
});

// 9. Fetch Assigned Student Emails (For Editing)
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

/* =========================
   AETHON INTELLIGENCE AGENT (GROQ)
========================= */
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
      { role: "system", content: "You are Aethon Intelligence, an AI data analyst for an assessment platform. The database has tables: users (email, name, college_name, roll_number), assessments (id, title, test_type), student_results (id, student_email, assessment_id, score, percentage, submitted_at), proctoring_logs (id, student_email, assessment_id, log_type). Note: log_type contains values like 'tab_switch', 'fullscreen_exit', 'hover_out'. If asked for data, return ONLY a valid SQL query wrapped in ```sql ... ```. If chatting, reply normally. For SQL, only use SELECT." },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
    });

    let aiResponse = chatCompletion.choices[0]?.message?.content || "I couldn't process that.";

    const sqlMatch = aiResponse.match(/```sql\n([\s\S]*?)\n```/i) || aiResponse.match(/```([\s\S]*?)```/i);
    if (sqlMatch && sqlMatch[1].trim().toUpperCase().startsWith("SELECT")) {
      const sql = sqlMatch[1].trim();
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

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});