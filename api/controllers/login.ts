import { IReq, IRes } from '../../sharedTypes';
import { LoginManager, LoginStatus } from '../models/Login';
import { Password } from '../models/Password';
import { SessionManager } from '../models/Session';
import { config as configureEnv } from 'dotenv';
import { handleError } from '../utils';
import { PermissionType, validatePermission } from '../models/Permissions';
import { UUID } from 'crypto';
import jwt from 'jsonwebtoken';

export async function authenticateUser(req: IReq, res: IRes): Promise<IRes> {
	try {
		// given a username & password:
		const { username, password } = req.params as {
			username: string;
			password: string;
		};

		// basic validation
		if (!password || !username) {
			return res.sendStatus(500);
		}

		// get the existing hash from the db for this username
		const storedLogin = await LoginManager.getExistingLoginForUsername(
			req,
			username
		);

		// if no existing hash for that username, kick the user out
		if (storedLogin?.status !== LoginStatus.Active) {
			// Not returning specific information here - just unauthorized
			return res.sendStatus(403);
		}

		// check that the hashes match
		const matched = await Password.comparePassword(
			storedLogin.password,
			password
		);

		// if no match, kick the user out
		if (!matched) {
			// Not returning specific information here - just unauthorized
			return res.sendStatus(403);
		}

		// if matched, let the user in & send back a JWT
		configureEnv();

		const token = jwt.sign(
			{ userId: storedLogin.userId },
			process.env.JWT_SECRET as string,
			{
				expiresIn: '7d',
			}
		);

		// Create a new session for the user or refresh any existing session
		const sessions = new SessionManager(req, storedLogin.userId);

		await sessions.refreshSession();

		return res
			.status(200)
			.json({ token, id: storedLogin.userId, name: username });
	} catch (e) {
		handleError({
			message: 'Login failed',
			error: e,
		});

		return res.sendStatus(500);
	}
}

export async function registerUser(req: IReq, res: IRes): Promise<IRes> {
	// given a username & password:
	const { username, password } = req.params as {
		username: string;
		password: string;
	};

	// basic validation
	if (!password || !username) {
		return res.sendStatus(500);
	}

	// get the existing hash from the db for this username
	const newLogin = await LoginManager.createLogin(req, username, password);

	if (!newLogin) {
		handleError({
			message: `Failed to create login for ${username}`,
		});
	}

	return res.sendStatus(200);
}

export async function getActiveLogins(req: IReq, res: IRes): Promise<IRes> {
	if (!req.currentUser?.userId) {
		console.warn('No current user!');
		return res.sendStatus(403);
	}

	try {
		await validatePermission(
			req,
			req.currentUser?.userId,
			PermissionType.ACCOUNT_VERIFY
		);
	} catch (e) {
		console.error(e);
		return res.sendStatus(403);
	}

	console.log('controller:', req.query);

	try {
		const data = await LoginManager.getLogins(req, req.query);

		return res.status(200).json(data);
	} catch (e) {
		handleError({
			message: 'Failed to get active logins',
			error: e,
		});
		return res.sendStatus(500);
	}
}

export async function updateLoginState(req: IReq, res: IRes): Promise<IRes> {
	if (!req.currentUser?.userId) {
		console.warn('No current user!');
		return res.sendStatus(403);
	}

	try {
		await validatePermission(
			req,
			req.currentUser?.userId,
			PermissionType.ACCOUNT_VERIFY
		);
	} catch (e) {
		console.error(e);
		return res.sendStatus(403);
	}

	try {
		const { userId, newState } = req.query as any;

		console.log('update state:', { userId, newState });

		if (!userId || !LoginStatus[newState]) {
			return res.sendStatus(500);
		}

		const logins = new LoginManager(req, userId as UUID);

		const success = await logins.changeLoginStatus(
			userId,
			parseInt(newState, 10)
		);

		if (!success) {
			return res.sendStatus(500);
		}

		return res.status(200);
	} catch (e) {
		handleError({
			message: 'Failed to update login status',
			error: e,
		});
		return res.sendStatus(500);
	}
}
