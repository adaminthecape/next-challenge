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
	// Decode the JWT, get the user's id, and add it to the req
	const { authorization } = req.headers;

	if (!authorization) {
		console.log('before fail:');

		return res.sendStatus(403);
	}

	const userData = decodeJWT(authorization || '');

	if (!userData) {
		return res.sendStatus(403);
	}

	req.currentUser = { userId: userData.userId };
	await new SessionManager(req, req.currentUser.userId).validateUserSession();

	// Release the db connection, if any
	res.on('finish', async () => {
		if (req.db instanceof Database) {
			await req.db.release();
		}
	});

	console.log('Authenticated for route:', req.url);

	next();
}

app.use('/permission', permission);
app.use('/session', session);
app.use('/login', login);
app.use('/user', user);
app.use('/groups', groups);

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

app.listen(port, () => {
	console.log(`ppm-challenge-api listening on port ${port}`);
});
