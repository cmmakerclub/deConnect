var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var socketClient = require('socket.io-client')('http://localhost:3000', { query: "from=raspberry&serial_number=AAA" });
var request = require('request');

// request.post('http://localhost:3000/login', {form: {username:'admin', password:'admin'}}, function (err, httpResponse, body) {
//   if (err) {
//     return console.error('upload failed:', err);
//   }
//   // socketClient = require('socket.io-client')('http://localhost:3000', { query: "foo=bar" });
// });

app.get('/', function(req, res){
  res.sendFile('index.html', { root: path.join(__dirname, '/') });
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    // io.emit('chat message', msg);
    socketClient.emit('chat message', msg);
  });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});

socketClient.on('connect', function(){
  console.log('connect');
});
  
socketClient.on('reconnect', function () {
  console.log('reconnect');
})
socketClient.on('reconnecting', function () {
  console.log('reconnecting');
})

socketClient.on('online user', function (data) {
  console.log(data);
});

socketClient.on('chat message', function(data){
  console.log(data);
  io.emit('chat message', data);
});

socketClient.on('foo', function(data){
  console.log(data);
  // io.emit('chat message', data);
});

socketClient.on('pi status', function(data){
  console.log(data);
  // io.emit('chat message', data);
});

socketClient.on('pi action', function(data){
  console.log(data);
  // io.emit('chat message', data);
});

socketClient.on('disconnect', function(){
  console.log('disconnect');
  // socketClient.emit('online user', -1);
});