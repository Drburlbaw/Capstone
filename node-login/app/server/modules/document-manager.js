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
	var now = new Date();
	if(obj.begin_date){
		if(obj.end_date){
			obj["date"] = { 
				$and:[
			        {$gte: moment(obj.begin_date ).format()},
			        {$lte: moment(obj.end_date ).format()}
			    ]
		    }
		    delete obj.begin_date;
		    delete obj.end_date;
		}
		else{
			obj["last_modified"] = {
		        $gte: moment(obj.begin_date ).format()
		    }
		    delete obj.begin_date;
		}
	}
	else{
		if(obj.end_date){
			obj["last_modified"] = {
		        $lte: moment(obj.end_date ).format()
		    }
		    delete obj.end_date;
		}
	}
	
	

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
	        		$gte: moment(now).subtract(1,'day').format()
	        	}

			},
			{
				"city":""
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

exports.addDocument = function(id,checksum,callback)
{	
	var today = new Date();

	if (documents.find({md5:checksum}).toArray().length){
		console.log('already exists')
		callback(false)
	}
	else{
		documents.insertOne({
			last_modified: moment(today).format(),
			time_uploaded: moment(today).format(),
			pdf:id,
			form_type: '',
			md5: checksum,
			date: '',
			project_number: '',
			city: '',
			county: ''
		})
		callback(true)
	}
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
		}
		newObject._id = o[0]._id;
		documents.replaceOne(o[0], newObject, function(e) {
			if (e) callback(e);
			else callback(null, newObject);
		});
	});
}