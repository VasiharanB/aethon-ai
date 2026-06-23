const db = require('./db');
db.query("INSERT IGNORE INTO admin_users (name, email, password) VALUES ('Default Admin', 'admin@aethon.edu', 'placeholder')", (err) => {
  if (err) throw err;
  console.log("Default admin added.");
  process.exit();
});
