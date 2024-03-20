import { UUID } from 'crypto';
import { IReq, IRes } from '../../sharedTypes';
import { SessionManager } from '../models/Session';

export async function validateSession(req: IReq, res: IRes): Promise<IRes> {
	if (!req.currentUser) {
		return res.sendStatus(403);
	}

	const { userId } = req.currentUser;

	const sessions = new SessionManager(req, userId);

	const sessionId = await sessions.getExistingSession();

	if (!sessionId) {
		return res.sendStatus(403);
	}

	return res.sendStatus(200);
}

export async function getSession(req: IReq, res: IRes): Promise<IRes> {
	const { userId } = req.params as { userId: UUID };

	const sessions = new SessionManager(req, userId);

	const sessionId = await sessions.getExistingSession();

	res.status(200).json({ sessionId });
}

export async function createSession(req: IReq, res: IRes): Promise<IRes> {
	const { userId } = req.params as { userId: UUID };
	const manager = new SessionManager(req, userId);

	const existing = await manager.getExistingSession();

	console.log({ existing });

	if (!existing) {
		await manager.createSession();
	}

	res.status(200).json({ id: manager.sessionId });
}
