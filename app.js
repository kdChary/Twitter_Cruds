const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

const secretText = "twitterClone";

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

// Authenticating user with jwtToken
const AuthenticateUser = (request, response, next) => {
  const authHeader = request.headers["authorization"];
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    const jwtToken = authHeader.split(" ")[1];
    jwt.verify(jwtToken, secretText, async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
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

// API 2 login the user.
app.post("/login/", async (req, res) => {
  const { username, password } = req.body;

  const getUserQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const userExists = await db.get(getUserQuery);

  if (userExists === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isValidPassword = await validatePassword(
      password,
      userExists.password
    );

    if (isValidPassword) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, secretText);
      res.send({ jwtToken });
      //   console.log(jwtToken);
    } else {
      res.status(400);
      res.send("Invalid Password");
    }
  }
});

module.exports = app;
