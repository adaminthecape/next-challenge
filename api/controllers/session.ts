import { UUID } from 'crypto';
import { IReq, IRes } from '../../sharedTypes';
import { SessionManager } from '../models/Session';
import { handleError } from '../utils';

export async function validateSession(req: IReq, res: IRes): Promise<IRes> {
	try {
		if (!req.currentUser) {
			throw new Error('Not valid');
		}

		const { userId } = req.currentUser;

		const sessions = new SessionManager(req, userId);

		const sessionId = await sessions.getExistingSession();

		if (!sessionId) {
			throw new Error('Not valid');
		}

		return res.sendStatus(200);
	} catch (e) {
		handleError({
			message: (e as Error).message,
			error: e,
		});

		return res.sendStatus(403);
	}
}

export async function getSession(req: IReq, res: IRes): Promise<IRes> {
	const { userId } = req.params as { userId: UUID };

	const sessions = new SessionManager(req, userId);

	const sessionId = await sessions.getExistingSession();

	res.status(200).json({ sessionId });
}

export async function createSession(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { userId } = req.params as { userId: UUID };
		const manager = new SessionManager(req, userId);

		const existing = await manager.getExistingSession();

		console.log({ existing });

		if (!existing) {
			await manager.createSession();
		}

		return res.status(200).json({ id: manager.sessionId });
	} catch (e) {
		handleError({
			message: 'Failed to create session',
			error: e,
		});

		return res.status(500);
	}
}
