var express = require('express');
var mysql = require('mysql');

var connection = mysql.createConnection({
 	host: "localhost",
 	user: "root",
 	password: "",
 	database: "hospital"
 });

 connection.connect(err => {
 	if (err) {
        console.log("Database is Connected");
 	} else {
 		console.log("Error connecting database");
 	}
 });

//  app.get("/", function(req,res){
//  	connection.query('SELECT * from user LIMIT 2', function(err,rows,fields){
//  		connection.end();
//  		  if (!err)
//  		  	 console.log("The solution is: ", rows);
//  		  else
//  		     console.log("Error while performing Query.");	
//  	});
//  });
