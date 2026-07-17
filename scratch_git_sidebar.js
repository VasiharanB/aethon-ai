const { execSync } = require("child_process");
try {
  console.log("Checking git history for Sidebar.jsx...");
  const log = execSync("git log --oneline -- react-app/src/components/Sidebar.jsx", { encoding: "utf8" });
  console.log(log);
} catch (err) {
  console.error("Git log failed:", err.message);
}
