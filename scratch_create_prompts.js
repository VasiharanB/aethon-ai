const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, 'public', 'admin.html');
const promptsPath = path.join(__dirname, 'public', 'admin-prompts.html');

let html = fs.readFileSync(adminPath, 'utf8');


html = html.replace('<title>Aethon Admin - Overview</title>', '<title>Aethon Admin - Prompt Library</title>');


const styles = `
  <style>
    .prompts-container { display: flex; margin-top: 30px; }
    .prompt-column { flex: 1; display: flex; flex-direction: column; gap: 40px; }
    .prompts-divider { width: 1px; background: rgba(255, 255, 255, 0.1); margin: 0 30px; }
    .prompt-category h3 { font-size: 16px; margin-bottom: 15px; color: #e4e4e7; display: flex; align-items: center; gap: 8px; }
    .prompt-grid { display: flex; flex-direction: column; gap: 12px; }
    .prompt-btn { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 14px; color: #d4d4d8; text-align: left; cursor: pointer; transition: all 0.2s; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
    .prompt-btn:hover { background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3); transform: translateX(4px); }
    .prompt-btn .prompt-text { color: #fff; font-weight: 500; line-height: 1.4; }
    .prompt-btn .prompt-desc { color: #a1a1aa; font-size: 11px; }
    
    @media (max-width: 992px) {
      .prompts-container { flex-direction: column; }
      .prompts-divider { width: 100%; height: 1px; margin: 30px 0; }
    }
  </style>
`;
html = html.replace('</head>', styles + '\n</head>');


html = html.replace('<span class="env-name">Admin Overview</span>', '<span class="env-name">Prompt Library</span>');


html = html.replace('<a href="admin.html" class="menu-item active">', '<a href="admin.html" class="menu-item">');
html = html.replace('<a href="admin-prompts.html" class="menu-item" style="color: #c084fc;">', '<a href="admin-prompts.html" class="menu-item active" style="color: #c084fc;">');


const promptsContent = `
      <div class="page-title-block">
        <h1 class="page-title">Prompt Library</h1>
        <p class="page-subtitle">A curated collection of text commands to query and modify database records seamlessly.</p>
      </div>

      <div class="prompts-container">
        
        <!-- LEFT COLUMN: SELECT & INSERT -->
        <div class="prompt-column">
          
          <div class="prompt-category">
            <h3><i class="ri-search-line" style="color: #60a5fa;"></i> Data Retrieval (SELECT)</h3>
            <div class="prompt-grid">
              <button class="prompt-btn" onclick="usePrompt('Show me the top 10 students with the highest average scores.')">
                <span class="prompt-text">"Show me the top 10 students with the highest average scores."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Count how many students are registered in the platform.')">
                <span class="prompt-text">"Count how many students are registered in the platform."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Find all students who have a tab_switch proctoring violation.')">
                <span class="prompt-text">"Find all students who have a tab_switch proctoring violation."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('List all students from [College Name].')">
                <span class="prompt-text">"List all students from [College Name]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('What is the average score for the assessment [ID]?')">
                <span class="prompt-text">"What is the average score for the assessment [ID]?"</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Show me all test assessments created after [Date].')">
                <span class="prompt-text">"Show me all test assessments created after [Date]."</span>
              </button>
            </div>
          </div>

          <div class="prompt-category">
            <h3><i class="ri-add-line" style="color: #10b981;"></i> Data Insertion (INSERT)</h3>
            <div class="prompt-grid">
              <button class="prompt-btn" onclick="usePrompt('Add a new student with email [Email], name [Name], college [College].')">
                <span class="prompt-text">"Add a new student with email [Email], name [Name], college [College]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Insert a new assessment titled [Title] with test_type practice.')">
                <span class="prompt-text">"Insert a new assessment titled [Title] with test_type practice."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Add a new proctoring log for [Email] with log_type tab_switch.')">
                <span class="prompt-text">"Add a new proctoring log for [Email] with log_type tab_switch."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Add a new student result for [Email] with score [Score].')">
                <span class="prompt-text">"Add a new student result for [Email] with score [Score]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Insert a new admin user with email [Email].')">
                <span class="prompt-text">"Insert a new admin user with email [Email]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Add a new test assessment titled [Title] with 120 minutes duration.')">
                <span class="prompt-text">"Add a new test assessment titled [Title] with 120 minutes duration."</span>
              </button>
            </div>
          </div>

        </div>

        <!-- DIVIDER -->
        <div class="prompts-divider"></div>

        <!-- RIGHT COLUMN: UPDATE & DELETE -->
        <div class="prompt-column">

          <div class="prompt-category">
            <h3><i class="ri-edit-line" style="color: #f59e0b;"></i> Data Modification (UPDATE)</h3>
            <div class="prompt-grid">
              <button class="prompt-btn" onclick="usePrompt('Update the score of [Student Email] to 95 for assessment [ID].')">
                <span class="prompt-text">"Update the score of [Student Email] to 95 for assessment [ID]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Change the college name of [Student Email] to [New College].')">
                <span class="prompt-text">"Change the college name of [Student Email] to [New College]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Update the test_type of assessment [ID] to practice.')">
                <span class="prompt-text">"Update the test_type of assessment [ID] to practice."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Set the percentage to 100 for all student_results where score > 90.')">
                <span class="prompt-text">"Set the percentage to 100 for all student_results where score > 90."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Update the roll_number of [Student Email] to [New Roll Number].')">
                <span class="prompt-text">"Update the roll_number of [Student Email] to [New Roll Number]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Change the log_type of proctoring log [ID] to resolved.')">
                <span class="prompt-text">"Change the log_type of proctoring log [ID] to resolved."</span>
              </button>
            </div>
          </div>

          <div class="prompt-category">
            <h3><i class="ri-delete-bin-line" style="color: #ef4444;"></i> Data Deletion (DELETE)</h3>
            <div class="prompt-grid">
              <button class="prompt-btn" onclick="usePrompt('Delete all student results where the score is 0.')">
                <span class="prompt-text">"Delete all student results where the score is 0."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Remove all proctoring logs for [Student Email].')">
                <span class="prompt-text">"Remove all proctoring logs for [Student Email]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Delete the assessment with ID [Assessment ID].')">
                <span class="prompt-text">"Delete the assessment with ID [Assessment ID]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Remove all users from [College Name].')">
                <span class="prompt-text">"Remove all users from [College Name]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Delete all student_results submitted before [Date].')">
                <span class="prompt-text">"Delete all student_results submitted before [Date]."</span>
              </button>
              <button class="prompt-btn" onclick="usePrompt('Clear all practice assessments with 0 candidates.')">
                <span class="prompt-text">"Clear all practice assessments with 0 candidates."</span>
              </button>
            </div>
          </div>

        </div>

      </div>
      
      <script>
        function usePrompt(text) {
          if(typeof openAgent === 'function') openAgent();
          const input = document.getElementById('agent-input');
          if(input) {
            input.value = text;
            setTimeout(() => input.focus(), 100);
          }
        }
      </script>
`;


const startIdx = html.indexOf('<div class="page-title-block">');
const endIdx = html.indexOf('</div>\n  </div>\n\n\n  <!-- AETHON INTELLIGENCE FULLSCREEN OVERLAY -->');

if (startIdx !== -1 && endIdx !== -1) {
  html = html.substring(0, startIdx) + promptsContent + '\n    ' + html.substring(endIdx);
}

fs.writeFileSync(promptsPath, html);
console.log('Created admin-prompts.html with side-by-side layout');
