var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var _ = require('underscore');
var Schema = require('./schema');
var Promise  = require('bluebird');
var bcrypt   = Promise.promisifyAll(require('bcrypt'));
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var flash = require('connect-flash');
var util = require('util');
var knex = require('knex')({
    client: 'mysql',
    connection: {
        host     : '127.0.0.1',
        user     : 'root',
        password : '1234',
        database : 'deConnect',
        charset  : 'utf8'
  }
});

var hbs = require('hbs');
// var helpers = require('handlebars-helpers');;


// Register sync helper
hbs.registerHelper('list', function(items, options) {
  var out = "<ul>";

  for(var i=0, l=items.length; i<l; i++) {
    out = out + "<li>" + options.fn(items[i]) + "</li>";
  }

  return out + "</ul>";
});

hbs.registerHelper('table-list', function(items, options) {
  var out = "";

  for(var i=0, l=items.length; i<l; i++) {
    out = out + "<tr class='danger'>" + options.fn(items[i]) + "</tr>";
  }

  return out + "";
});

hbs.registerHelper('link', function(text, options) {
  var attrs = [];
  for (var prop in options.hash) {
    attrs.push(prop + '="' + options.hash[prop] + '"');
  }
  return new hbs.SafeString(
    "<a " + attrs.join(" ") + ">" + text + "</a>"
  );
});



// app.engine('handlebars', hbs.engine);
app.set('view engine', 'hbs');
// app.set('view engine', 'handlebars');

app.set('views', __dirname + '/views');

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session')

var sessionStore = new session.MemoryStore();
var passportSocketIo = require("passport.socketio");

session = session(
  { 
    key : 'express.sid',
    secret: 'session_secret', 
    store: sessionStore ,
    resave : true ,
    saveUninitialized : true,
  })


app.use(session);
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  function(username, password, done) {

    new User({'name': username})
      .fetch()
      .then(function(user) {

        var salt = bcrypt.genSaltSync(10);
        bcrypt.compare(user.get('password'), salt, function(err, res) {

          if (!err) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Incorrect username.' });
          }
        });
      });
  }
));

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    console.log('serializeUser');
    console.log(user.id);
    // done(null, user.id);
    return done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {

    console.log('deserializeUser');
    new User({'id': id})
      .fetch()
      .then(function(user) {
        if (!user) {
          done("err", user);
        }
        return done(false, user);
      })
});

io.set('authorization', function (handshake, accept) {
    // console.log('Auth: ', handshake);

    accept(null, true);
});

// With Socket.io >= 1.0
io.use(passportSocketIo.authorize({
  passport: passport,
  cookieParser: cookieParser,
  key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
  secret:      'session_secret',    // the session_secret to parse the cookie
  store:       sessionStore,        // we NEED to use a sessionstore. no memorystore please
  success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
  fail:        onAuthorizeFail,     // *optional* callback on fail/error - read more below
}));

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on 
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/');
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

var clients = [];

function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
  console.log('data query ' + data.query);


  // The accept-callback still allows us to decide whether to
  // accept the connection or not.
  // accept(null, true);

  // OR

  // If you use socket.io@1.X the callback looks different
  return accept();
}

function onAuthorizeFail(data, message, error, accept){
  // error indicates whether the fail is due to an error or just a unauthorized client
  return accept();

  // console.log(util.inspect(data, false, null));

  // console.log('data qurty :' + data._query.foo);
  // console.log('message qurty :' + message);
  // console.log('data :' + data);
  // console.log('err :' + error);
  if(error)  throw new Error(message);
  // send the (not-fatal) error-message to the client and deny the connection
  return accept(new Error(message));

  // We use this callback to log all of our failed connections.
  // accept(null, false);

  // OR

  // If you use socket.io@1.X the callback looks different
  // If you don't want to accept the connection
  // error indicates whether the fail is due to an error or just a unauthorized client
  // send the (not-fatal) error-message to the client and deny the connection
  // return accept(new Error(message));

  // this error will be sent to the user as a special error-package
  // see: http://socket.io/docs/client-api/#socket > error-object
}

var bookshelf = require('bookshelf')(knex);
app.set('bookshelf', bookshelf);
var Bookshelf = app.get('bookshelf');

var Users = bookshelf.Model.extend({
  tableName: 'users'
});

app.get('/', ensureAuthenticated, function(req, res){
  // req.session.save(function(err) {
  //   console.log('err :' + err);
  // })
  new Pi()
      .where({user_id: req.user.id})
      .fetchAll()
      .then(function(pi) {
          // console.log(pi.models);
          res.render('profile', {
            pi: pi.models
          });
        })
  // res.sendFile('Views/index.html', { root: path.join(__dirname, '/') });
});

app.get('/login', function(req, res){
  res.sendFile('Views/login.html', { root: path.join(__dirname, '/') });
  // res.sendFile('Views/main.html', { root: path.join(__dirname, '/') });
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/register', function(req, res){
  res.sendFile('Views/register.html', { root: path.join(__dirname, '/') });
});

app.post('/register', function(req, res) {

  new User({email: 'user@mail.com'})
    .fetchAll()
    .then(function(users) {
      console.log(users);
      if (users.length > 0) {
        res.sendFile('Views/index.html', { root: path.join(__dirname, '/') });
        res.redirect(301, '/');
      } else {
        var user = new Users();
        var salt = bcrypt.genSaltSync(10);
        var passwordHash = bcrypt.hashSync("admin", salt);

        new User({name: "admin", email: "admin@admin.com", password: passwordHash}).save().then(function(model) {
          res.sendFile('Views/login.html', { root: path.join(__dirname, '/') });
        });
      }
  });

});

app.get('/controller', ensureAuthenticated, function(req, res) {
  res.sendFile('Views/raspberrypi.html', { root: path.join(__dirname, '/') });
});

app.get('/profile', ensureAuthenticated, function(req, res) {
  // console.log(req.user.id);
  new Pi()
    .where({user_id: req.user.id})
    .fetchAll()
    .then(function(pi) {
        // console.log(pi.models);
        res.render('profile', {
          pi: pi.models
        });
      })
  // res.sendFile('Views/index.html', { root: path.join(__dirname, '/') });
});

app.post('/raspberry', isLoggedIn, function(req, res) {
  var serialNumber = req.user.id;

  new Pi({serial_number: serialNumber})
    .fetchAll()
    .then(function(pi) {
      if (pi.length > 0) {
        new Pi({user_id: req.user.id, serial_number: serialNumber}).save().then(function(model) {
          res.redirect(301, '/');        
        })
      } 
      else {
        res.sendFile('Views/index.html', { root: path.join(__dirname, '/') });
      }
    });
})

io.on('connection', function(socket) {

  // console.log(socket.handshake.query);
  clients.push(socket);
  console.log('clients.length ' + clients.length);
  // console.log(socket.request.user);

  clientsId = _.pluck(clients, 'id');
  io.emit('all connection', clientsId);

  if (socket["handshake"] && socket["handshake"]["query"] && socket["handshake"]["query"]["serial_number"]) {
    console.log(socket["handshake"] && socket["handshake"]["query"] && socket["handshake"]["query"]["serial_number"]);
    // var userPiSerialNumber = _.pluck(_.pluck(_.pluck(socket, "handshake"), "query"), "serial_number");
    socket.broadcast.emit("pi status online", socket["handshake"]["query"]["serial_number"]);
  }

  var user_id = socket.request.user.id || 0;

  new Pi()
    .where({user_id: user_id})
    .fetchAll()
    .then(function(model) {
        // console.log('model ' + model);
        // console.log('model ' + model.length);
        piList = JSON.stringify(model);
        // console.log('model ' + (model !== null));
        // console.log(user_id);
        // console.log('model ' + piList);
        // console.log('model ' + piList.length);

      if (model !== null && model.length > 0) {
        // console.log('piList ' + piList);

        var serial_number_list = _.pluck(piList, "serial_number"); 
          // console.log(serial_number_list);
        var piClient = _.filter(clients, function (client) {

          var query = client["handshake"]["query"];
          // console.log(query.serial_number);
          // console.log(_.indexOf(serial_number_list, query.serial_number));
          if (query.from == "raspberry" && _.indexOf(serial_number_list, query.serial_number)) {
            return true;
          } else {
            return false;
          }
        })

        if (piClient.length > 0) {
          var userPiSerialNumber = _.pluck(_.pluck(_.pluck(piClient, "handshake"), "query"), "serial_number");
          socket.emit("pi status online", userPiSerialNumber);
        }
        // console.log('piClient length: ' + piClient.length);
        // console.log('piClient.length ' + piClient.length);
      }
  });

  io.emit('online user', clients.length);

  socket.on('action', function(data) {
    // console.log(data);

    new Pi()
    .where({user_id: user_id, serial_number: data.serial_number})
    .fetch()
    .then(function(model) {

      var pi = model.attributes;

      if (model !== null) {

        var piClient = _.filter(clients, function (client) {

          var query = client["handshake"]["query"];
          // console.log(query);
          // console.log(pi);
          // console.log(query.serial_number == pi.serial_number);
          // console.log(query.from == "raspberry");
          // console.log(_.indexOf(serial_number_list, query.serial_number));
          if (query.from == "raspberry" && query.serial_number == pi.serial_number) {
            return true;
          } else {
            return false;
          }
        })
        // console.log(pi);
        if (piClient.length) {
          // console.log(piClient);
          piClient[0].emit('pi action', data);

        }
      }
    });

  });

  socket.on('pi action acting', function(data) {

    var serial_number = socket.handshake.query.serial_number;
    new Pi()
    .where({serial_number: serial_number})
    .fetch()
    .then(function(model) {

      if (model !== null) {
        var pi = model.attributes;

        passportSocketIo.filterSocketsByUser(io, function(user){
          return user.id === pi.user_id;
        }).forEach(function(socket){

          socket.emit('pi action acting', serial_number);
          // console.log(socket);

        });
      }
    });
  
  })

  socket.on('pi action stop', function(data) {

    var serial_number = socket.handshake.query.serial_number;
    new Pi()
    .where({serial_number: serial_number})
    .fetch()
    .then(function(model) {

      if (model !== null) {
        var pi = model.attributes;

        passportSocketIo.filterSocketsByUser(io, function(user){
          return user.id === pi.user_id;
        }).forEach(function(socket){

          socket.emit('pi action stop', serial_number);
          // console.log(socket);

        });
      }
    });
  
  })

  socket.on('disconnect', function(){

    // console.log(socket);
    if (socket["handshake"] && socket["handshake"]["query"] && socket["handshake"]["query"]["serial_number"]) {
      console.log(socket["handshake"] && socket["handshake"]["query"] && socket["handshake"]["query"]["serial_number"]);
      // var userPiSerialNumber = _.pluck(_.pluck(_.pluck(socket, "handshake"), "query"), "serial_number");
      socket.broadcast.emit("pi status offline", socket["handshake"]["query"]["serial_number"]);
    }


    var index = clients.indexOf(socket);
    if (index != -1) {
        clients.splice(index, 1);
        console.info('Client gone (id=' + socket.id + ').');
    }

    clientsId = _.pluck(clients, 'id');
    io.emit('all connection', clientsId);
    console.log('disconnect clients.length :' + clients.length);

  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});


// test emit socket
// var sequence = 1;

// setInterval(function() {
//     var randomClient;
//     var piClient;

//     piClient = _.filter(clients, function (client) {

//       var query = client["handshake"]["query"];

//       if (query.from == "raspberry") {
//         return true;
//       } else {
//         return false;
//       }
//     })

//     if (piClient.length > 0) {
//         randomClient = Math.floor(Math.random() * piClient.length);
//         piClient[randomClient].emit('foo', sequence++);
//     }
// }, 1000);

http.listen(3000, function(){
  console.log('listening on *:3000');
});

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

// User model
var User = Bookshelf.Model.extend({
    tableName: 'users'
});

var Pi = Bookshelf.Model.extend({
    tableName: 'pi',
    user: function () {
      return this.hasMay(User, "user_id");
    }
});

// Post model
var Post = Bookshelf.Model.extend({
    tableName: 'posts',
    hasTimestamps: true,
    category: function () {
      return this.belongsTo(Category, 'category_id');
    },
    tags: function () {
        return this.hasMany(Tag);
    },
    author: function () {
        return this.belongsTo(User);
    }
});
// Category model
var Category = Bookshelf.Model.extend({
    tableName: 'categories',
    posts: function () {
       return this.belongsToMany(Post, 'category_id');
    }
});
// Tag model
var Tag = Bookshelf.Model.extend({
    tableName: 'tags',
    posts: function () {
       return this.belongsToMany(Post);
    }
});