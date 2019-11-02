var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
const mySQLStore = require("express-mysql-session")(session);
var path = require("path");
const con = require("./Util/dbconnection");

var app = express();

app.set("view engine", "ejs");
app.set("views", "views");
app.set("html");

const sessionStore = new mySQLStore({ createDatabaseTable: true }, con);

app.use(
  session({
    secret: "gfesrgdthyjguhjm345y678yiu,jk.lihlku,ytrfdsefdv",
    resave: false,
    saveUninitialized: false,
    store: sessionStore
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// app.set('views', path.join(__dirname ,'views'));
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.UserId = req.session.UserId;
  res.locals.UserType = req.session.UserType;
  res.locals.status = req.session.status;

  next();
});

app.get("/", function(request, response) {
  response.render("index");
});

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
        "SELECT * FROM doctor WHERE (did = ? OR dname LIKE ? OR specialization LIKE ?)",
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

/*    SIGNUP ROUTES   */

// GET ROUTE
app.get("/signup", (req, res) => {
  res.render("signup", { data: {}, error: "", validationErrors: [] });
});

// POST ROUTE
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
    if (!error.isEmpty()) {
      return res.status(422).render("signup", {
        data: req.body,
        error: error.array()[0].msg,
        validationErrors: error.array()
      });
    }
    console.log("Input is Valid");

    con
      .execute(
        `INSERT INTO patient(pname, address, pno, email, password, status) 
      VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.body.pname,
          req.body.address,
          req.body.pno,
          req.body.email,
          req.body.password,
          0
        ]
      )
      .then(() => {
        return res.redirect("/login/patient");
      })
      .catch(err => console.log(error));
  }
);

/*    SIGNUP ROUTES END  */

/*    LOGIN ROUTES  */

// PATIENT
app.get("/login/patient", (req, res) => {
  res.render("plogin", { data: {}, error: "", validationErrors: [] });
});

app.post(
  "/login/patient",
  [
    body("email", "Email or Password is Invalid")
      .normalizeEmail()
      .isEmail()
      .custom((value, { req }) => {
        return con
          .execute("SELECT * FROM `patient` WHERE email = ?", [value])
          .then(([result]) => {
            console.log(result);
            if (result.length > 0) {
              if (result[0].password !== req.body.password) {
                return Promise.reject();
              } else {
                req.session.isLoggedIn = true;
                req.session.UserId = result[0].id;
                req.session.UserType = "patient";
                req.session.status = Boolean(Number(result[0].status));
                return;
              }
            }
            return Promise.reject();
          });
      }),
    body("password", "Email or Password is Invalid")
      .trim()
      .isLength({ min: 6 })
  ],
  (req, res) => {
    const error = validationResult(req);
    console.log(error);
    if (!error.isEmpty()) {
      return res.status(422).render("plogin", {
        data: req.body,
        error: error.array()[0].msg,
        validationErrors: error.array()
      });
    }
    console.log("Input is Valid");
    req.session.save(() => {
      return res.redirect("/");
    });
  }
);

// DOCTOR
app.get("/login/doctor", (req, res) => {
  res.render("dlogin", { data: {}, error: "", validationErrors: [] });
});

// ADMIN
app.get("/login/admin", (req, res) => {
  res.render("alogin", { data: {}, error: "", validationErrors: [] });
});

/*    LOGIN ROUTES END */

/*    LOGOUT ROUTE  */

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    return res.redirect("/");
  });
});

/*    LOGOUT ROUTE END */

/*    ERROR ROUTE  */

app.use((req, res) => {
  res.render("error", {
    code: "404",
    message: "Oops This Page Dosent Exist"
  });
});

app.listen(8800);
