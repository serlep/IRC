var express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	exphbs = require('express-handlebars'),
	expressValidator = require('express-validator'),
	flash = require('connect-flash'),
	session = require('express-session'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	mongoose = require('mongoose'),
	app = express(),	
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	connections = [],
	usersList = [],
	global.session = {};

mongoose.Promise = global.Promise;
var db = mongoose.connect('mongodb://localhost/myapp', function(err){
	if(err)
		throw err;
	else
		console.log('mongodb connected!');
});

var routes = require('./routes/index');
var users = require('./routes/users');
if(session.admin == 1){
	var admin = require('./routes/admin');
}

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/public'));

app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
	res.locals.user = req.users;
	next();
});

app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
		var namespace = param.split('.'),
		root = namespace.shift(),
		formParam = root;

		while(namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param : formParam,
			msg   : msg,
			value : value
		};
	}
}));

app.use(flash());

app.use(function (req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

app.use('/', routes(io));
app.use('/users', users);
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
	console.log('Server started on port '+ app.get('port'));
});

server.listen('8080', function(){
	console.log('Server socket io is running');
});

var chatSchema = mongoose.Schema({
		nickname: {
			type: String
		},
		room:{
			type: String
		},
		date: {
			type: Date, default: Date.now
		}
	});

var Chat = mongoose.model('message', chatSchema);

io.sockets.on('connection', function(socket){
	console.log('a user connected');
	connections.push(socket);
	console.log('Connected: %s user connected', connections.length);

	socket.on('send message', function(data){
		var newMsg = new Chat({room: socket.room, nickname: socket.nickname});
		newMsg.save(function(err){
			if(err) throw(err);
			io.sockets.emit('new message',{room: socket.room, nickname: socket.nickname});	
		});
	});

	socket.on('new user', function(data, room) {
		if (usersList.indexOf(data) != -1) {
			throw(err);
		} else {
			socket.room = room;
			if(!socket.room)
			{
				var rooms = ['public'];
			}else{
				var rooms = [socket.room];
			}
			socket.nickname = data;
			usersList.push(socket.nickname);
			socket.room = rooms[0];
			socket.join(socket.room);
			socket.broadcast.to(socket.room).emit('update_chat', socket.nickname + ' had join ' + socket.room);
			socket.emit('update_chat', 'you had join '+ socket.room +' room');
			updataUsername();
		}
	});

    socket.on('disconnect', function(){
        delete usersList[socket.nickname];
        io.sockets.emit('updateusername', usersList.indexOf(socket.nickname), 1);
        console.log('Disconnected : %s user disconnected', connections.length);
        socket.broadcast.emit('update_chat', socket.nickname + ' has disconnected');
        socket.leave(socket.room);
        updataUsername();
    });

	function updataUsername(){
		io.sockets.emit('get users', usersList);
	}

});
