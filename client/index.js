var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var socketClient = require('socket.io-client')('http://localhost:3000', { query: "from=raspberry&serial_number=AAA" });
var request = require('request');
var Player = require('player');

var player = new Player('./sound/song/Romeo_and_Cinderella.mp3');
// var player = new Player('./sound/song/grink.mp3');

player.on('playing',function(item){
  // console.log('im playing... src:' + item);
  
  socketClient.emit('pi action acting', 'action acting');

});

player.on('now playing',function(item){
  // console.log('im playing... src:' + item);
  
  socketClient.emit('pi action acting', 'action acting');

});

player.on('playend',function(item){
  // return a playend item
  // console.log('src:' + item + ' play done, switching to next one ...');

  socketClient.emit('pi action stop', 'action stop');

});

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
  player.stop();
  player.play(function(err, player){
    // console.log('playend!');
  });
  // io.emit('chat message', data);
});

socketClient.on('disconnect', function(){
  console.log('disconnect');
  // socketClient.emit('online user', -1);
});