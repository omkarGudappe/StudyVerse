require('dotenv').config();
const express = require('express');
const app = express();
const Verify = require('./AuthVerify/Verify');
const cors = require('cors');
const connectDB = require('./Db/connectdb');
const Profile = require('./Users/Profile');
const Posts = require('./Users/UserPosts');
const OtherUser = require('./Users/OtherUser')
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

app.use(cors({
  origin: [
    'https://study-verse-rose.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: [
      'https://study-verse-rose.vercel.app',
      'http://localhost:5173'
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  allowEIO3: true,
});

require('./SocketConnection/Socket')(io);


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/api/Auth' , Verify);
app.use('/api/user', Profile);
app.use('/api/posts', Posts);
app.use('/api/OtherUser', OtherUser)

app.get('/api' , (req, res) => {
  try{
    return res.json({ok: true, exist:"message is exist"});
  }catch(err){
    return res.json({ok:false, exist: err.message});
  }
})

const port = process.env.PORT || 4000
connectDB();
server.listen(port, () => {
    console.log(`Server is Running on the http://localhost:${port}`);
})