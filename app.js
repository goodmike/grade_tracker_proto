
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
app.get('/tracker', routes.show(db));

port = process.env.C9_PORT || process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
