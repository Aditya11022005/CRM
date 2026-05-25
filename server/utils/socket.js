let ioInstance = null;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    ioInstance = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    ioInstance.on('connection', (socket) => {
      console.log('Client connected to socket:', socket.id);

      socket.on('join_business', (businessId) => {
        socket.join(businessId);
        console.log(`Socket ${socket.id} joined business room: ${businessId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from socket:', socket.id);
      });
    });

    return ioInstance;
  },
  getIO: () => {
    return ioInstance;
  },
};
