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

/**********************MIDDLEWARE FUNTIONS*****************************/

const isAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    res.redirect("/login/patient");
  } else {
    next();
  }
};

const isPat = (req, res, next) => {
  if (req.session.UserType !== "patient") {
    res.render("error", {
      code: "401",
      message: "Sorry You Cannot Access This Page"
    });
  } else {
    next();
  }
};

const isDoc = (req, res, next) => {
  if (req.session.UserType !== "doctor") {
    res.render("error", {
      code: "401",
      message: "Sorry You Cannot Access This Page"
    });
  } else {
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.UserType !== "admin") {
    res.render("error", {
      code: "401",
      message: "Sorry You Cannot Access This Page"
    });
  } else {
    next();
  }
};

const isAdmitted = (req, res, next) => {
  if (req.session.status) {
    next();
  } else {
    res.render("error", {
      code: "401",
      message: "Sorry You Cannot Access This Page"
    });
  }
};

const isNotAdmitted = (req, res, next) => {
  if (!req.session.status) {
    next();
  } else {
    res.render("error", {
      code: "401",
      message: "Sorry You Cannot Access This Page"
    });
  }
};

/***************MIDDLEWARE FUNTIONS END**************/

/****************MIDDLEWARE*************************/

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.UserId = req.session.UserId;
  res.locals.UserType = req.session.UserType;
  res.locals.status = req.session.status;

  next();
});
/****************MIDDLEWARE END**********************/

/*********************ROUTES**************************/

app.get("/", function(request, response) {
  response.render("index");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/register", (req, res) => {
  res.render("register");
});

/***************************Appointment Routes for Patient***********************/

app.get("/patient/myappointment", isAuth, isPat, (req, res) => {
  con
    .execute(
      `SELECT appointed.*, doctor.dname, doctor.pno, doctor.specialization 
      FROM appointed, doctor WHERE appointed.did = doctor.did AND appointed.pid = ?
      ORDER BY appointed.date DESC`,
      [req.session.UserId]
    )
    .then(([results]) => {
      return res.render("myappoint", {
        results: results,
        input: {},
        error: ""
      });
    });
});

app.post(
  "/patient/myappointment",
  [
    body("searchText", "Seach should contain only characters and numbers")
      .trim()
      .optional({ checkFalsy: true })
      .isAlphanumeric()
  ],
  isAuth,
  isPat,
  (req, res) => {
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      return con
        .execute(
          `SELECT appointed.*, doctor.dname, doctor.pno, doctor.specialization 
        FROM appointed, doctor WHERE appointed.did = doctor.did AND appointed.pid = ?
        ORDER BY appointed.date DESC`,
          [req.session.UserId]
        )
        .then(([results]) => {
          return res.render("myappoint", {
            results: results,
            input: req.body,
            error: errors.array()[0].msg
          });
        })
        .catch(err => console.log(err));
    } else if (req.body.date == "") {
      return con
        .execute(
          `SELECT appointed.*, doctor.dname, doctor.pno, doctor.specialization 
        FROM appointed, doctor WHERE appointed.did = doctor.did AND appointed.pid = ?
        AND (doctor.did = ? OR dname LIKE ? OR specialization LIKE ?)
        ORDER BY appointed.date DESC`,
          [
            Number(req.session.UserId),
            Number(req.body.searchText),
            "%" + req.body.searchText + "%",
            "%" + req.body.searchText + "%"
          ]
        )
        .then(([results]) => {
          return res.render("myappoint", {
            results: results,
            input: req.body,
            error: ""
          });
        })
        .catch(err => console.log(err));
    } else {
      return con
        .execute(
          `SELECT appointed.*, doctor.dname, doctor.pno, doctor.specialization 
        FROM appointed, doctor WHERE appointed.did = doctor.did AND appointed.pid = ?
        AND (doctor.did = ? OR dname LIKE ? OR specialization LIKE ?) AND date = ?
        ORDER BY appointed.date DESC`,
          [
            Number(req.session.UserId),
            Number(req.body.searchText),
            "%" + req.body.searchText + "%",
            "%" + req.body.searchText + "%",
            req.body.date
          ]
        )
        .then(([results]) => {
          return res.render("myappoint", {
            results: results,
            input: req.body,
            error: ""
          });
        })
        .catch(err => console.log(err));
    }
  }
);

app.get("/patient/appointment", isAuth, isPat, isNotAdmitted, (req, res) => {
  con
    .execute("SELECT * FROM doctor;")
    .then(([doctors]) => {
      return res.render("pappoint", {
        doctors: doctors,
        error: "",
        input: {},
        validationErrors: ""
      });
    })
    .catch(err => console.log(err));
});

app.post(
  "/patient/appointment",
  [
    body("did").custom(value => {
      if (value === "") {
        throw new Error("Please Select a Doctor");
      }
      return true;
    }),
    body("date").custom((value, { req }) => {
      if (value === "") {
        throw new Error("Please Select a Date");
      }
      return con
        .execute(
          "SELECT * FROM appointed WHERE did = ? AND time = ? AND date = ?",
          [req.body.did, req.body.time, value]
        )
        .then(([result]) => {
          if (result.length > 0) {
            return Promise.reject(
              "Date and Time is Already Appointed, Please Select a Different Date or Time"
            );
          }
        });
    }),
    body("time").custom(value => {
      if (value === "") {
        throw new Error("Please Select a Time Slot");
      }
      return true;
    })
  ],
  isAuth,
  isPat,
  isNotAdmitted,
  (req, res) => {
    errors = validationResult(req);
    console.log(req.body);
    console.log(errors);
    if (!errors.isEmpty()) {
      return con
        .execute("SELECT * FROM doctor;")
        .then(([doctors]) => {
          return res.render("pappoint", {
            doctors: doctors,
            error: errors.array()[0].msg,
            input: req.body,
            validationErrors: errors.array()
          });
        })
        .catch(err => console.log(err));
    }
    console.log(req.body);
    con
      .execute(
        `INSERT INTO appointed(pid, did, time, date, fees) 
    VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.UserId,
          req.body.did,
          req.body.time,
          req.body.date,
          req.body.fees
        ]
      )
      .then(() => {
        return res.redirect("/patient/myappointment");
      });
  }
);
/***************************Appointment Routes for Patient END****************************************************/

/***************************Relative Routes for Patient***********************************************************/

app.get("/patient/relatives", isAuth, isPat, (req, res) => {
  con
    .execute("SELECT * FROM relative WHERE pid = ?", [req.session.UserId])
    .then(([results]) => {
      return res.render("prelatives", {
        results: results,
        error: "",
        count: results.length
      });
    });
});

app.get("/patient/relatives/add", isAuth, isPat, (req, res) => {
  res.render("preladd", {
    data: {},
    error: "",
    validationErrors: [],
    type: "add",
    odata: {}
  });
});

app.post(
  "/patient/relatives/add",
  [
    body("rname", "Name Should only contain letters")
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
    body("relation", "Name Should only contain letters")
      .trim()
      .isAlpha()
      .custom((value, { req }) => {
        return con
          .execute(`SELECT count(pid) as 'count' FROM relative WHERE pid=?`, [
            req.session.UserId
          ])
          .then(([result]) => {
            if (!(result[0].count < 5)) {
              return Promise.reject("You cannot add more relatives");
            }
          });
      }),
    body("pno", "Invalid Phone Number")
      .trim()
      .isDecimal()
      .custom((value, { req }) => {
        return con
          .execute(
            `SELECT * FROM relative WHERE pid = ? AND rname LIKE ? AND relation LIKE ?`,
            [req.session.UserId, req.body.rname, req.body.relation]
          )
          .then(([result]) => {
            if (result.length > 0) {
              return Promise.reject("That Relative Already Exists");
            }
          });
      })
  ],
  isAuth,
  isPat,
  (req, res) => {
    const error = validationResult(req);
    console.log(error);
    if (!error.isEmpty()) {
      return res.status(422).render("preladd", {
        data: req.body,
        error: error.array()[0].msg,
        validationErrors: error.array(),
        type: "add",
        odata: {}
      });
    }
    console.log("Input is Valid");

    con
      .execute(
        `INSERT INTO relative(pid, rname, relation, pno) 
        VALUES (?, ?, ?, ?)`,
        [req.session.UserId, req.body.rname, req.body.relation, req.body.pno]
      )
      .then(() => {
        return res.redirect("/patient/relatives");
      })
      .catch(err => console.log(error));
  }
);

app.get("/patient/relatives/edit", isAuth, isPat, (req, res) => {
  con
    .execute(
      "SELECT * FROM relative WHERE pid = ? AND rname = ? AND relation = ?",
      [req.session.UserId, req.query.rname, req.query.relation]
    )
    .then(([results]) => {
      req.session.orname = req.query.rname;
      req.session.orelation = req.query.relation;
      return req.session.save(() => {
        return res.render("preladd", {
          data: results[0],
          error: "",
          validationErrors: [],
          type: "edit",
          odata: {
            rname: req.query.rname,
            relation: req.query.relation
          }
        });
      });
    })
    .catch(err => console.log(err));
});

app.post(
  "/patient/relatives/edit",
  [
    body("rname", "Name Should only contain letters")
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
    body("relation", "Name Should only contain letters")
      .trim()
      .isAlpha(),
    body("pno", "Invalid Phone Number")
      .trim()
      .isDecimal()
      .custom((value, { req }) => {
        return con
          .execute(
            `SELECT * FROM relative WHERE pid = ? AND rname LIKE ? AND relation LIKE ?`,
            [req.session.UserId, req.body.rname, req.body.relation]
          )
          .then(([result]) => {
            if (result.length > 0) {
              if (
                result[0].rname.toLowerCase() !==
                  req.body.orname.toLowerCase() ||
                result[0].relation.toLowerCase() !==
                  req.body.orelation.toLowerCase()
              ) {
                return Promise.reject("That Relative Already Exists");
              }
            }
          });
      })
  ],
  isAuth,
  isPat,
  (req, res) => {
    req.query.rname = req.session.orname;
    req.query.relation = req.session.orelation;
    const error = validationResult(req);
    console.log(error);
    if (!error.isEmpty()) {
      return res.status(422).render("preladd", {
        data: req.body,
        error: error.array()[0].msg,
        validationErrors: error.array(),
        type: "edit",
        odata: {
          rname: req.query.rname,
          relation: req.query.relation
        }
      });
    }
    console.log("Input is Valid", req.body);

    con
      .execute(
        `UPDATE relative SET rname= ?, relation= ?, pno= ?  
        WHERE pid = ? AND rname LIKE ? AND relation LIKE ?`,
        [
          req.body.rname,
          req.body.relation,
          req.body.pno,
          req.session.UserId,
          req.body.orname,
          req.body.orelation
        ]
      )
      .then(() => {
        return res.redirect("/patient/relatives");
      })
      .catch(err => console.log(error));
  }
);

app.post("/patient/relatives/delete", isAuth, isPat, (req, res) => {
  con
    .execute(
      "DELETE FROM `relative` WHERE pid = ? AND rname LIKE ? AND relation LIKE ?",
      [req.session.UserId, req.body.orname, req.body.orelation]
    )
    .then(() => {
      res.redirect("/patient/relatives");
    });
});

/***************************Relative Routes for Patient END***********************************************************/

/***************************************Availabe Doctors************************************************************/
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
/******************Availabe Doctors*****************************/

/********************SIGNUP ROUTES******************************/

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

/***********************SIGNUP ROUTES END********************************/

/***************************LOGIN ROUTES********************************/

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

app.post(
  "/login/doctor",
  [
    body("email", "Email or Password is Invalid")
      .normalizeEmail()
      .isEmail()
      .custom((value, { req }) => {
        return con
          .execute("SELECT * FROM `doctor` WHERE email = ?", [value])
          .then(([result]) => {
            console.log(result);
            if (result.length > 0) {
              if (result[0].password !== req.body.password) {
                return Promise.reject();
              } else {
                req.session.isLoggedIn = true;
                req.session.UserId = result[0].did;
                req.session.UserType = "doctor";
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
      return res.status(422).render("dlogin", {
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

// ADMIN
app.get("/login/admin", (req, res) => {
  res.render("alogin", { data: {}, error: "", validationErrors: [] });
});

app.post(
  "/login/admin",
  [
    body("email", "Email or Password is Invalid")
      .normalizeEmail()
      .isEmail()
      .custom((value, { req }) => {
        return con
          .execute("SELECT * FROM `admin` WHERE email = ?", [value])
          .then(([result]) => {
            console.log(result);
            if (result.length > 0) {
              if (result[0].password !== req.body.password) {
                return Promise.reject();
              } else {
                req.session.isLoggedIn = true;
                req.session.UserId = result[0].id;
                req.session.UserType = "admin";
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
      return res.status(422).render("alogin", {
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

/********************LOGIN ROUTES END*********************************/

/**********************LOGOUT ROUTE**********************************/

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    return res.redirect("/");
  });
});

/********************LOGOUT ROUTE END************************************/

/***********************ERROR ROUTE************************************/

app.use((req, res) => {
  res.render("error", {
    code: "404",
    message: "Oops This Page Dosent Exist"
  });
});

app.listen(8800);
