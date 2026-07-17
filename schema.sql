CREATE TABLE `admin_chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `admin_chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `admin_chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `admin_chat_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_email` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `admin_email` (`admin_email`),
  CONSTRAINT `admin_chat_sessions_ibfk_1` FOREIGN KEY (`admin_email`) REFERENCES `admin_users` (`email`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `assessments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `due_date` varchar(100) DEFAULT NULL,
  `marks` int(11) DEFAULT NULL,
  `questions` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `total_time` int(11) DEFAULT NULL,
  `test_type` varchar(50) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `assigned_practices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `practice_id` int(11) DEFAULT NULL,
  `student_email` varchar(100) DEFAULT NULL,
  `submitted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `assigned_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) DEFAULT NULL,
  `student_email` varchar(150) DEFAULT NULL,
  `submitted` tinyint(1) DEFAULT 0,
  `auto_submitted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `exam_controls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `fullscreen` tinyint(1) DEFAULT 0,
  `tab_switch` tinyint(1) DEFAULT 0,
  `hover_detection` tinyint(1) DEFAULT 0,
  `copy_paste_block` tinyint(1) DEFAULT 0,
  `webcam` tinyint(1) DEFAULT 0,
  `mic` tinyint(1) DEFAULT 0,
  `screen_record` tinyint(1) DEFAULT 0,
  `show_result` tinyint(1) DEFAULT 1,
  `tab_limit` int(11) DEFAULT 3,
  `hover_limit` int(11) DEFAULT 3,
  `auto_submit_time` tinyint(1) DEFAULT 1,
  `auto_submit_tab` tinyint(1) DEFAULT 1,
  `auto_submit_hover` tinyint(1) DEFAULT 1,
  `auto_submit_fullscreen` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `assessment_id` (`assessment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `practice_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `practice_id` int(11) DEFAULT NULL,
  `question_title` varchar(200) DEFAULT NULL,
  `question_text` text DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `marks` int(11) DEFAULT NULL,
  `visible_testcases` text DEFAULT NULL,
  `hidden_testcases` text DEFAULT NULL,
  `coding_input` text DEFAULT NULL,
  `coding_output` text DEFAULT NULL,
  `sample_testcase` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `practices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `proctoring_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `student_email` varchar(255) NOT NULL,
  `log_type` varchar(50) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=324 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `section_name` varchar(100) DEFAULT NULL,
  `section_id` int(11) NOT NULL,
  `question_type` varchar(30) DEFAULT 'mcq',
  `question_title` varchar(255) DEFAULT NULL,
  `question_text` text NOT NULL,
  `option_a` text DEFAULT NULL,
  `option_b` text DEFAULT NULL,
  `option_c` text DEFAULT NULL,
  `option_d` text DEFAULT NULL,
  `correct_answer` varchar(255) DEFAULT NULL,
  `difficulty` enum('Easy','Medium','Hard') DEFAULT 'Easy',
  `marks` int(11) DEFAULT 1,
  `visible_testcases` longtext DEFAULT NULL,
  `hidden_testcases` longtext DEFAULT NULL,
  `coding_input` text DEFAULT NULL,
  `coding_output` text DEFAULT NULL,
  `sample_testcase` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `section_name` varchar(100) NOT NULL,
  `section_type` varchar(50) NOT NULL,
  `total_questions` int(11) DEFAULT 0,
  `total_marks` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `assessment_id` (`assessment_id`),
  CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `student_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) DEFAULT NULL,
  `student_email` varchar(255) DEFAULT NULL,
  `overall_rating` int(11) DEFAULT NULL,
  `difficulty_rating` int(11) DEFAULT NULL,
  `clarity_rating` int(11) DEFAULT NULL,
  `platform_experience` int(11) DEFAULT NULL,
  `recommendation` varchar(50) DEFAULT NULL,
  `preferred_type` varchar(50) DEFAULT NULL,
  `platform_issues` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `student_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `assessment_title` varchar(255) DEFAULT NULL,
  `student_email` varchar(255) NOT NULL,
  `score` int(11) DEFAULT 0,
  `auto_submitted` tinyint(1) DEFAULT 0,
  `percentage` decimal(5,2) DEFAULT 0.00,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `mcq_score` int(11) DEFAULT 0,
  `coding_score` int(11) DEFAULT 0,
  `mcq_attended` int(11) DEFAULT 0,
  `coding_attended` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assessment_student` (`assessment_id`,`student_email`),
  KEY `assessment_id` (`assessment_id`),
  CONSTRAINT `student_results_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `roll_number` varchar(50) DEFAULT NULL,
  `personal_number` varchar(20) DEFAULT NULL,
  `college_name` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `student_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `student_email` varchar(255) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_option` varchar(255) DEFAULT NULL,
  `code_submitted` text DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_question` (`assessment_id`,`student_email`,`question_id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `fk_answers_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


