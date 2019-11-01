var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
var path = require("path");
const con = require("./Util/dbconnection");

var app = express();
app.set("html");
app.use(
  session({
    secret: "gfesrgdthyjguhjm345y678yiu,jk.lihlku,ytrfdsefdv",
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
  con.execute("SELECT * FROM doctor").then(([result]) => {
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
      return con.execute("SELECT * FROM doctor;").then(([result]) => {
        return res.status(422).render("doctor", {
          doctors: result,
          error: errors.array()[0].msg,
          input: req.body.searchText
        });
      });
    }
    return con
      .execute(
        "SELECT * FROM `doctor` WHERE (`did` = ? OR `dname` LIKE ? OR `specialization` LIKE ?)",
        [id, name, name]
      )
      .then(([result]) => {
        return res.render("doctor", {
          doctors: result,
          error: "",
          input: req.body.searchText
        });
      });
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
    body("pname", "Name Should only contain letters")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Name Should be Minimum 3 Characters Long")
      .custom(value => {
        const letterNumber = /^[a-zA-Z .]+$/;
        if (value.match(letterNumber)) {
          return true;
        }
        return false;
      }),
    body("email", "Email is invalid")
      .normalizeEmail()
      .isEmail()
      .custom(value => {
        return con
          .execute("SELECT * FROM `patient` WHERE email = ?", [value])
          .then(([result]) => {
            console.log(result);
            if (result.length > 0) {
              return Promise.reject("Email is Already in use");
            }
          });
      }),
    body("password", "Password Must be Minimum of 6 Characters Long")
      .trim()
      .isLength({ min: 6 }),
    body("address", "Address Must be Minimum 5 Characters Long")
      .trim()
      .isLength({ min: 5 }),
    body("pno", "Invalid Phone Number")
      .trim()
      .isDecimal()
  ],
  (req, res) => {
    const error = validationResult(req);
    console.log(error);
    res.render("signup", { data: req.body, error: "" });
  }
);

app.listen(8800);
