import { io } from 'socket.io-client';

const socket = io("http://localhost:4000", {
    withCredentials: true,
    transports: ['websocket' ],
    reconnection: true,
})

export default socket;