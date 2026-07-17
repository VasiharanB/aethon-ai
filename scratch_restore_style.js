const { execSync } = require("child_process");
try {
  const log = execSync("git log --all --follow --oneline -- public/css/style.css", { encoding: "utf8" });
  console.log("LOG:\n", log);
} catch (err) {
  console.error("Error:", err.message);
}
