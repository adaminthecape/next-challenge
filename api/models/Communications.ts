import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from './Database';
import { PermissionType, validatePermission } from './Permissions';
import { handleError } from '../utils';

export interface CommunicationRow {
	/** Table row id */
	id?: number;
	/** Scope - could be a private chat, a group, etc */
	scope?: UUID;
	/** The id of the sender */
	from: UUID;
	fromUsername?: string;
	/** The id of the recipient */
	to: UUID;
	toUsername?: string;
	/** The content of the communication */
	message: string;
	/** When the message was sent */
	createdAt: number;
	/** If deleted, when it was deleted */
	deletedAt?: number;
}

export class Communications {
	private req: IReq;
	private scope: UUID;
	private userId: UUID;

	constructor(req: IReq, userId: UUID, scope?: UUID) {
		this.req = req;
		this.scope = userId;
		this.userId = userId;
	}

	public async addCommunication(
		recipient: UUID | undefined,
		message: string,
		scope?: UUID
	): Promise<void> {
		// Communications must have a scope
		if (!scope) {
			return;
		}

		const db = await Database.getInstance(this.req);

		await db.insert(
			`INSERT INTO \`communications\` (
                \`scope\`, \`from\`, \`to\`, \`message\`, \`createdAt\`
            ) VALUES (?, ?, ?, ?, ?)`,
			[scope ?? null, this.userId, recipient || null, message, Date.now()]
		);
	}

	/**
	 * Get a page of communications for a given scope.
	 * @param opts
	 * @returns
	 */
	public async getCommunications(
		opts: {
			scope: UUID;
			from?: UUID;
			fromUsername?: string;
			to?: UUID;
			toUsername?: string;
			pagination?: {
				page?: number;
				limit?: number;
				offset?: number;
			};
		},
		countOnly?: boolean
	): Promise<{
		communications: CommunicationRow[];
		total: number;
		page: number;
		limit?: number;
	}> {
		// Communications must have a scope
		if (!opts?.scope) {
			return {
				communications: [],
				total: 0,
				page: 1,
			};
		}

		// if (!filters.status) filters.status = LoginStatus.Active;
		if (!opts.pagination) opts.pagination = {};
		if (!opts.pagination.page) opts.pagination.page = 1;
		if (!opts.pagination.limit) {
			opts.pagination.limit = 10;
		} else if (typeof opts.pagination.limit === 'string') {
			opts.pagination.limit = parseInt(opts.pagination.limit, 10);
		}
		if (!opts.pagination.offset) {
			opts.pagination.offset =
				(opts.pagination.page - 1) * opts.pagination.limit;
		}

		const wheres: string[] = [];
		const params: any[] = [];

		// first ensure scope is respected
		wheres.push('c.`scope` = ?');
		params.push(opts.scope);

		if (opts.from) {
			wheres.push('c.`from` = ?');
			params.push(opts.from);
		}

		if (opts.to) {
			wheres.push('c.`to` = ?');
			params.push(opts.to);
		}

		params.push(opts.pagination.limit);
		params.push(opts.pagination.offset);

		const db = await Database.getInstance(this.req);

		let total = 0;

		try {
			const countData = await db.query1(
				`SELECT COUNT(*) FROM \`communications\` c WHERE ${wheres.join(
					' AND '
				)}`,
				params
			);

			total = countData || 0;
		} catch (e) {
			handleError({
				message: 'Could not get count for communications.',
				error: e,
			});
		}

		if (countOnly) {
			return { communications: [], total, page: 1 };
		}

		const communications = await db.select(
			`SELECT 
				c.*,
				l1.username AS fromUsername,
				l2.username AS toUsername
			FROM \`communications\` c
			LEFT JOIN \`logins\` l1 ON l1.userId = c.\`from\`
			LEFT JOIN \`logins\` l2 ON l2.userId = c.\`to\`
			WHERE (${wheres.join(' AND ')})
			LIMIT ? OFFSET ?`,
			params
		);

		return { communications, total, page: 1 };
	}
}
