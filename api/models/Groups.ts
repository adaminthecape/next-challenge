import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from './Database';
import { handleError } from '../utils';
import { PermissionType, UserPermissions } from './Permissions';

export enum GroupStatus {
	closed = 'closed',
	private = 'private',
	public = 'public',
}

export enum GroupApprovalType {
	/** A group leader must approve every request */
	manual = 'manual',
	/** Nobody can join */
	never = 'never',
	/** Anyone can join */
	auto = 'auto',
}

export interface GroupRow {
	groupId?: UUID;
	scope: UUID;
	name: string;
	createdBy?: UUID;
	createdAt?: number;
	status: GroupStatus;
	approvalType: GroupApprovalType;
	jsonData?: Record<string, any>;
}

export enum GroupRoleType {
	'USER' = 'USER',
	'MOD' = 'MOD',
	'ADMIN' = 'ADMIN',
}

const USER = [
	PermissionType.COMMUNICATIONS_CREATE,
	PermissionType.COMMUNICATIONS_READ,
	PermissionType.PROFILE_VIEW,
];
const MOD = [
	PermissionType.COMMUNICATIONS_DELETE,
	PermissionType.COMMUNICATIONS_UPDATE,
	PermissionType.PERMISSIONS_SUSPEND,
];
const ADMIN = [
	PermissionType.GROUP_CREATE,
	PermissionType.GROUP_DELETE,
	PermissionType.GROUP_UPDATE,
	PermissionType.PERMISSIONS_VERIFY,
];
/**
 * Predefined permission bundles for easy role management.
 * Given any of these bundles, a user's permissions can be reset or elevated to
 * any of the predefined levels.
 */
export const cGroupRoles = {
	USER,
	MOD: [...USER, ...MOD],
	ADMIN: [...USER, ...MOD, ...ADMIN],
};

export class Groups {
	public static async getPageOfGroups(
		req: IReq,
		filters: {
			approvalType?: GroupApprovalType;
			status?: GroupStatus;
			userId?: UUID;
			groupId?: UUID;
			scope?: UUID | 'any';
			name?: string;
			username?: string;
			pagination?: {
				page?: number;
				limit?: number;
				offset?: number;
			};
		},
		/** Only return the count & avoid expensive data fetching */
		countOnly?: boolean
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

		if (filters.status && GroupStatus[filters.status]) {
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

		if (filters.groupId) {
			wheres.push('g.`groupId` = ?');
			params.push(filters.groupId);
		}

		if (filters.name) {
			wheres.push('g.`name` LIKE ?');
			params.push(`%${filters.name}%`);
		}

		if (filters.scope === 'any') {
		} else if (filters.scope) {
			wheres.push('g.`scope` = ?');
			params.push(filters.scope);
		} else {
			wheres.push('g.`scope` IS NULL');
		}

		if (filters.approvalType && GroupApprovalType[filters.approvalType]) {
			wheres.push('g.`approvalType` = ?');
			params.push(filters.approvalType);
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

		const db = await Database.getInstance(req, true);

		let total = 0;

		try {
			const countData = await db.query1(
				`SELECT COUNT(*) FROM \`groups\` g WHERE ${wheres.join(
					' AND '
				)}`,
				params
			);

			total = countData || 0;
		} catch (e) {
			handleError({
				message: 'Could not get count for active groups.',
				error: e,
			});
		}

		if (countOnly) {
			return { groups: [], total };
		}

		const groups: GroupRow[] = await db.select(
			`SELECT 
				g.*,
				l.username AS createdByName,
				(
					SELECT g2.name FROM \`groups\` g2
					WHERE g2.groupId = g.scope LIMIT 1
				) AS parentName
			FROM \`groups\` g
			JOIN \`logins\` l ON l.userId = g.createdBy
			WHERE ${wheres.join(' AND ')}
			LIMIT ? OFFSET ?`,
			params
		);

		return { groups: groups || [], total, limit: filters.pagination.limit };
	}

	public static async addGroup(req: IReq, data: GroupRow) {
		const sql = `INSERT INTO \`groups\` (
            groupId,
			scope,
			\`name\`,
			createdBy,
			createdAt,
			\`status\`,
			approvalType,
			jsonData
        ) VALUES (?,?,?,?,?,?,?,CAST(? AS JSON))`;

		const groupId = data.groupId || (crypto.randomUUID() as UUID);
		const createdBy = data.createdBy || req.currentUser?.userId;

		const params: any[] = [
			groupId,
			data.scope ?? null,
			data.name,
			createdBy,
			Date.now(),
			data.status ?? GroupStatus.private,
			GroupApprovalType[data.approvalType]
				? data.approvalType
				: GroupApprovalType.manual,
			data.jsonData ? JSON.stringify(data.jsonData) : '{}',
		];

		const db = await Database.getInstance(req);

		console.log('ADD GROUP:', await db.getFormattedQuery(sql, params));

		await db.insert(sql, params);

		return groupId;
	}

	private req: IReq;
	private groupId: UUID;

	constructor(req: IReq, groupId: UUID) {
		this.req = req;
		this.groupId = groupId;
	}

	public async getStatus(): Promise<GroupStatus> {
		const db = await Database.getInstance(this.req);

		return db.query1('SELECT `status` FROM `groups` WHERE groupId = ?', [
			this.groupId,
		]);
	}

	public async getApprovalType(): Promise<GroupApprovalType> {
		const db = await Database.getInstance(this.req);

		return db.query1(
			'SELECT `approvalType` FROM `groups` WHERE groupId = ?',
			[this.groupId]
		);
	}

	private async getData() {
		// get all data for this group, plus metadata
	}

	public async updateGroup(data: GroupRow) {
		try {
			const query = `REPLACE INTO \`groups\` (
            groupId, scope, name, createdBy, createdAt, \`status\`, jsonData
        ) VALUES (?,?,?,?,?,?,?)`;

			const params: any[] = [
				this.groupId,
				data.scope,
				data.name,
				data.createdBy,
				data.createdAt,
				data.status,
				await this.getMergedData(data.jsonData || {}),
			];

			const db = await Database.getInstance(this.req);

			await db.query(query, params);
		} catch (e) {
			handleError({
				message: `Could not update group ${this.groupId}`,
				error: e,
			});
		}
	}

	public async getMergedData(
		mutations: Record<string, any>
	): Promise<Record<string, any>> {
		const db = await Database.getInstance(this.req);

		try {
			const currentData: { jsonData: any } = (
				await db.query1r(
					`SELECT CAST(\`jsonData\` AS JSON) AS jsonData
                    FROM \`groups\` WHERE \`groupId\` = ?`,
					[this.groupId]
				)
			)?.jsonData;

			// This should use a better merge strategy, e.g. deepClone
			return {
				...(currentData || {}),
				...mutations,
			};
		} catch (e) {
			handleError({
				message: `Could not merge data for group ${this.groupId}`,
				error: e,
			});

			return {};
		}
	}

	/**
	 * Add a user to the group.
	 * @returns Whether the user was successfully added.
	 */
	public async requestMembership(userId: UUID): Promise<boolean> {
		if (!userId || !this.groupId) return false;

		return this.requestRole(userId, GroupRoleType.USER);
	}

	/**
	 * Add a user to the group.
	 * @returns Whether the user was successfully added.
	 */
	public async confirmMembership(userId: UUID): Promise<boolean> {
		if (!userId || !this.groupId) return false;

		return this.assignRole(userId, GroupRoleType.USER);
	}

	public async requestRole(
		userId: UUID,
		role: GroupRoleType
	): Promise<boolean> {
		const permissions = new UserPermissions(this.req, userId);
		const permissionsToGrant: PermissionType[] = cGroupRoles[role];

		for await (const permissionType of permissionsToGrant) {
			await permissions.assignPermission(
				permissionType,
				userId,
				this.groupId
			);
		}

		return true;
	}

	public async assignRole(
		userId: UUID,
		role: GroupRoleType
	): Promise<boolean> {
		const permissions = new UserPermissions(this.req, userId);
		const permissionsToGrant: PermissionType[] = cGroupRoles[role];

		for await (const permissionType of permissionsToGrant) {
			await permissions.verifyPermission(
				permissionType,
				userId,
				this.groupId
			);
		}

		return true;
	}
}
