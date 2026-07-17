const mysql = require("mysql2");
const db = mysql.createConnection({ host: "localhost", user: "root", password: "", database: "portfolio" });
db.query("SELECT * FROM student_results", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit(0);
});
