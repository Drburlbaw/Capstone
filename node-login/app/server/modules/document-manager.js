var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

/*
	ESTABLISH DATABASE CONNECTION
*/

var dbName = process.env.DB_NAME || 'node-login';
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function(e, d){
	if (e) {
		console.log(e);
	} else {
		if (process.env.NODE_ENV == 'live') {
			db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
				if (e) {
					console.log('mongo :: error: not authenticated', e);
				}
				else {
					console.log('mongo :: authenticated and connected to database :: "'+dbName+'"');
				}
			});
		}	else{
			console.log('mongo :: connected to database :: "'+dbName+'"');
		}
	}
});

var documents = db.collection('documents')

exports.getAllDocuments = function(callback)
{
	documents.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.getSpecificDocuments = function(obj,callback)
{	

	
    delete obj.begin_date;
    delete obj.end_date;
    console.log(obj)
	documents.find(obj).toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.getUploadedDocuments = function(callback)
{	
	var now = new Date();
	documents.find({ $and: [
			{
				"time_uploaded": { // 2 minutes ago (from now)
	        		$gte: moment(now).subtract(2,'minutes').format()
	        	}

			},
			{
				"city":""
			},
			{
				"form_type":""
			},
			{
				"county":""
			},
			{
				"project_number":""
			},
			{
				"date":""
			}
			
		]
	    
	}).toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.getDocumentByID = function(id,callback)
{	
	documents.find({pdf:id}).limit(1).toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.addDocument = function(file,checksum,callback)
{	
	var today = new Date();

	documents.find({md5:checksum}).limit(1).toArray(
		function(e, o){
			if (o.length){
				callback(true,'PDF: ' + file.originalname + ' is already in the database')
			}
			else{
				documents.insertOne({
					last_modified: moment(today).format(),
					time_uploaded: moment(today).format(),
					pdf:file.filename,
					form_type: '',
					md5: checksum,
					date: '',
					project_number: '',
					city: '',
					county: ''
				})
				callback(false, '')
			}
		})

	
}

exports.updateDocumentByID = function(newData,callback)
{
	var today = new Date();

	documents.find({pdf:newData.pdf}).limit(1).toArray(
		function(e, o){
		var newObject = newData;
		newObject.date = moment(newObject.date).format()
		newObject.last_modified = today.toISOString();
		for (var i in newObject ) {
			var newI = i.replace(/\s/g, '_').toLowerCase();
			if(newI[newI.length-1] == "_"){
				newI = newI.substr(0,newI.length-1);
			}
			if(typeof(newObject[i]) == "string" && i!="pdf"){
				newObject[newI] = newObject[i].toUpperCase();
			}
			if(newI != i){
				delete newObject[i];
			}
		}
		newObject._id = o[0]._id;
		documents.replaceOne(o[0], newObject, function(e) {
			if (e) callback(e);
			else callback(null, newObject);
		});
	});
}