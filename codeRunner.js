const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function executeProcess(cmd, args, options, stdinData = "", timeoutMs = 5000) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(cmd, args, options);
    } catch (e) {
      return resolve({ status: "Runtime Error", error: e.message });
    }

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch (e) {}
      resolve({ status: "Time Limit Exceeded", error: "Execution timed out." });
    }, timeoutMs);

    if (child.stdin) {
      child.stdin.on("error", (e) => {
        console.error("Stdin Error:", e);
      });
      child.stdin.write(stdinData);
      child.stdin.end();
    }

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ status: "Compilation/Execution Error", error: err.message });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) return;

      if (code !== 0) {
        resolve({ status: "Runtime Error", error: stderr || `Exit code: ${code}` });
      } else {
        resolve({ status: "Success", stdout });
      }
    });
  });
}

async function runCode(language, code, inputStr = "") {
  const tempDir = path.join(__dirname, "temp_runs");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const runId = Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const runDir = path.join(tempDir, `run_${runId}`);
  fs.mkdirSync(runDir, { recursive: true });

  try {
    const lang = language.toLowerCase();

    if (lang === "python") {
      const filePath = path.join(runDir, "solution.py");
      fs.writeFileSync(filePath, code);
      let res = await executeProcess("python", ["solution.py"], { cwd: runDir }, inputStr);
      if (res.error && (res.error.includes("ENOENT") || res.error.includes("not found"))) {
        res = await executeProcess("python3", ["solution.py"], { cwd: runDir }, inputStr);
      }
      return res;
    }

    if (lang === "javascript" || lang === "js") {
      const filePath = path.join(runDir, "solution.js");
      fs.writeFileSync(filePath, code);
      return await executeProcess("node", ["solution.js"], { cwd: runDir }, inputStr);
    }

    if (lang === "cpp") {
      const filePath = path.join(runDir, "solution.cpp");
      fs.writeFileSync(filePath, code);
      
      const compileRes = await executeProcess("g++", ["solution.cpp", "-o", "solution.exe"], { cwd: runDir });
      if (compileRes.status !== "Success") {
        return { status: "Compilation Error", error: compileRes.error };
      }
      
      const exePath = path.join(runDir, "solution.exe");
      return await executeProcess(exePath, [], { cwd: runDir }, inputStr);
    }

    if (lang === "java") {
      const filePath = path.join(runDir, "Solution.java");
      fs.writeFileSync(filePath, code);

      const compileRes = await executeProcess("javac", ["Solution.java"], { cwd: runDir });
      if (compileRes.status !== "Success") {
        return { status: "Compilation Error", error: compileRes.error };
      }

      return await executeProcess("java", ["Solution"], { cwd: runDir }, inputStr);
    }

    return { status: "Unsupported Language", error: `Language ${language} is not supported.` };
  } catch (err) {
    return { status: "Runtime Error", error: err.message };
  } finally {
    
    setTimeout(() => {
      try {
        if (fs.existsSync(runDir)) {
          fs.rmSync(runDir, { recursive: true, force: true });
        }
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }, 1000);
  }
}

module.exports = { runCode };
