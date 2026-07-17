const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const adminHtml = fs.readFileSync(path.join(publicDir, 'admin.html'), 'utf8');


const cssLink = '<link rel="stylesheet" href="css/admin-agent.css">';


const sidebarMatch = adminHtml.match(/<span class="menu-label">AI Agent<\/span>[\s\S]*?<a href="admin-prompts\.html"[\s\S]*?<\/a>/);
const sidebarHTML = sidebarMatch ? sidebarMatch[0] : '';


const overlayMatch = adminHtml.match(/<!-- AI AGENT OVERLAY -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
let overlayHTML = '';
if (overlayMatch) {
  overlayHTML = overlayMatch[0];
} else {
  
  const startIdx = adminHtml.indexOf('<div class="agent-overlay" id="agent-overlay">');
  const endIdx = adminHtml.indexOf('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/');
  if(startIdx !== -1 && endIdx !== -1) {
    overlayHTML = adminHtml.substring(startIdx, endIdx);
  }
}


const scriptsHTML = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <script src="js/admin-agent.js"></script>
`;

const filesToUpdate = ['admin-students.html', 'admin-assessments.html', 'admin-monitoring.html', 'admin-violations.html', 'admin-settings.html'];

for (const file of filesToUpdate) {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  
  if (!content.includes('admin-agent.css')) {
    content = content.replace('</head>', `  ${cssLink}\n</head>`);
    modified = true;
  }

  
  if (!content.includes('Aethon Intelligence')) {
    content = content.replace('<span class="menu-label">System</span>', `\n      ${sidebarHTML}\n      \n      <span class="menu-label">System</span>`);
    modified = true;
  }

  
  if (!content.includes('id="agent-overlay"')) {
    content = content.replace('</body>', `\n  <!-- AI AGENT OVERLAY -->\n${overlayHTML}\n</body>`);
    modified = true;
  }

  
  if (!content.includes('admin-agent.js')) {
    content = content.replace('</body>', `${scriptsHTML}\n</body>`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
