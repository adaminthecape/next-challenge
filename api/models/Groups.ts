import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from './Database';
import { handleError } from '../utils';

export enum GroupStatus {
	closed = 'closed',
	private = 'private',
	public = 'public',
}

export interface GroupRow {
	groupId?: UUID;
	scope: UUID;
	name: string;
	createdBy?: UUID;
	createdAt?: number;
	status: GroupStatus;
	json?: Record<string, any>;
}

export class Groups {
	public static async getPageOfGroups(
		req: IReq,
		filters: {
			status?: GroupStatus;
			userId?: UUID;
			scope?: UUID;
			name?: string;
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
			wheres.push('g.`status` = ?');
			params.push(
				typeof filters.status === 'number'
					? filters.status
					: parseInt(filters.status, 10)
			);
		}

		if (filters.userId) {
			wheres.push('g.`createdBy` LIKE ?');
			params.push(`%${filters.userId}%`);
		}

		if (filters.name) {
			wheres.push('g.`name` LIKE ?');
			params.push(`%${filters.name}%`);
		}

		if (filters.scope) {
			wheres.push('g.`scope` = ?');
			params.push(filters.scope);
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
			wheres.push('g.groupId IS NOT NULL');
		}

		const db = await Database.getInstance(req);

		let total = 0;

		try {
			const countData = await db.query1r(
				`SELECT COUNT(*) AS count FROM \`groups\` g WHERE ${wheres.join(
					' AND '
				)}`,
				params
			);

			total = countData?.count || 0;
		} catch (e) {
			handleError({
				message: 'Could not get count for active groups.',
				error: e,
			});
		}

		const groups: GroupRow[] = await db.select(
			`SELECT * FROM \`groups\` g WHERE ${wheres.join(
				' AND '
			)} LIMIT ? OFFSET ?`,
			params
		);

		return { groups: groups || [], total, limit: filters.pagination.limit };
	}

	public static async addGroup(req: IReq, data: GroupRow) {
		const sql = `INSERT INTO \`groups\` (
            groupId, scope, name, createdBy, createdAt, status, json
        ) VALUES (?,?,?,?,?,?,?)`;

		const params: any[] = [
			data.groupId || crypto.randomUUID(),
			data.scope ?? null,
			data.name,
			data.createdBy,
			Date.now(),
			data.status ?? GroupStatus.private,
			data.json ?? '{}',
		];

		console.log('ADD GROUP:', sql, params);

		const db = await Database.getInstance(req);

		await db.insert(sql, params);
	}

	private req: IReq;
	private groupId: UUID;

	constructor(req: IReq, groupId: UUID) {
		this.req = req;
		this.groupId = groupId;
	}

	private async getData() {
		// get all data for this group, plus metadata
	}

	public async getPaginatedQuery() {
		const wheres: string[] = [];
		const params: any[] = [];

		const sql = `SELECT * FROM groups WHERE (${wheres.join(
			' AND '
		)}) LIMIT ? OFFSET ?`;
	}

	public async updateGroup() {
		const sql = `REPLACE INTO groups (
            groupId, scope, name, createdBy, createdAt, status, json
        ) VALUES (?,?,?,?,?,?,?)`;

		const params: any[] = [];
	}
}
