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
  res.render('home.ejs')
})

app.get('/live', (req, res) => {
    if(req.session.username != '') {
      res.render('index.ejs')
    } else {
      res.redirect('live/room')
    }
});

app.post('/live', (req, res) => {
    req.session.username = req.body.username
    res.redirect('live/room')
});

app.get('/live/room', (req, res) => {
    res.render('room.ejs', {username: req.session.username})
});

app.get('/chat' , (req, res) => {
  res.render('chat')
})

app.get('/user', (req, res) => {
  res.render('index.ejs')
})

app.post('/user', (req, res) => {
  req.session.username = req.body.username
  res.redirect('onetoone')
});

app.get('/onetoone', (req, res) => {
  res.render('onetoone', {username: req.session.username})
})

io.on('connection', (socket) => {
  console.log('a user connected');
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.handshake.auth.username,
    });
  }
  io.emit("users", users);

  socket.on('disconnect', () => {
      console.log('user discounted')
      const users = [];
      for (let [id, socket] of io.of("/").sockets) {
        users.push({
          userID: id,
          username: socket.handshake.auth.username,
        });
      }
      socket.broadcast.emit("users", users);
  })

  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
  });

  socket.on('chat_message', msg => {
      console.log(msg)
    io.emit('chat_message', msg)
  })

  socket.on("private_message", ({ content, to }) => {
    socket.to(to).emit("private_message", {
      content,
      from: socket.id,
    });
  });

});

server.listen(4000, () => {
  console.log('listening on *:4000');
});