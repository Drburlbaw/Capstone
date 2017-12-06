var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var DM = require('./modules/document-manager');
var crypto 		= require('crypto');
var mime = require('mime');


var multer  = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'app/public/pdfs/')
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
    });
  }
});

var upload = multer({storage:storage});

var md5File = require('md5-file');

module.exports = function(app) {

// main login page //
	app.get('/', function(req,res){
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.render('home', { title: 'Hello - Welcome to Microfilm' });
		}	else{
			res.redirect('/index');
		}
		
	});

	app.get('/login', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLoginreq.cookies(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/login', function(req, res){
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});
	

// Guest Home Page // 	
	app.get('/home', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.redirect('/index');
		}
	});

	app.post('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	});
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup' });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass']
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

// logged-in user homepage //

	app.get('/index', function(req, res) {

		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('index', {  title: 'Micro Film' });
		}
		
	});

// upload //

	app.get('/upload', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('upload', {  title: 'Upload a New Document'});
		}
	});
 
	app.post('/upload',upload.array('uploadForm'),function(req,res){
	   
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	
		else{
			if(req.files){
				var message = ''
		    	for (var i = req.files.length - 1; i >= 0; i--) {
		    		let sampleFile = req.files[i]
		    		md5File(sampleFile.path, (err, hash) => {
		    			DM.addDocument(sampleFile,hash,function(con,mes){
							message += mes;
		    			});

		    		})
		    	}  
		    		if(message != '') {
						res.status(500).send(message)
					}
					else{
						res.redirect('search?upload=1');
					}
		    }	
		}
	});


// search //

	app.get('/search', function(req, res) {
		var authorized = false
		if (req.session.user != null){
	// if user is logged-in so it changes button options//
			authorized = true
		}

		if(req.query.upload){
			DM.getUploadedDocuments( function(e, documents){
				res.render('search', { title : 'Document List', docs : documents });
			});
		}
		else{
			DM.getAllDocuments( function(e, all_documents){
				res.render('search', { title : 'Search For Documents', 
					docs : all_documents,logged_in:authorized});
			});
		}
	});

	app.post('/search', function(req, res) {
		var authorized = false
		if (req.session.user != null){
	// if user is logged-in so it changes button options//
			authorized = true
		}

		var search_form = new Object();
		if(req.body['form_type']){
			search_form.form_type = req.body['form_type'];
		}
		if(req.body['project_number']){
			search_form.project_number = req.body['project_number'];
		}
		if(req.body['begin_date']){
			search_form.begin_date  = req.body['begin_date'];
		}
		if(req.body['end_date']){
			search_form.end_date  = req.body['end_date'];
		}
		if(req.body['city']){
			search_form.city = req.body['city'].toUpperCase();
		}
		if(req.body['county']){
			search_form.county = req.body['county'].toUpperCase();
		}
		console.log(search_form)
		DM.getSpecificDocuments(search_form, function(e, documents){
			res.render('search', { title : 'Document List', docs : documents, logged_in:authorized});
		})
	});

//edit//
	app.get('/edit', function(req, res) {
		var authorized = false;
		if (req.session.user != null){
		// if user is logged-in so it changes button options//
			authorized = true;
		}
		
		if(req.query.id){
			var file = '../pdfs/';
			file += req.query.id;
			file +='#zoom=75';
			DM.getDocumentByID(req.query.id, function(e, doc){
				if(doc.length){
					delete doc[0]['_id'];
					delete doc[0]['md5'];
				}
				if(authorized){
					res.render('edit', {  title: 'Edit Documents', file : file ,doc:doc[0]});
				}else{
					res.redirect('/view' +'?id='+req.query.id);
				}
			})
			
		}
		else{
			res.render('404', { title: 'Page Not Found'});
		}
		
	});

	app.post('/edit', function(req, res) {
		var authorized = false
		if (req.session.user != null){
		// if user is logged-in so it changes button options//
			authorized = true
		}
		if(req.query.id){
			var form = req.body;
			form.pdf = req.query.id;
			
			if(req.body.type){
				if(Array.isArray(req.body.type)){
					for (var i = 0; i < req.body.type.length; i++) {
						form[req.body.type[i]] = req.body.value[i];
					}
				}
				else{
					form[req.body.type] = req.body.value;
				}
			}

			delete form.type;
			delete form.value;
			DM.updateDocumentByID(form, function(e, object){
				var file = '../pdfs/';
				file += req.query.id;
				file +='#zoom=75';
				DM.getDocumentByID(req.query.id, function(e, doc){
					if(doc.length){
						delete doc[0]['_id'];
						delete doc[0]['md5'];
					}
					if(authorized){
						res.render('edit', {  title: 'Edit Documents', file : file ,doc:doc[0]});
					}else{
						res.redirect('/view' +'?id='+req.query.id);	
					}
				});
			});
			
		}
		else{
			res.render('404', { title: 'Page Not Found'});
		}
	});

	app.get('/view', function(req, res) {
		var authorized = false
		if (req.session.user != null){
	// if user is logged-in so it changes button options//
			authorized = true
		}

		if(req.query.id){
			var file = '../pdfs/';
			file += req.query.id;
			file +='#zoom=75';
			DM.getDocumentByID(req.query.id, function(e, doc){
				if(doc.length){
					delete doc[0]['_id'];
					delete doc[0]['md5'];
				}
				res.render('view', {  title: 'View Document', file : file ,doc:doc[0],logged_in:authorized});
			})
			
		}
		else{
			res.render('404', { title: 'Page Not Found'});
		}
	});


//contact//
	app.get('/contact', function(req, res) {
		res.render('contact', {  title: 'Contact Us' });
	});

//my documents//
	app.get('/mydocs', function(req, res) {
		res.render('mydocs', {  title: 'My Documents' });
	});

//my documents//
	app.get('/about', function(req, res) {
		var authorized = false
		if (req.session.user != null){
		// if user is logged-in so it changes button options//
			authorized = true
		}
		res.render('about', {  title: 'About', logged_in:authorized});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/get_accounts', function(req, res) {
		if (req.session.user.user != 'admin'){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			AM.getAllRecords( function(e, accounts){
				res.render('get_accounts', { title : 'Account List', accts : accounts });
			})
		}


	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
