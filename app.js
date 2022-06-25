const express = require('express');
const siofu = require("socketio-file-upload");
const app = express().use(siofu.router);
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: "*"
});
const { Op } = require("sequelize");


var session = require('express-session');
const req = require('express/lib/request');
const res = require('express/lib/response');
process.env.TZ = 'Asia/Kolkata';

app.use('/assets', express.static(__dirname + '/assets'));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'mkchatapp', resave: false,
saveUninitialized: false,
cookie: { secure: false }}))
app.set('view engine', 'ejs')

app.set('views', 'templates')

const {userModel, chatModel, chatMessageModel} = require('./model');

require('./php_tracking')(io)

app.use((req, res , next)=>{
  if(req.session.session_logged_in) {
    if(req.url == '/login' || req.url == '/login/' || req.url == '/register' || req.url == '/register/'){
      res.redirect('/')
    } else {
      next()
    }
  } else {
    if(req.url == '/login' || req.url == '/login/' || req.url == '/register' || req.url == '/register/') {
      next()
    } else {
      res.redirect('/login')
    }
  }
})

app.get('/tracking', (req, res) => {
  res.render('home.ejs', {user: req.session.user})
})


app.get('/logout', (req, res) =>{
    req.session.session_logged_in = false
    res.redirect('/')
})


app.get('/login', async (req, res) => {
  if(req.session.error_msg) {
    error_msg = req.session.error_msg
  } else {
    error_msg = {status: false}
  }
  res.render('login.ejs', {error_msg})
})

app.post('/login', async (req, res) => {
  // console.log(req.body)
  if(req.body.email == '') {
    req.session.error_msg = {"status": true, "msg": "email not empty", data: req.body}
    res.redirect('/login')
  } else if(req.body.password == '') {
    req.session.error_msg = {"status": true, "msg": "password not empty", data: req.body}
    res.redirect('/login')
  } else {
    const checkUser = await userModel.findOne({where: {email: req.body.email, password: req.body.password}, raw: true})
    if(checkUser) {
      req.session.session_logged_in = true
      req.session.user = checkUser
      res.redirect('/')
    } else {
      req.session.error_msg = {"status": true, "msg": "invalid user", data: req.body}
      res.redirect('/login')
    }
  }
})


app.get('/register', async (req, res) => {
  if(req.session.error_msg) {
    error_msg = req.session.error_msg
  } else {
    error_msg = {status: false}
  }
  res.render('register.ejs', {error_msg})
})

app.post('/register', async (req, res) => {
  if(req.body.name == '') {
    req.session.error_msg = {"status": true, "msg": "name not empty", data: req.body}
    res.redirect('/register')
  } else if(req.body.email == '') {
    req.session.error_msg = {"status": true, "msg": "email not empty", data: req.body}
    res.redirect('/register')
  } else if(req.body.password == '') {
    req.session.error_msg = {"status": true, "msg": "password not empty", data: req.body}
    res.redirect('/register')
  } else {
    const checkEmail = await userModel.findOne({where: {email: req.body.email}})
    if(checkEmail){
      req.session.error_msg = {"status": true, "msg": "email already exists", data: req.body}
      res.redirect('/register')
    } else {
      const createUser = await userModel.create(req.body)
      if(createUser) {
        req.session.session_logged_in = true
        req.session.user = createUser
        res.redirect('/')
      } else {
        req.session.error_msg = {"status": true, "msg": "something went wrong", data: req.body}
        res.redirect('/register')
      }
    }
  }
})


app.get('/', async (req, res) => {
  // console.log(req.session.user.id)
  const userlist = await userModel.findAll({ where:{id: {[Op.ne] : [req.session.user.id]}},raw: true})
  // console.log(userlist)
  res.render('private.ejs', {user: req.session.user,username: req.session.user.name, userlist: userlist, defaultUser: userlist[0]})
})

app.get('/chat/getdata/:from_id/:to_id', async (req, res) => {
  // console.log(req.params)
  const getChatUniqueid = await chatModel.findOne({
    where: req.params
  })
  // console.log(getChatUniqueid)
  const getdata = await chatMessageModel.findAll({
    where: {uniqueid: getChatUniqueid.uniqueid},
    order: [['id', 'DESC']],
    limit: 10,
    offset: 0
  })
  res.send(getdata.reverse())
})

io.of('/').on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('welcome', 'Welcome to Main Route User')
  var uploader = new siofu();
  uploader.dir = "mk";
  uploader.listen(socket);
  let uploadStatus = false

  socket.on('cancelupload', data => {
    uploadStatus = true
  })

  uploader.on('progress', function (event) {
    if(uploadStatus) {
      uploader.abort(event.file.id, socket);
      uploadStatus = false
    }
  })
  socket.join(socket.handshake.auth.userid)
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      sid: id,
      userID: socket.handshake.auth.userid,
      username: socket.handshake.auth.username,
    });
  }
  io.emit("users", users);

  socket.on('private_message_typing', data => {
    socket.to(data.toid).emit('private_message_typing', data)
  })

  socket.on('private_endtoend_id', async data => {
    const checkUsersAlreadyexist = await chatModel.findOne({
      where:{
        [Op.or]: [
          {[Op.and] : [
            {from_id: data.from_id},
            {to_id: data.to_id}
          ]},
          {[Op.and] : [
            {to_id: data.from_id},
            {from_id: data.to_id}
          ]}
          ]
        }
    })
    // console.log(checkUsersAlreadyexist)
    if(!checkUsersAlreadyexist) {
      const uniqueid = Date.now()
      const createBulkObject = [{from_id:data.from_id, to_id:data.to_id, uniqueid},{to_id:data.from_id, from_id:data.to_id, uniqueid}]
      const createData = await chatModel.bulkCreate(createBulkObject)
      // console.log(createData)
      socket.emit('chat_unique_id', uniqueid)
    } else {
      socket.emit('chat_unique_id', checkUsersAlreadyexist.uniqueid)
    }
  })

  socket.on("check_connection_active", data => {
    let status = 'inactive'
    for (let [id, socket] of io.of("/").sockets) {
      if(socket.handshake.auth.userid == data){
        status = 'active'
        break;
      }
    }
    socket.emit("check_connection_active", {status, data})
  })

  socket.on('private_message_not_typing', data => {
    socket.to(data.toid).emit('private_message_not_typing', data)
  })

  socket.on('disconnect', () => {
    console.log('user discounted')
    socket.broadcast.emit('changeinactivestatus', {sidebarstatus:`${socket.handshake.auth.userid}useractiveorinactivestatus`, id: socket.handshake.auth.userid})
  })

  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
  });

  socket.on('chat_message', msg => {
    io.emit('chat_message', msg)
  })

  socket.on("private_message", ({ content,from,to,username,sentdate, chat_unique_id }) => {
    // console.log(to)
    chatMessageModel.create({uniqueid: chat_unique_id, data: JSON.stringify({ content,from,to,username,sentdate, chat_unique_id })})
    socket.to(to).emit("private_message", {
      content,
      from,
      to,
      sentdate,
      username
    });
  });

});

server.listen(4000, () => {
  console.log('listening on *:4000');
});
