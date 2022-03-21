const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var session = require('express-session')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'mkchatapp', resave: false,
saveUninitialized: false,
cookie: { secure: false }}))
app.set('view engine', 'ejs')

app.set('views', 'templates')

app.get('/', (req, res) => {
    res.render('index.ejs')
});

app.post('/', (req, res) => {
    req.session.username = req.body.username
    res.redirect('/room')
});

app.get('/room', (req, res) => {
    res.render('room.ejs', {username: req.session.username})
});

io.on('connection', (socket) => {
  console.log('a user connected');
  console.log(socket)
  io.emit('welcomemk', 'hi user welcome to our chat app')
  socket.on('disconnect', () => {
      console.log('user discounted')
  })
  socket.on('chat_message', msg => {
      console.log(msg)
    io.emit('chat_message', msg)
  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});