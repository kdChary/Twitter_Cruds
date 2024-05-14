const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let db;

const setDbAndRun = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "twitterClone.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log(`server running at: http://localhost:3000`)
    );
  } catch (err) {
    console.log(`Db Error: ${err.message}`);
  }
};
setDbAndRun();

// Hashing the password
const checkPassword = async (password) => {
  if (password.length >= 6) {
    const hashed = await bcrypt.hash(password, 10);
    return hashed;
  }
  return false;
};

// Validating password
const validatePassword = async (password, oldPassword) => {
  const isValid = await bcrypt.compare(password, oldPassword);
  return isValid;
};

// API 1 registering a new user
app.post("/register/", async (req, res) => {
  const { username, password, name, gender } = req.body;

  const getUserQuery = `
        SELECT * FROM user WHERE username = '${username}';
    `;

  const existingUser = await db.get(getUserQuery);
  //   console.log(password);

  if (existingUser === undefined) {
    const hashedPassword = await checkPassword(password);
    // console.log(hashedPassword);

    if (hashedPassword) {
      const updateUserTable = `
        INSERT INTO 
          user(username,password,name,gender)
        VALUES
          ("${username}", "${hashedPassword}","${name}", "${gender}");
      `;
      await db.run(updateUserTable);

      res.status(200);
      res.send("User created successfully");
    } else {
      res.status(400);
      res.send("Password is too short");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

module.exports = app;
