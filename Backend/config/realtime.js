import { Server } from 'socket.io';

let ioInstance = null;

export const initRealtime = (server, corsOptions) => {
  ioInstance = new Server(server, {
    cors: {
      origin: corsOptions.origin || '*',
      methods: corsOptions.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected (${socket.id}): ${reason}`);
    });

    socket.on('ping', () => {
      socket.emit('pong', { time: Date.now() });
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

export const emitRealtime = (event, payload = {}) => {
  if (!ioInstance) return;
  const data = {
    ...payload,
    _timestamp: Date.now()
  };
  ioInstance.emit(event, data);
};
