// require('dotenv').config();
// const express = require('express');
// const app = express();
// const Verify = require('./AuthVerify/Verify');
// const cors = require('cors');
// const connectDB = require('./Db/connectdb');
// const Profile = require('./Users/Profile');
// const Posts = require('./Users/UserPosts');
// const Notes = require('./Users/Notes')
// const http = require('http');
// const { Server } = require('socket.io');
// const server = http.createServer(app);
// const AI = require('./SendAi/GenerateQuiz');

// app.use(cors({
//   origin: [
//     'https://study-verse-rose.vercel.app',
//     'http://localhost:5173'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true
// }));

// const io = new Server(server, {
//   cors: {
//     origin: [
//       'https://study-verse-rose.vercel.app',
//       'http://localhost:5173'
//     ],
//     methods: ["GET", "POST"],
//     credentials: true
//   },
//   pingTimeout: 60000,
//   pingInterval: 25000,
//   connectionStateRecovery: {
//     maxDisconnectionDuration: 2 * 60 * 1000,
//     skipMiddlewares: true,
//   },
//   allowEIO3: true,
// });

// require('./SocketConnection/Socket')(io);


// app.use(express.json());
// app.use(express.urlencoded({extended: true}));
// app.use('/api/Auth' , Verify);
// app.use('/api/user', Profile);
// app.use('/api/posts', Posts);
// app.use('/api/Notes', Notes)
// app.use('/api/user/AI', AI);
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// const port = process.env.PORT || 4000
// connectDB();
// server.listen(port, () => {
//     console.log(`Server is Running on the http://localhost:${port}`);
// })



require('dotenv').config();
const express = require('express');
const app = express();
const Verify = require('./AuthVerify/Verify');
const cors = require('cors');
const connectDB = require('./Db/connectdb');
const Profile = require('./Users/Profile');
const Posts = require('./Users/UserPosts');
const Notes = require('./Users/Notes')
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const AI = require('./SendAi/GenerateQuiz');
const { setIo } = require('./SocketConnection/socketInstance');
const Group = require('./Users/UserGroups');

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

setIo(io);

require('./SocketConnection/Socket')(io);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Remove this middleware since it might not work reliably
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

app.use('/api/Auth' , Verify);
app.use('/api/user', Profile);
app.use('/api/posts', Posts);
app.use('/api/Notes', Notes)
app.use('/api/user/AI', AI);
app.use('/api/group', Group);

const port = process.env.PORT || 4000
connectDB();
server.listen(port, () => {
    console.log(`Server is Running on the http://localhost:${port}`);
});