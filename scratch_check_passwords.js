const bcrypt = require("bcrypt");
const hash = "$2b$10$WHmVrH7vQh4mVOP7gijEou4JEl2nlt3L2j82RNWU.P5uEMw8Um5h2";

const candidates = ["laxman123", "laxman", "admin", "admin123", "123456", "password"];
candidates.forEach(async (pwd) => {
  const match = await bcrypt.compare(pwd, hash);
  console.log(`Password "${pwd}" matches: ${match}`);
});
