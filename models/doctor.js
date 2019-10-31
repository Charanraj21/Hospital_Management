const con = require("../Util/dbconnection");
module.exports = class Doctor {
  constructor() {}

  static FetchAll() {
    return con.execute("SELECT * FROM patient");
  }
};
