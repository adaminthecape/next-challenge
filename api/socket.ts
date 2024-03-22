import { Server } from 'socket.io';
import http from 'http';

// server/server.js
const server = http.createServer((req: any, res: any) => {
	// Handle HTTP requests if needed
});

const io = new Server(server);

io.on('connection', (socket) => {
	console.log('A user connected');

	// Handle chat messages
	socket.on('message', (message) => {
		io.emit('message', message); // Broadcast the message to all connected clients
	});

	socket.on('disconnect', () => {
		console.log('A user disconnected');
	});
});

server.listen(3001, () => {
	console.log('WebSocket server listening on port 3001');
});
