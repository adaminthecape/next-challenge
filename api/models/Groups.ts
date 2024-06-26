import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from './Database';
import { handleError } from '../utils';
import {
	PermissionStatus,
	PermissionType,
	UserPermissions,
} from './Permissions';

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
	PermissionType.PERMISSIONS_READ,
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

export type GroupMemberCountRow = {
	count?: number;
	username: string;
	userId: UUID;
};

export class Groups {
	public static async getPageOfGroups(
		req: IReq,
		filters: {
			approvalType?: GroupApprovalType;
			status?: GroupStatus[];
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
			userIsNotMember?: boolean;
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

		if (Array.isArray(filters.status) && filters.status.length) {
			wheres.push('g.`status` IN (?)');
			params.push(filters.status);
		} else {
			wheres.push('g.`status` IN (?)');
			params.push([GroupStatus.public]);
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

		const userGroupRoleList = cGroupRoles.USER.map((x) => `'${x}'`).join(
			', '
		);

		const groups: GroupRow[] = await db.select(
			`SELECT 
				g.*,
				l.username AS createdByName,
				(
					SELECT g2.name
					FROM \`groups\` g2
					WHERE g2.groupId = g.scope LIMIT 1
				) AS parentName,
				(
					SELECT COUNT(DISTINCT userId)
					FROM permissionsMap p
					WHERE p.\`scope\` = g.groupId
					AND p.\`status\` = '${PermissionStatus.ACTIVE}'
				) AS numMembers,
				(
					SELECT COUNT(DISTINCT permissionType)
					FROM permissionsMap p
					WHERE p.\`scope\` = g.groupId
					AND p.userId = '${req.currentUser.userId}'
					AND p.\`status\` = '${PermissionStatus.ACTIVE}'
					AND permissionType IN (${userGroupRoleList})
				) AS numPermissions
			FROM \`groups\` g
			JOIN \`logins\` l ON l.userId = g.createdBy
			WHERE (${wheres.join(' AND ')})
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

		console.log(params);

		const db = await Database.getInstance(req);

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
	public async requestMembership(
		userId: UUID,
		roleType: GroupRoleType = GroupRoleType.USER
	): Promise<boolean> {
		if (!userId || !this.groupId) return false;

		return this.assignRole(userId, roleType);
	}

	/**
	 * Add a user to the group.
	 * @returns Whether the user was successfully added.
	 */
	public async confirmMembership(
		userId: UUID,
		roleType: GroupRoleType = GroupRoleType.USER
	): Promise<boolean> {
		if (!userId || !this.groupId) return false;

		return this.verifyRole(userId, roleType);
	}

	private async assignRole(
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

	private async verifyRole(
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

	/**
	 * Find all users who have at least as many GRANTED permissions on the group
	 * as the given user role.
	 */
	public async getGroupMembers(
		roleType: GroupRoleType
	): Promise<GroupMemberCountRow[]> {
		const db = await Database.getInstance(this.req);

		const roles = cGroupRoles[roleType];

		if (!roles?.length) {
			return [];
		}

		// Find all users who have at least as many GRANTED permissions on the
		// group,
		const results = await db.select(
			`SELECT 
				COUNT(p.permissionType) AS count,
				l.username,
				l.userId
			FROM \`logins\` l
			LEFT JOIN \`permissionsMap\` p ON p.userId = l.userId
			WHERE p.permissionType IN (?) AND p.status = ? AND p.scope = ?
			GROUP BY l.username
			HAVING count >= ?`,
			[roles, PermissionStatus.ACTIVE, this.groupId, roles.length]
		);

		return results?.map((row: GroupMemberCountRow) => ({
			username: row.username,
			userId: row.userId,
		}));
	}

	public async getParentGroups() {
		// 		const sql = `SELECT T2.id, T2.groupId
		// FROM (
		//     SELECT
		//         @r AS _id,
		//         (SELECT @r := scope FROM \`groups\` WHERE groupId = _id) AS parentId,
		//         @l := @l + 1 AS lvl
		//     FROM
		//         (SELECT @r := (SELECT scope FROM \`groups\` WHERE groupId = ?), @l := 0) vars,
		//         \`groups\` h
		//     WHERE @r <> 0) T1
		// JOIN \`groups\` T2
		// ON T1.lvl = T2.id
		// ORDER BY T1.lvl DESC`;
		const sql = `SELECT T2.groupId,T3.scope,T3.groupId
    FROM (
        SELECT
            @r AS _id,
            @p := @r AS previous,
            (SELECT @r := scope FROM \`groups\` WHERE groupId = _id AND scope = ?) AS parent_id,
            @l := @l + 1 AS lvl
        FROM
            (SELECT @r := 8, @p := 0, @l := 0) vars,
            \`groups\` h
        WHERE @r <> 0 AND @r <> @p) T1
    JOIN \`groups\` T2 ON T1._id = T2.groupId AND T2.scope = ?
    LEFT JOIN \`groups\` T3 ON T3.groupId = T2.groupId
    ORDER BY T1.lvl DESC`;

		const db = await Database.getInstance(this.req);

		const results = await db.select(sql, [this.groupId, this.groupId]);
	}

	public async getScopeParents(groupId?: UUID): Promise<{
		parent: UUID | null;
		grandparent: UUID | null;
	}> {
		const db = await Database.getInstance(this.req);

		return (
			(await db.query1r(
				`SELECT 
				groupId AS parent, scope AS grandparent
			FROM \`groups\`
			WHERE groupId = (SELECT scope FROM \`groups\` WHERE groupId = ?)`,
				[groupId || this.groupId]
			)) || {}
		);
	}

	public async getAllScopeParents(): Promise<UUID[]> {
		const getMore = async (startingId: UUID): Promise<boolean> => {
			const { parent, grandparent } = await this.getScopeParents(
				startingId
			);
			let added = false;

			if (parent) {
				if (!allParents.includes(parent)) {
					allParents.push(parent);
					added = true;
				}
			}

			if (grandparent) {
				if (!allParents.includes(grandparent)) {
					allParents.push(grandparent);
					added = true;
				}
			}

			return added;
		};

		const allParents: UUID[] = [];
		let hasMore = true;

		while (hasMore) {
			hasMore = await getMore(
				allParents[allParents.length - 1] || this.groupId
			);
		}

		return allParents;
	}

	public async validatePermissionsForAllParentScopes(
		permissionTypes: PermissionType[]
	): Promise<any> {
		// get all the parent ids & this group id
		// find all users who have all the given permissions in any of the given scopes
		const { userId } = this.req.currentUser;
		const scopes = [this.groupId, ...(await this.getAllScopeParents())];
		const map: Record<UUID, boolean> = {};

		const permissionHandler = new UserPermissions(this.req, userId);

		for await (const scope of scopes) {
			const { success } = await permissionHandler.validateMultiple(
				permissionTypes,
				scope
			);

			map[scope] = success;
		}

		return map;
	}
}
