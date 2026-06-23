const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const adminHtml = fs.readFileSync(path.join(publicDir, 'admin.html'), 'utf8');

// Extract the CSS link
const cssLink = '<link rel="stylesheet" href="css/admin-agent.css">';

// Extract the Sidebar Menu Item
const sidebarMatch = adminHtml.match(/<span class="menu-label">AI Agent<\/span>[\s\S]*?<\/a>/);
const sidebarHTML = sidebarMatch ? sidebarMatch[0] : '';

// Extract the Overlay
const overlayMatch = adminHtml.match(/<!-- AI AGENT OVERLAY -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
let overlayHTML = '';
if (overlayMatch) {
  overlayHTML = overlayMatch[0];
} else {
  // Try another match if the exact comment is different
  const startIdx = adminHtml.indexOf('<div class="agent-overlay" id="agent-overlay">');
  const endIdx = adminHtml.indexOf('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/');
  if(startIdx !== -1 && endIdx !== -1) {
    overlayHTML = adminHtml.substring(startIdx, endIdx);
  }
}

// Extract scripts
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

  // 1. Inject CSS
  if (!content.includes('admin-agent.css')) {
    content = content.replace('</head>', `  ${cssLink}\n</head>`);
    modified = true;
  }

  // 2. Inject Sidebar
  if (!content.includes('Aethon Intelligence')) {
    content = content.replace('<span class="menu-label">System</span>', `\n      ${sidebarHTML}\n      \n      <span class="menu-label">System</span>`);
    modified = true;
  }

  // 3. Inject Overlay
  if (!content.includes('id="agent-overlay"')) {
    content = content.replace('</body>', `\n  <!-- AI AGENT OVERLAY -->\n${overlayHTML}\n</body>`);
    modified = true;
  }

  // 4. Inject Scripts
  if (!content.includes('admin-agent.js')) {
    content = content.replace('</body>', `${scriptsHTML}\n</body>`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
