const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const router = express.Router();

const indexRouter = require('./routes/index');

const app = express();

var server = app.listen(3001);
var io = require('socket.io').listen(server);

function random() {
  return (new Date().getUTCMilliseconds().toString() + new Date().getTime().toString()).toString();
}

let userIndex = 0, 
    room_id = random(), 
    user_id = random();

app.post('/register', function( req, res ) {

  res.json({ connection_id: room_id, user_id: user_id });

  if ( userIndex === 0 ) {
    room_id = random();
    userIndex++;
  } else {
    userIndex = 0;
  }

  user_id = random();
});


io.on('connection', function(socket){
  console.log( 'user connected with id ' + room_id );
  
  socket.on(room_id + ':status', function() {
    if ( userIndex > 0 ) {
      io.sockets.emit(room_id + ':new_message', 'ready');
    }
  })

  socket.on(room_id + ':new_message', function( data ) {
    console.log( data );
    let callback_message = JSON.stringify({ message: data.message, user_id: data.user_id, message_id: random() });

    io.sockets.emit( data.connection_id + ':new_message', callback_message );
  })
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function(req, res, next) {
  res.render('index');
  //next(createError(404));
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

module.exports = app;
