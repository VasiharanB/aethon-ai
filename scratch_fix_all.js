const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const adminHtml = fs.readFileSync(path.join(publicDir, 'admin.html'), 'utf8');


const sidebarMatch = adminHtml.match(/<span class="menu-label">AI Agent<\/span>[\s\S]*?<a href="admin-prompts\.html"[\s\S]*?<\/a>/);
const sidebarHTML = sidebarMatch ? sidebarMatch[0] : '';


const overlayMatch = adminHtml.match(/<!-- AETHON INTELLIGENCE FULLSCREEN OVERLAY -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
let overlayHTML = '';
if (overlayMatch) {
  overlayHTML = overlayMatch[0];
}

const filesToUpdate = ['admin-students.html', 'admin-assessments.html', 'admin-monitoring.html', 'admin-violations.html', 'admin-settings.html'];

for (const file of filesToUpdate) {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  
  const oldSidebarMatch = content.match(/<span class="menu-label">AI Agent<\/span>[\s\S]*?(?:<span class="menu-label">System<\/span>|<\/nav>)/);
  if (oldSidebarMatch && sidebarHTML) {
    const isSystemNext = oldSidebarMatch[0].includes('System');
    const replacement = sidebarHTML + (isSystemNext ? '\n      \n      <span class="menu-label">System</span>' : '\n      \n    </nav>');
    content = content.replace(oldSidebarMatch[0], replacement);
    modified = true;
  }

  
  const oldOverlayMatch = content.match(/<!-- (?:AETHON INTELLIGENCE FULLSCREEN OVERLAY|AI AGENT OVERLAY) -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  if (oldOverlayMatch && overlayHTML) {
    content = content.replace(oldOverlayMatch[0], overlayHTML);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
