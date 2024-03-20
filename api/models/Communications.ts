import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from './Database';
import { PermissionType, validatePermission } from './Permissions';

export interface CommunicationRow {
	/** Table row id */
	id?: number;
	/** Scope - could be a private chat, a group, etc */
	scope?: UUID;
	/** The id of the sender */
	from: UUID;
	/** The id of the recipient */
	to: UUID;
	/** The content of the communication */
	message: string;
	/** When the message was sent */
	createdAt: number;
	/** If deleted, when it was deleted */
	deletedAt?: number;
}

export class Communications {
	private req: IReq;
	private userId: UUID;

	constructor(req: IReq, userId: UUID) {
		this.req = req;
		this.userId = userId;
	}

	public async addCommunication(
		recipient: UUID,
		message: string,
		scope?: UUID
	): Promise<void> {
		// Communications must have a scope
		if (!scope) {
			return;
		}

		// Validate that the user can communicate with the target user
		await validatePermission(
			this.req,
			this.req.currentUser.userId,
			PermissionType.COMMUNICATIONS_CREATE,
			scope
		);

		const db = await Database.getInstance(this.req);

		await db.insert(
			`INSERT INTO communications (
                scope, from, to, message, createdAt
            ) VALUES (?, ?, ?, ?, ?)`,
			[scope ?? null, this.userId, recipient, message, Date.now()]
		);
	}

	/**
	 * Get a page of communications for a given scope.
	 * @param opts
	 * @returns
	 */
	public async getCommunications(opts: {
		scope: UUID;
		from?: UUID;
		to?: UUID;
		pagination?: {
			page?: number;
			limit?: number;
			offset?: number;
		};
	}): Promise<CommunicationRow[]> {
		// Communications must have a scope
		if (!opts?.scope) {
			return [];
		}

		// Validate that the user can read these communications
		await validatePermission(
			this.req,
			this.req.currentUser.userId,
			PermissionType.COMMUNICATIONS_READ,
			opts.scope
		);

		if (!opts.pagination) {
			opts.pagination = {};
		}

		if (!opts.pagination.page) {
			opts.pagination.page = 1;
		}

		if (!opts.pagination.limit) {
			opts.pagination.limit = 10;
		}

		if (typeof opts.pagination.offset !== 'number') {
			opts.pagination.offset =
				(opts.pagination.page - 1) * opts.pagination.limit;
		}

		const wheres: string[] = [];
		const params: any[] = [];

		// first ensure scope is respected
		wheres.push('scope = ?');
		params.push(opts.scope);

		if (opts.from) {
			wheres.push('from = ?');
			params.push(opts.from);
		}

		if (opts.to) {
			wheres.push('to = ?');
			params.push(opts.to);
		}

		params.push(opts.pagination.limit);
		params.push(opts.pagination.offset);

		const db = await Database.getInstance(this.req);

		return db.select(
			`SELECT * FROM communications WHERE (${wheres.join(
				' AND '
			)}) LIMIT ? OFFSET ?`,
			params
		);
	}
}
