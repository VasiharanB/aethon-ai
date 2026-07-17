const fs = require("fs");
const path = require("path");

const brainDir = "C:\\Users\\safis\\.gemini\\antigravity\\brain";

function listChanges() {
  const dirs = fs.readdirSync(brainDir);
  const edits = [];

  for (const dir of dirs) {
    const logPath = path.join(brainDir, dir, ".system_generated", "logs", "overview.txt");
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("test.css") && (line.includes("write_to_file") || line.includes("replace_file_content") || line.includes("multi_replace_file_content"))) {
          try {
            const obj = JSON.parse(line);
            const calls = obj.tool_calls || [];
            for (const call of calls) {
              const args = call.args || {};
              const targetFile = args.TargetFile || args.targetFile || "";
              if (targetFile.includes("test.css")) {
                edits.push({
                  dir,
                  line: i,
                  step: obj.step_index,
                  created_at: obj.created_at,
                  tool: call.name,
                  description: args.Description || args.description || ""
                });
              }
            }
          } catch(e) {}
        }
      }
    }
  }

  edits.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  console.log("=== All test.css edits in chronological order ===");
  edits.forEach(e => {
    console.log(`- Date: ${e.created_at} | Conv: ${e.dir.slice(0, 8)}... | Step: ${e.step} | Tool: ${e.tool} | Desc: ${e.description}`);
  });
}
listChanges();
