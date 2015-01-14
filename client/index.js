var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var socketClient = require('socket.io-client');
var request = require('request');
var Player = require('player');
var internalIp = require('internal-ip');

var moment = require('moment');
var fs = require('fs');
var path = require('path');

var serial_number = fs.readFileSync("/proc/cpuinfo").toString().split("Serial\t\t: ")[1].trim() || "dummy-not-pi";
// var domain = "http://localhost:9000/";
var domain = "https://derconnect.herokuapp.com";

socketClient = socketClient.connect(domain, { path: '/socket.io-client', query: "from=raspberry&serial_number=" + serial_number });

// var player = new Player('./sound/song/Romeo_and_Cinderella.mp3');
var player = new Player('./sound/song/grink.mp3');

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

socketClient.on('pi:action', function(data){
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

setInterval(function() {

  console.log('emit pi:receive', "localIp" + "," + internalIp());
  socketClient.emit('pi:receive', "localIp" + "," + internalIp())


}, 5000);

  ////////////////////////////
 /////// read data //////////
////////////////////////////
setInterval(function() {

  fs.readdir(__dirname + '/data', function(err, files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i].split(",");
      var sn = "";
      var createAt = "";
      var sensorName = "";
      var sensorData = "";

      for (var j = 0; j < file.length; j++) {
        var data = file[j].split("-");
        if (data[0] == "SN") {
          sn = data[1];
        } else if (data[0] == "AT") {
          createAt = data[1];
        } else if (data[0] == "SENSOR") {
          sensorName = data[1];
        }
      }
        filePath = path.join(__dirname, '/data/' + files[i]);
        sensorData = fs.readFileSync(filePath, {encoding: 'utf-8'});

        if (sensorName && sensorName != '' ) {//&& sn != '' && createAt != '') {

          console.log('send data name ' + sensorName + ':' + sensorData);
          fs.unlinkSync(filePath);

          socketClient.emit('pi:receive', sensorName + "," + sensorData);

        }

    }
  });

}, 5000);
