
/**
 * Module dependencies.
 */

var cradle = require('cradle')
  , express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var dev = true;

var contentType = "text/html";

/* support various content-types from clients */
function acceptsXml(req) {
    var acc = req.headers["accept"];
  
    if (acc.match(/text\/html/)) {
        return "text/html";
    } else if (acc.match(/text\/xml/)) {
        return "text/xml";
    } else if (acc.match(/application\/xml/)) {
        return "application/xml";
    } else if (acc.match(/application\/xhtml\+xml/)) {
        return "application/xhtml+xml";
    }
    return contentType;
}


// for couch
var host = 'https://goodmike.cloudant.com'
  , port = 443
  , dbname   = dev ? 'grade_tracker_proto_dev'  : process.env.CDB_NAME || 'grade_tracker_proto_dev'
  , username = dev ? 'bypargatedectlesessightn' : process.env.CDB_USER || 'bypargatedectlesessightn'
  , password = dev ? 'lW7dwdGelNiKyQEE3007Fdsj' : process.env.CDB_PASSWD || 'lW7dwdGelNiKyQEE3007Fdsj'
  , viewPath = '_design/basic/_view/';

var credentials = {'username': username, 'password': password };
var db = new(cradle.Connection)(host, port, {auth: credentials}).database(dbname);


// Routes

// app.get('/', routes.index);
app.get('/', routes.index(db));
// app.get('/tracker', routes.show(db));

// helper fn for readying grades collection
var collect_grades = function(rows) {
    var weights = {};
    var grades = [];
    console.log("rows.length: " + rows.length);
    for (var i=0; i<rows.length; i++) {
        var date = rows[i].key[0];
        if (date === 0) {
            var assessment = rows[i].key[1];
            var weight = parseInt(rows[i].value.weight, 10);
            weights[assessment] = weight;
        } else {
            grades.push(rows[i].value);   
        }
    }
    for (var i=0; i<grades.length; i++) {
        var grade = grades[i];
        grade.weight = weights[grade.assessment];
        grade.score = parseInt(grade.score, 10);
        grade.weighted_score = grade.weight * grade.score;
    }
    return grades;
};

app.get('/tracker', function(req,res) {
    db.get('_design/basic/_view/grades_and_weights', function(err,doc) {
        var ctype = acceptsXml(req);
        res.header('content-type',ctype);
        res.render('show', {
            title: 'Grade Tracker',
            items: collect_grades(doc.rows)
        });
    });
});

// JSON for backbone integration phase 1
app.get('/grades', function(req, res) {
    db.get('_design/basic/_view/grades_and_weights', function(err,doc) {
       for ( var key in err) {
           console.log("err[" + key + "]: " + err[key]);
       }
        res.render('show_json', {
            layout : 'layout_json',
            title: 'Grade Tracker',
            items: collect_grades(doc.rows)
        });
    });    
});

port = process.env.C9_PORT || process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
