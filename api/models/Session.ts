import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from '../models/Database';
import { handleError } from '../utils';

export type SessionId = `${string}-${string}-${string}-${string}`;

export const cMaxSessionLengthMillis = 60 * 60 * 24 * 1000; // 1 day

export interface Session {
	id?: number;
	sessionId: SessionId;
	userId: UUID;
	createdAt: Date;
	updatedAt?: Date | null;
	ipAddress?: string | null;
}

export class SessionManager {
	private generateSessionId(): SessionId {
		return crypto.randomUUID() as SessionId;
	}

	private req: IReq;
	private userId: UUID;
	public sessionId: SessionId | undefined;

	constructor(req: IReq, userId: UUID) {
		this.req = req;
		this.userId = userId;

		if (!this.userId) {
			throw new Error('Cannot initialise user session without a user!');
		}
	}

	public async createSession(): Promise<any> {
		const db = await Database.getInstance(this.req);
		const id = this.generateSessionId();

		try {
			await db.insert(
				'INSERT INTO sessions (sessionId, userId, createdAt, ipAddress) VALUES (?,?,?,?)',
				[id, this.userId, Date.now(), this.req.ipAddress]
			);

			this.sessionId = id;
		} catch (e) {
			handleError({
				message: `Failed to create session for user ${this.userId}`,
				error: e,
			});
		}
	}

	public async refreshSession(): Promise<void> {
		const currentSessionId = await this.getExistingSession();

		if (!currentSessionId) {
			// Create a new session for them
			await this.createSession();
		} else {
			const db = await Database.getInstance(this.req);
			await db.update(
				`UPDATE sessions
				SET updatedAt = ?
				WHERE sessionId = ?
				AND userId = ?
				LIMIT 1`,
				[Date.now(), currentSessionId, this.userId]
			);
		}
	}

	public async getExistingSession(): Promise<UUID | undefined> {
		const db = await Database.getInstance(this.req);

		try {
			const sessionId = (
				await db.query1r(
					`SELECT sessionId, createdAt, updatedAt
					FROM sessions
					WHERE (
						userId = ?
						AND (? - IFNULL(updatedAt, createdAt)) < ?
					) LIMIT 1`,
					[this.userId, Date.now(), cMaxSessionLengthMillis]
				)
			)?.sessionId;

			if (sessionId) {
				this.sessionId = sessionId;
			}

			return sessionId;
		} catch (e) {
			console.warn(
				`Failed to get existing session for user ${this.userId}`
			);

			return undefined;
		}
	}

	/**
	 * If the user has an active session, return true. Otherwise, throw an
	 * error. This is intended to kick the user out of whatever they're doing,
	 * if they're no longer using a valid session.
	 */
	public async validateUserSession(): Promise<boolean> {
		if (await this.getExistingSession()) {
			// console.log('Validated session for', this.userId);
			return true;
		}

		throw new Error(`User ${this.userId} failed validation`);
	}
}

/**
 * Sugar function for one-liner session validation, e.g.:
 * await validateSession(req, userId);
 * Throws error if user does not have a valid session!
 * @param req
 * @param userId
 * @returns
 */
export async function validateSession(req: IReq, userId: UUID): Promise<void> {
	await new SessionManager(req, userId).validateUserSession();
}
