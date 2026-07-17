const fs = require('fs');
const path = require('path');

function stripHtmlComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

function stripCssComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\
}

function stripJsComments(code) {
  let inString = null;
  let inLineComment = false;
  let inBlockComment = false;
  let result = '';
  for (let i = 0; i < code.length; i++) {
    let char = code[i];
    let next = code[i + 1];

    if (inLineComment) {
      if (char === '\n' || char === '\r') {
        inLineComment = false;
        result += char;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (char === '\\') {
        result += char + (next || '');
        i++;
        continue;
      }
      if (char === inString) {
        inString = null;
      }
      result += char;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      result += char;
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    result += char;
  }
  return result;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'assets' || file === 'recordings') {
        continue;
      }
      processDirectory(fullPath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.html' || ext === '.css' || ext === '.js' || ext === '.jsx') {
        console.log('Processing:', fullPath);
        const originalContent = fs.readFileSync(fullPath, 'utf8');
        let newContent = originalContent;
        if (ext === '.html') {
          newContent = stripHtmlComments(originalContent);
        } else if (ext === '.css') {
          newContent = stripCssComments(originalContent);
        } else if (ext === '.js' || ext === '.jsx') {
          newContent = stripJsComments(originalContent);
        }
        if (newContent !== originalContent) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
        }
      }
    }
  }
}

const rootDir = __dirname;
processDirectory(rootDir);
console.log('Finished removing all comments from the project!');
