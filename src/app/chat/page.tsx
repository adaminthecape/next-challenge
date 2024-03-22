'use client';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4001'); // Replace with your server URL

export default function Chat() {
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState('');

	const comms: any[] = [];
	let messageRenderKey = 0;

	useEffect(() => {
		// Listen for incoming messages
		socket.on('message', (message: any) => {
			comms.push(message);
			console.log('RECEIVED:', message, comms);
			setMessages((prevMessages) => [
				...prevMessages,
				message.newMessage,
			]);
		});
	}, []);

	const sendMessage = () => {
		socket.emit('message', { newMessage });
		setNewMessage('');
	};

	return (
		<div>
			<h1>Real-Time Chat</h1>
			<div>
				<pre key={messageRenderKey}>
					{JSON.stringify(comms, undefined, 2)}
				</pre>
				{messages.map((message, index) => (
					<div key={index}>{message}</div>
				))}
			</div>
			<input
				type='text'
				value={newMessage}
				onChange={(e) => setNewMessage(e.target.value)}
			/>
			<button onClick={sendMessage}>Send</button>
		</div>
	);
}
