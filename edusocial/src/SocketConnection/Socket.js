import { io } from 'socket.io-client';

const socket = io("https://studyverse-megv.onrender.com" ,{
    withCredentials: true,
    transports: ['websocket' ],
    reconnection: true,
})

export default socket;