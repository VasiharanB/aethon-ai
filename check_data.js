const db = require('./db');
db.query("SELECT * FROM users", (err, results) => {
  if (err) throw err;
  console.log("Users:", results);
  db.query("SELECT * FROM proctoring_logs", (err, results2) => {
    console.log("Logs:", results2);
    process.exit();
  });
});
