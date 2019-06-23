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

let userIndex = 0, room_id;

app.post('/register', function( req, res ) {
  if ( userIndex === 0 ) {
    room_id = (new Date().getUTCMilliseconds().toString() + new Date().getTime().toString()).toString();
    prev_id = room_id;
    userIndex++;
  } else {
    userIndex = 0;
  }

  res.json({ id: room_id });
});

// создаем соединение с комнатой
io.on('connection', function(socket){
  console.log( 'user connected with id ' + room_id );
  
  socket.on(room_id + ':status', function() {
    if ( userIndex > 0 ) {
      socket.broadcast.emit('chat_room:' + room_id, 'ready');
    }
  })

  socket.on(room_id + ':new_message', function( data ) {
    console.log( data );
    socket.emit(room_id + ':new_message', { msg: data.msg});
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
