var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var chatbotRouter = require('./routes/chatbot');
var buildCourseRouter = require('./routes/buildCourse');
var youtubeRouter = require('./routes/youtube');

var app = express();
const cors = require('cors');
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_DB;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

MongoClient.connect(uri)
    .then((client) => {
        console.log('Connected to MongoDB');
        db = client.db('MindSpark'); // Set the database
        app.locals.db = db; // Make db accessible globally in the app
    })
    .catch((err) => console.error('MongoDB connection error:', err));

app.use('/', (req, res, next) => {
  req.db = app.locals.db; // Attach db to req for use in routes
  next();
}, indexRouter);

app.use('/chatbot', chatbotRouter);

app.use('/users', (req, res, next) => {
  req.db = app.locals.db; // Attach db to req for use in routes
  next();
}, usersRouter);

app.use('/buildCourse', (req, res, next) => {
  req.db = app.locals.db; // Attach db to req for use in routes
  next();
}, buildCourseRouter);

app.use('/youtube', youtubeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await client.close();
  process.exit(0);
});

module.exports = app;
