app.get('/here', function(req, res) {
  console.log('Category: ' + req.query['category']);
connection.query('SELECT * FROM prisoners WHERE prisoner_id=?', req.query['category'] , function(error, results, fields) {
	res.render('prisoner.html',{prisoner:results});

});
});

app.get('/appoint', function(req, res) {
connection.query('SELECT * FROM visitors WHERE visitor_id in (select visitor_id from has where prisoner_id=?)', req.query['category'] , function(error, results, fields) {
	console.log(results);
	res.render('visitors.html',{visitors:results,id:req.query['category']});
});
});

app.get('/cdetails', function(req, res) {
	pid=req.query['category'];	
	connection.query('SELECT * FROM cases c,commited c1 WHERE c1.case_id=c.case_id and c1.prisoner_id=?', req.query['category'] , function(error, results, fields) {
	console.log(results);
		res.render('displayDetails.html',{cases:results,id:pid});
	});
	});

app.get('/profile', function(req, res) {
  
	connection.query('SELECT * FROM officers WHERE admin_id=?', req.query['category'] , function(error, results, fields) {
		console.log(results);
		res.render('profile.html',{officers:results});
	});
	});

app.get('/routeBack', function(req, res) {
    connection.query('SELECT * FROM prisoners WHERE prisoner_id=?', req.query['category'] , function(error, results, fields) {
		res.render('prisoner.html',{prisoner:results});
	});
	});
	
app.get('/editv', function(req, res) {
		connection.query('SELECT * FROM has h,visitors v where h.visitor_id=v.visitor_id and h.prisoner_id=?',req.query['category'],function(error, results, fields){
			res.render('editVisitor.html',{visitor:results,id:req.query['category']});
			
		});
	  });

app.post('/search', function(req, res) {
		name=req.body.search;
		connection.query('select section_id from prisoners where match (pfname,lname) against (? in natural language mode)',
		[name] , 
		function(error, results, fields) {
			 secid=results[0];
			 console.log(secid);
			connection.query('SELECT admin_id FROM section where section_id=?',secid,function(error, results, fields) {
				adminid=results
				connection.query('select * from prisoners where match (pfname,lname) against (? in natural language mode)' ,
				[name] , function(error, results, fields) {
		
			     res.render('home.html',{id:adminid,prisoners:results,sid:secid});
				});	
		});
		});
		});
		
app.get('/edit', function(req, res) {
	connection.query('SELECT case_id FROM commited c,prisoners p where p.prisoner_id=? and p.prisoner_id=c.prisoner_id',req.query['category'] , function(error, results, fields) {
	   var temp=[];
	   temp=results;
		console.log(results[6]);
		connection.query('SELECT * FROM prisoners where prisoner_id=?',req.query['category'],function(error, results, fields){
		res.render('editPrisoner.html',{temp:temp,prisoner:results,id:req.query['category']});
		});
	});
  });

app.post('/updateCriminal',function(request,response){
	fname=request.body.fname;
	 lname=request.body.lname;
	pid=request.body.pid;
	 address=request.body.address;
	datei=request.body.doi;
	 datej=request.body.dou;
	 age=request.body.age;
	 cid=request.body.cid;
		if(fname && pid)
		connection.query('UPDATE prisoners set pfname=? where prisoner_id=?',[fname,pid]); 
		if(lname && pid) 
		connection.query('UPDATE prisoners set lname=? where prisoner_id=?',[lname,pid]);	
	    if(address && pid) 
		connection.query('UPDATE prisoners set paddress=? where prisoner_id=?',[address,pid]);
		if(datei && pid) 
		connection.query('UPDATE prisoners set dateofin=? where prisoner_id=?',[datei,pid]);
		if(datej && pid) 
		connection.query('UPDATE prisoners set dateofout=? where prisoner_id=?',[datej,pid]);
		if(age && pid) 
		connection.query('UPDATE prisoners set age=? where prisoner_id=?',[age,pid]);
		if(cid && pid)
		connection.query('UPDATE commited set case_id=? where prisoner_id=?',[cid,pid]);
	    response.redirect('/home');
	   response.end();
});	

app.post('/updateVisitor',function(request,response){
	fname=request.body.fname;
	 lname=request.body.lname;
	pid=request.body.pid;
	 appnttime=request.body.appnttime;
	appntdate=request.body.appntdate;
	 status=request.body.status;
	  vid=request.body.vid;
		if(fname && pid)
		connection.query('UPDATE visitors set vfname=? where visitor_id=?',[fname,vid]); 
		if(lname && pid)
		connection.query('UPDATE visitors set vlname=? where visitor_id=?',[lname,vid]); 
	    if(appnttime && pid) 
		connection.query('UPDATE visitors set appnt_time=? where visitor_id=?',[appnttime,vid]);	
	    if(appntdate && pid) 
		connection.query('UPDATE visitors set appnt_date=? where visitor_id=?',[appntdate,vid]);
		if(status && pid) 
		connection.query('UPDATE visitors set appnt_status=? where visitor_id=?',[status,vid]);
     	connection.query('SELECT * FROM visitors WHERE visitor_id=?',vid, function(error, results, fields) {
		console.log(results);
		response.render('visitors.html',{visitors:results,id:pid});
		});
});	


app.get('/rouVis', function(req, res) {
	id=req.query['category'];
res.render('addVisitor.html',{id:id});
});

app.get('/logout', function(req, res) {
	req.session.destroy(function(err){
		res.redirect('/');
	})
});

app.get('/rouCriminal', function(req, res) {
  sid=req.query['category'];
res.render('addCriminal.html',{sid:sid});
});

app.get('/getHome', function(request,response) {
	var prisoners=[];
	connection.query('SELECT * FROM prisoners p where p.section_id  = (select section_id from prisoners where prisoner_id=? )'
	,request.query['category'],
			function(error, results, fields) {
			 console.log(results);
			for(var i=0;i<=results.length-1;i++)
			 	{prisoners.push(results[i]);}
			 connection.query('SELECT admin_id FROM section where section_id=?',prisoners[0].section_id,function(error, results, fields) {
	        adminid=results[0].admin_id;
			response.render('home.html',{id:adminid,prisoners:prisoners,sid:prisoners[0].section_id});
	});	
  });
});
  
app.post('/addVis',function(request,response){
fname=request.body.fname;
lname=request.body.lname;
vid=request.body.vid;
pid=request.body.id;
appnttime=request.body.appnttime;
appntdate=request.body.appntdate;
status=request.body.status;
	if (fname && lname && vid) {     
	 connection.query('insert into visitors values(?,?,?,?,?,?)', [vid,fname,lname,appnttime,status,appntdate] , function(error, results, fields) {
		 console.log(results);	 
		if(error)console.log("error");
			});
			 connection.query('insert into has values(?,?)',[vid,pid],function(error,results,fields){
				console.log(results);
				if(error)console.log("error");
		});
	connection.query('SELECT * FROM visitors WHERE visitor_id in (select visitor_id from has where prisoner_id=?)',pid, function(error, results, fields) {
		console.log(results);
		response.render('visitors.html',{visitors:results,id:pid});
	});
 }
});

app.post('/addCase',function(request,response){
	pid=request.body.pid;
	cid=request.body.caseid;
	casetype=request.body.casetype;
	doc=request.body.doc;
	toc=request.body.toc;
	connection.query('insert into cases values(?,?,?,?)',[cid,casetype,doc,toc]);
	connection.query('insert into commited values(?,?)',[cid,pid],function(error,result,fields){
		if(error)console.log("error");
			 connection.query('SELECT * FROM prisoners WHERE prisoner_id=?', pid , function(error, results, fields) {
				response.render('prisoner.html',{prisoner:results});
 		});
	});
});
		
app.get('/add', function(req, res) {
	pid=req.query['category'];
	res.render('caseDetails.html',{pid:pid});
  });

app.post('/addCriminal',function(request,response){
fname=request.body.fname;
lname=request.body.lname;
pid=request.body.pid;
address=request.body.address;
datei=request.body.doi;
datej=request.body.dou;
age=request.body.age;
sid=request.body.section_id;

if (fname && lname && sid) {                                                                                                                            
		connection.query('insert into prisoners values (?,?,?,?,?,?,?,?)', [pid,fname,lname,address,datei,datej,age,sid] , function(error, results, fields) {
			 if(error)console.log("error");
			 response.render('caseDetails.html',{pid:pid});
			 response.end();	
});
	}
	else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.post('/auth', function(request, response) {
	email = request.body.email;
	 password = request.body.password;
	
	if (email && password) {
		connection.query('SELECT * FROM login WHERE emailid = ? AND password = ?', [email, password] , function(error, results, fields) {
			 if (results.length > 0) {
				console.log(results);
			 	request.session.loggedin = true;
			 	request.session.email = results.emailid;
			 	request.session.password=results.password;
			 	id=results[0].admin_id;
			 	response.redirect('/home');
			 } else {
			 	response.send('Incorrect emailid and/or Password!');
			 }		
			response.end();
		});
	} else {
		response.send('Please enter Email Id and Password!');
		response.end();
	}
});

app.get('/home', function(request, response) {
var prisoners=[];
if (request.session.loggedin) 
		{
		console.log(id);
		connection.query('SELECT * FROM prisoners p where p.section_id  = (select  s.section_id from section s ,login l where s.admin_id=l.admin_id and l.admin_id=?)',[id],
			function(error, results, fields) {
			for(var i=0;i<=results.length-1;i++)
			 	{prisoners.push(results[i]);
			 	}
		 for(var i=0;i<=1;i++)
		 		console.log(prisoners[i]);	
	  response.render('home.html',{id:id,prisoners:prisoners,sid:prisoners[0].section_id});
		 });
	} 
	else {
	response.send('Please login to view this page!');
	}
});

