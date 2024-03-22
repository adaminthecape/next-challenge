import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from '../models/Database';
import { handleError } from '../utils';
import { Password } from './Password';
import { Profile } from './Profile';

export enum LoginStatus {
	'Banned' = 0,
	'Unverified' = 1,
	'Active' = 2,
}

export interface LoginDetails {
	id?: number;
	username: string;
	/** MD5 hash of the user's chosen password */
	password: string;
	createdAt: number;
	status: LoginStatus;
}

export class LoginManager {
	public static async getIdForUsername(
		req: IReq,
		username: string
	): Promise<UUID> {
		const db = await Database.getInstance(req);

		return db.query1('SELECT `userId` FROM `logins` WHERE `username` = ?', [
			username,
		]);
	}

	/**
	 * Paginated querying of existing users. Used for activating accounts.
	 * @param req
	 * @param filters
	 * @returns
	 */
	public static async getLogins(
		req: IReq,
		filters: {
			status?: LoginStatus;
			userId?: UUID;
			username?: string;
			pagination?: {
				page?: number;
				limit?: number;
				offset?: number;
			};
		}
	): Promise<any> {
		if (!filters) filters = {};
		// if (!filters.status) filters.status = LoginStatus.Active;
		if (!filters.pagination) filters.pagination = {};
		if (!filters.pagination.page) filters.pagination.page = 1;
		if (!filters.pagination.limit) filters.pagination.limit = 10;
		if (!filters.pagination.offset) {
			filters.pagination.offset =
				(filters.pagination.page - 1) * filters.pagination.limit;
		}

		const wheres: string[] = [];
		const params: any[] = [];

		if (filters.status) {
			wheres.push('`status` = ?');
			params.push(
				typeof filters.status === 'number'
					? filters.status
					: parseInt(filters.status, 10)
			);
		}

		if (filters.userId) {
			wheres.push('`userId` LIKE ?');
			params.push(`%${filters.userId}%`);
		}

		if (filters.username) {
			wheres.push('`username` LIKE ?');
			params.push(`%${filters.username}%`);
		}

		params.push(
			typeof filters.pagination.limit === 'number'
				? filters.pagination.limit
				: parseInt(filters.pagination.limit, 10)
		);
		params.push(
			typeof filters.pagination.offset === 'number'
				? filters.pagination.offset
				: parseInt(filters.pagination.offset, 10)
		);

		if (!wheres.length) {
			wheres.push('userId IS NOT NULL');
		}

		const db = await Database.getInstance(req);

		let total = 0;

		try {
			const countData = await db.query1r(
				`SELECT COUNT(userId) AS count FROM logins WHERE ${wheres.join(
					' AND '
				)}`,
				params
			);

			total = countData?.count || 0;
		} catch (e) {
			handleError({
				message: 'Could not get count for active logins.',
				error: e,
			});
		}

		const logins = await db.select(
			`SELECT \`userId\`, \`username\`, \`status\`, \`createdAt\`
            FROM \`logins\`
			WHERE ${wheres.join(' AND ')}
			LIMIT ? OFFSET ?`,
			params
		);

		return { logins, total, limit: filters.pagination.limit };
	}

	public static async getExistingLoginForUsername(
		req: IReq,
		username: string
	): Promise<
		| {
				username: string;
				password: string;
				userId: UUID;
				status: LoginStatus;
		  }
		| undefined
	> {
		const db = await Database.getInstance(req);

		return db.query1r(
			`SELECT username, password, userId, status
            FROM logins
            WHERE username = ?`,
			[username]
		);
	}

	public static async createLogin(
		req: IReq,
		username: string,
		password: string
	): Promise<boolean> {
		const db = await Database.getInstance(req);

		// First check if the user exists already
		const existingLogin = (
			await db.query1r('SELECT username FROM logins WHERE username = ?', [
				username,
			])
		)?.username;

		// This may need extra protections to prevent bad actors from querying
		// which users exist on the system
		if (existingLogin) {
			handleError({
				message: 'An account with this name has already registered.',
			});

			return false;
		}

		try {
			const userId = crypto.randomUUID() as UUID;

			// Insert a new row for the user & mark as unverified
			await db.insert(
				`INSERT INTO logins
                    (username, password, userId, createdAt, status)
                VALUES (?,?,?,?,?)`,
				[
					username,
					await Password.hashPassword(password),
					// this will be the user's ID going forward
					userId,
					Date.now(),
					LoginStatus.Unverified,
				]
			);

			// Insert a stub for this user's profile
			const profiles = new Profile(req, userId);

			await profiles.createProfileStub();

			// TODO: Notify admins that a user was registered
			// Once admins approve the user, it will be updated

			return true;
		} catch (e) {
			handleError({
				message: `Failed to create login for user ${username}`,
				error: e,
			});

			return false;
		}
	}

	private req: IReq;
	private userId: UUID;

	constructor(req: IReq, userId?: UUID) {
		this.req = req;
		this.userId = userId as UUID;

		if (!this.userId) {
			const message = 'Cannot log in without a user!';
			handleError({
				message,
				throw: new Error(message),
			});
		}
	}

	public async changeLoginStatus(
		userId: UUID,
		status: LoginStatus
	): Promise<boolean> {
		const db = await Database.getInstance(this.req);

		// TODO: Validate the request owner as admin
		// TODO: Validate the request owner as outranking the other user

		try {
			await db.update(
				`UPDATE logins SET status = ? WHERE userId = ? LIMIT 1`,
				[status, userId]
			);

			console.log('Updated state to', status, 'for user', userId);

			return true;
		} catch (e) {
			handleError({
				message: `Failed to get existing session for user ${this.userId}`,
				error: e,
			});

			return false;
		}
	}
}
