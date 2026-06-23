const fs = require('fs');
if (fs.existsSync('public/js/script.js')) {
  const content = fs.readFileSync('public/js/script.js', 'utf8');
  console.log("reveal active logic in script.js:", content.includes('reveal') || content.includes('.active'));
} else {
  console.log("script.js DOES NOT EXIST in public/js/");
}
