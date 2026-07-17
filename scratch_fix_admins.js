const db = require("./db");
const bcrypt = require("bcrypt");

async function fixAdmins() {
  try {
    const hashed = await bcrypt.hash("admin123", 10);
    
    
    db.query("UPDATE admin_users SET password = ? WHERE email = ?", [hashed, "admin@aethon.edu"], (err, res1) => {
      if (err) console.error("Error updating admin@aethon.edu:", err);
      else console.log("Updated admin@aethon.edu password to admin123 (hashed)");
      
      
      db.query("UPDATE admin_users SET password = ? WHERE email = ?", [hashed, "laxman123@gmail.com"], (err, res2) => {
        if (err) console.error("Error updating laxman123@gmail.com:", err);
        else console.log("Updated laxman123@gmail.com password to admin123 (hashed)");
        
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Fix failed:", error);
    process.exit(1);
  }
}

fixAdmins();
