const fs = require('fs');
const content = fs.readFileSync('public/css/style.css', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('stats') || l.toLowerCase().includes('reveal')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
