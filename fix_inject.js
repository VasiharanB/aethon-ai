const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const adminHtml = fs.readFileSync(path.join(publicDir, 'admin.html'), 'utf8');


const startIdx = adminHtml.indexOf('<!-- AETHON INTELLIGENCE FULLSCREEN OVERLAY -->');
const endIdx = adminHtml.indexOf('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/');

let overlayHTML = '';
if(startIdx !== -1 && endIdx !== -1) {
  overlayHTML = adminHtml.substring(startIdx, endIdx);
}

const filesToUpdate = ['admin-students.html', 'admin-assessments.html', 'admin-monitoring.html', 'admin-violations.html', 'admin-settings.html'];

for (const file of filesToUpdate) {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  
  if (content.includes('<!-- AI AGENT OVERLAY -->') && !content.includes('agent-chat-container')) {
    content = content.replace(/<!-- AI AGENT OVERLAY -->[\s\S]*?(?=<script src="https:\/\/cdnjs\.cloudflare\.com)/, overlayHTML);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Successfully fixed overlay in ${file}`);
  }
}
