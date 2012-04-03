
/**
 * Module dependencies.
 */

var cradle = require('cradle')
  , express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();


// global data, helpers
var contentType = 'text/html';
var baseHtmlUrl = '/html/';
var baseUiUrl = '/binder/';

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
    console.log("request header's 'accept': " + acc);
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

var today = function() {
    var d = new Date();
    var curr_date = d.getDate();
    if (curr_date < 10) {
        curr_date = "0" + curr_date;
    }
    var curr_month = d.getMonth() + 1;
    if (curr_month < 10) {
        curr_month = "0" + curr_month;
    }
    var curr_year = d.getFullYear();
    var date_string = "" + curr_year + "-" + curr_month + "-" + curr_date;
    return function() { return date_string };
}();

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
    
    var ctype = acceptsXml(req);
    
    db.get('_design/basic/_view/grades_and_weights', function(err,doc) {
        res.header('content-type',ctype);
        res.render('show', {
            title: 'Grade Tracker',
            items: collect_grades(doc.rows)
        });
    });
});

var collect_tracker = function(rows) {
    var weights = {};
    var grades = [];
    var tracker;
    for (var i=0; i<rows.length; i++) {
        var key = rows[i].key[1];
        if (key === 'weight') {
            var weight = rows[i].value;
            weights[weight.assessment] = parseInt(weight.weight, 10);
        } else if (key === 'tracker') {
            tracker = rows[i].value;
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
    return {"grades": grades, "tracker": tracker};
};


/* GET trackers list page */
app.get(baseHtmlUrl + 'trackers', function(req,res) {

    var options, id;
    
    options = {};
    
    db.get('_design/basic/_view/trackers', options, function(err,doc) {
       for (var key in err) {
           console.log("err[" + key + "]: " + err[key]);
       }
       res.header('content-type',acceptsXml(req));
        res.render('trackers', {
            title: 'Grade Trackers',
            items: doc,
            site: baseHtmlUrl
        });
   });
});

/* GET tracker page */
app.get(baseHtmlUrl + 'trackers/:i', function(req,res) {
    
    var options, id;
    
    id = req.params.i;
    options = {
        startkey: '["' + id + '",0]',
        endkey: '["' + id + '",{}]'
    };
    
    db.get('_design/basic/_view/tracker_by_id', options, function(err,doc) {
       for (var key in err) {
           console.log("err[" + key + "]: " + err[key]);
       }
       var rows = collect_tracker(doc.rows);
       res.header('content-type',acceptsXml(req));
       res.render('tracker', {
          title: id,
          items: rows.grades,
          tracker: rows.tracker,
          create_url: baseHtmlUrl + "trackers/" + id + '/grades',
          site: baseHtmlUrl
       });
   });
});

/* POST new grade to tracker */
app.post(baseHtmlUrl + 'trackers/:i/grades', function(req,res) {

    console.log("request headers:");
    for (k in req.headers) {
        console.log(k + ": " + req.headers[k]);   
    }
    console.log("request body:");
    console.log("body length? " + req.body.length);
    for (k in req.body) {
        console.log(k + ": " + req.body[k]);   
    }
    var grade = {
        type: 'grade',
        score: req.body.score,
        date: req.body.date,
        topic: req.body.topic,
        assessment: req.body.assessment,
        notes: req.body.notes,
        tracker_id: req.params.i,
        dateCreated: today()
    };
       
    // write to DB
    db.save(grade, function(err, doc) {
        if(err) {
           res.status=400;
           res.send(err);
           return; // just for clarity
        } else {
            // render grade page with link to tracker.
            res.send('created', { 'Content-Type': 'text/plain' }, 201);
        }
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

/* support various content-types from clients */
function acceptsXml(req) {
  var ctype = contentType;
  var acc = req.headers["accept"];
  
  if (acc.search(/text\/html/) != -1) {
      ctype = "text/html";
  } else if (acc.search(/text\/xml/) != -1) {
      ctype = "text/xml";
  } else if (acc.search(/application\/xml/) != -1) {
      ctype = "application/xml";
  } else if (acc.search(/application\/xhtml\+xml/) != -1) {
      ctype = "application/xhtml+xml";
  }

  return ctype;
}




port = process.env.C9_PORT || process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
