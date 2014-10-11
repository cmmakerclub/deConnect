var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var socketClient = require('socket.io-client')('http://localhost:3000');

app.get('/', function(req, res){
  res.sendFile('index.html', { root: path.join(__dirname, '/') });
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    socketClient.emit('chat message', msg);
  });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});

socketClient.on('connect', function(){
  socketClient.on('chat message', function(data){
    io.emit('chat message', data);
  });
  socketClient.on('disconnect', function(){

  });
});