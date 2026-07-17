const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'Aethon_Source_Code.md';
const IGNORE_DIRS = ['node_modules', 'build', '.git', 'coverage'];
const IGNORE_FILES = ['package-lock.json'];
const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.html', '.css', '.json'];


const isScratchFile = (filename) => filename.startsWith('scratch_');

let markdownContent = `# Aethon Project Source Code

## Hosting and Setup Guide

Follow these steps to host and run the Aethon project from scratch:

### 1. Prerequisites
- Node.js (v16 or higher)
- XAMPP or a standalone MySQL Server

### 2. Database Setup
1. Start MySQL through your XAMPP Control Panel.
2. Open phpMyAdmin (usually \`http://localhost/phpmyadmin\`).
3. Create a database named \`portfolio\`.
4. Import the provided \`portfolio.sql\` file (or run the equivalent SQL commands) to set up the tables (\`users\`, \`assessments\`, \`questions\`, \`student_results\`, etc.).

### 3. Backend Setup
1. Open a terminal in the root directory (\`c:/xampp/htdocs/portfolio\`).
2. Run \`npm install\` to install backend dependencies (express, mysql2, cors, bcrypt, jsonwebtoken, etc.).
3. Start the backend server by running:
   \`\`\`bash
   node server.js
   \`\`\`
   *(The backend server will run on port 3000)*

### 4. Frontend Setup
1. Open a new terminal and navigate to the React app folder:
   \`\`\`bash
   cd react-app
   \`\`\`
2. Run \`npm install\` to install frontend dependencies.
3. Start the React development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   *(The frontend will run on a local port, usually 5173, and will automatically open in your browser)*

### 5. Accessing the Platforms
- **Admin Dashboard**: Open \`http://localhost/portfolio/public/admin.html\` (or use live-server in the \`public\` folder).
- **Student Assessment Portal**: Handled by the React application running on port 5173.

---

## Project Codebase

`;

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                results = results.concat(walkDir(fullPath));
            }
        } else {
            if (!IGNORE_FILES.includes(file) && !isScratchFile(file)) {
                const ext = path.extname(file).toLowerCase();
                if (ALLOWED_EXTENSIONS.includes(ext) || file === 'server.js') {
                    results.push(fullPath);
                }
            }
        }
    });
    return results;
}

const allFiles = walkDir(__dirname);

allFiles.forEach(file => {
    const ext = path.extname(file).substring(1); 
    const relativePath = path.relative(__dirname, file).replace(/\\/g, '/');
    
    markdownContent += `### File: \`${relativePath}\`\n\n`;
    markdownContent += `\`\`\`${ext === 'jsx' ? 'javascript' : ext}\n`;
    
    try {
        const content = fs.readFileSync(file, 'utf8');
        markdownContent += content;
    } catch (e) {
        markdownContent += `// Error reading file: ${e.message}`;
    }
    
    markdownContent += `\n\`\`\`\n\n---\n\n`;
});

fs.writeFileSync(OUTPUT_FILE, markdownContent);
console.log(`Generated ${OUTPUT_FILE} successfully. Total files included: ${allFiles.length}`);
