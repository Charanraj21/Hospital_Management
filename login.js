var mysql = require("mysql");
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
var path = require("path");
var router = express.Router();

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hospital"
});

var app = express();
app.set("html");
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.set('views', path.join(__dirname ,'views'));
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');

app.set("view engine", "ejs");
app.set("views", "views");
app.get("/", function(request, response) {
  response.render("index");
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/appointment", (req, res) => {
  res.render("appointment");
});

app.get("/doctor", (req, res) => {
  return connection.query("SELECT * FROM doctor;", (err, result) => {
    return res.render("doctor", {
      doctors: result,
      error: "",
      input: ""
    });
  });
});

app.post(
  "/doctor",
  [
    body("searchText", "Seach should contain only characters and numbers")
      .trim()
      .optional({ checkFalsy: true })
      .isAlphanumeric()
  ],
  (req, res) => {
    const errors = validationResult(req);

    console.log(req.body);

    id = Number.isNaN(Number(req.body.searchText))
      ? 0
      : Number(req.body.searchText);
    name = "%" + req.body.searchText + "%";

    if (!errors.isEmpty()) {
      return connection.query("SELECT * FROM doctor;", (err, result) => {
        return res.status(422).render("doctor", {
          doctors: result,
          error: errors.array()[0].msg,
          input: req.body.searchText
        });
      });
    }
    return connection.query(
      "SELECT * FROM `doctor` WHERE (`did` = ? OR `dname` LIKE ? OR `specialization` LIKE ?)",
      [id, name, name],
      (err, result) => {
        console.log(err, result);
        return res.render("doctor", {
          doctors: result,
          error: "",
          input: req.body.searchText
        });
      }
    );
  }
);

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/signup", (req, res) => {
  res.render("signup", { data: {}, error: "" });
});

app.post(
  "/signup",
  [
    body("name", "Name Should only contain letters")
      .trim()
      .optional({ checkFalsy: true })
      .isAlpha(),
    body("email", "Email is in valid")
      .trim()
      .normalizeEmail()
      .isEmail()
      .custom(value => {
        return connection.query(
          "SELECT * FROM `patient` WHERE email = ?",
          [value],
          (err, result) => {
            if (!result) {
              throw new Error("Email is Already in Use");
            }
          }
        );
      })
  ],
  (req, res) => {
    res.render("signup", { data: req.body, error: "" });
  }
);

app.listen(8800);
