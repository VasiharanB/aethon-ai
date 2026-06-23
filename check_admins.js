const db = require('./db');
db.query("SELECT * FROM admin_users", (err, results) => {
  if (err) throw err;
  console.log(results);
  process.exit();
});
