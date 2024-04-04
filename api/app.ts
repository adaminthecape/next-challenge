import express from 'express';
import cors from 'cors';
import permission from './routes/permission';
import session from './routes/session';
import login from './routes/login';
import user from './routes/user';
import { config as configureEnv } from 'dotenv';
import { IReq, IRes } from '../sharedTypes';
import jwt from 'jsonwebtoken';
import { SessionManager } from './models/Session';
import { UUID } from 'crypto';
import { Database } from './models/Database';
import groups from './routes/groups';
import { handleError } from './utils';
import communications from './routes/communications';

import { Server } from 'socket.io';
import http from 'http';
import {
	testCommunicateInAllowedScopes,
	testCreateGroups,
	testCreateUsers,
	testJoinGroups,
	testVerifyUsers,
} from './controllers/dev';

configureEnv();

const app = express();
const port = process.env.API_PORT;

export function decodeJWT(token: string):
	| undefined
	| {
			userId: UUID;
	  } {
	if (!token) return undefined;

	const [_, jwtString] = token.split('Bearer ');

	if (!jwtString) return undefined;

	const decoded: any = jwt.verify(
		jwtString,
		process.env.JWT_SECRET as string
	);

	return decoded;
}

export async function setUserInReq(
	req: IReq,
	res: IRes,
	next: any
): Promise<any> {
	try {
		console.log('setUserInReq: start');
		// Decode the JWT, get the user's id, and add it to the req
		const { authorization } = req.headers;

		if (!authorization) {
			// realtime chat - needs jwt for real data
			// if (req.url?.startsWith('/socket.io/')) {
			// 	return next();
			// }
			console.log(
				'before fail:',
				authorization,
				req.url,
				req.params,
				req.query,
				req.body
			);

			return res.sendStatus(403);
		}

		const userData = decodeJWT(authorization || '');

		if (!userData) {
			console.log(
				'before fail 2:',
				authorization,
				req.url,
				req.params,
				req.query,
				req.body,
				userData
			);

			return res.sendStatus(403);
		}

		req.currentUser = { userId: userData.userId };
		await new SessionManager(
			req,
			req.currentUser.userId
		).validateUserSession();

		// Release the db connection, if any
		res.on('finish', async () => {
			if (req.db instanceof Database) {
				await req.db.release();
			}
		});

		console.log('Authenticated for route:', req.url);

		next();
	} catch (e) {
		handleError({
			message: 'Could not pre-validate user',
			error: e,
		});

		return res.sendStatus(500);
	}
}

app.use('/permission', permission);
app.use('/session', session);
app.use('/login', login);
app.use('/user', user);
app.use('/groups', groups);
app.use('/communications', communications);

app.use(
	cors({
		origin: process.env.UI_ORIGIN_URL,
	})
);

app.use(setUserInReq);

app.get('/test/test', async (req: IReq, res: IRes) => {
	console.log('GET: /test/test', req.query);

	return res.sendStatus(200);
});

app.post('/test/test', async (req: IReq, res: IRes) => {
	console.log('POST: /test/test', req.query);

	return res.sendStatus(200);
});

app.post('/dev/createUsers', testCreateUsers);
app.post('/dev/verifyUsers', testVerifyUsers);
app.post('/dev/createComms', testCommunicateInAllowedScopes);
app.post('/dev/createGroups', testCreateGroups);
app.post('/dev/joinGroups', testJoinGroups);

// WEBSOCKETS - FOR CHAT
// const server = http.createServer((req: any, res: any) => {});
// const io = new Server(server, {
// 	transports: ['websocket', 'polling'],
// 	cors: {
// 		origin: process.env.UI_ORIGIN_URL,
// 		methods: ['GET', 'POST'],
// 		credentials: true,
// 	},
// });

// io.on('connection', (socket) => {
// 	console.log('A user connected');

// 	socket.on('message', (message) => {
// 		io.emit('message', message);
// 		console.log('MESSAGE:', message, socket.data);
// 	});

// 	socket.on('disconnect', () => {
// 		console.log('A user disconnected');
// 	});
// });
// const ioPort = 4001;
// server.listen(ioPort, () => {
// 	console.log('WebSocket server listening on port ' + ioPort);
// });

app.listen(port, () => {
	console.log(`ppm-challenge-api listening on port ${port}`);
});
