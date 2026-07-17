const bcrypt = require("bcrypt");
const hash = "$2b$10$WHmVrH7vQh4mVOP7gijEou4JEl2nlt3L2j82RNWU.P5uEMw8Um5h2";

bcrypt.compare("password123", hash).then(res => {
  console.log("password123 matches:", res);
});
bcrypt.compare("laxman123", hash).then(res => {
  console.log("laxman123 matches:", res);
});
