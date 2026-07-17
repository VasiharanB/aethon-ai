const db = require("./db");
const bcrypt = require("bcrypt");

const migrateTable = async (tableName) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT id, password FROM ${tableName}`, async (err, results) => {
      if (err) {
        
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`Table ${tableName} does not exist, skipping...`);
          return resolve();
        }
        return reject(err);
      }

      for (const row of results) {
        
        if (row.password.startsWith("$2b$") || row.password.startsWith("$2a$")) {
          continue;
        }

        const hashedPassword = await bcrypt.hash(row.password, 10);
        await new Promise((res, rej) => {
          db.query(`UPDATE ${tableName} SET password = ? WHERE id = ?`, [hashedPassword, row.id], (updateErr) => {
            if (updateErr) rej(updateErr);
            else res();
          });
        });
        console.log(`Updated password for ID ${row.id} in ${tableName}`);
      }
      resolve();
    });
  });
};

const runMigration = async () => {
  try {
    console.log("Migrating users table...");
    await migrateTable("users");
    console.log("Migrating admin_users table...");
    await migrateTable("admin_users");
    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
