import { UUID } from 'crypto';
import { IReq } from '../../sharedTypes';
import { Database } from './Database';
import { handleError } from '../utils';

export enum GlobalIncorrigiblePermissions {
	PERMISSIONS_CREATE = 'permissions.create',
}

export enum IncorrigiblePermissions {
	ACCOUNT_VERIFY = 'account.verify',
	ACCOUNT_CREATE = 'account.create',
	PROFILE_DELETE = 'profile.delete',
}

/**
 * Immutable permission keys which are referenced across the API.
 * These permission types cannot be added/removed by admins, but they can be
 * managed by admins (assigning/revoking for downstream users).
 */
export enum PermissionType {
	PERMISSIONS_READ = 'permissions.read',
	PERMISSIONS_CREATE = 'permissions.create',
	PERMISSIONS_SUSPEND = 'permissions.suspend',
	PERMISSIONS_VERIFY = 'permissions.verify',
	/** Allowed through registration, but registration may be disabled */
	ACCOUNT_CREATE = 'account.create',
	/** Admins may be able to see users but not verify them */
	ACCOUNT_VIEW = 'account.view',
	/** Verifying an account makes the user able to log in */
	ACCOUNT_VERIFY = 'account.verify',
	PROFILE_VIEW = 'profile.view',
	/** Exception: users may update their own profile */
	PROFILE_UPDATE = 'profile.update',
	/** Exception: users may delete their own profile */
	PROFILE_DELETE = 'profile.delete',
	COMMUNICATIONS_READ = 'communications.read',
	COMMUNICATIONS_CREATE = 'communications.create',
	COMMUNICATIONS_UPDATE = 'communications.update',
	/** Exception: users may delete their own communications */
	COMMUNICATIONS_DELETE = 'communications.delete',
	GROUP_CREATE = 'group.create',
	GROUP_DELETE = 'group.delete',
	GROUP_UPDATE = 'group.update',
	GROUP_READ = 'group.read',
}

export enum PermissionStatus {
	ACTIVE = 2,
	SUSPENDED = 1,
	UNVERIFIED = 0,
}

export interface PermissionMapRow {
	/** Table row id */
	id?: number;
	/** The user to whom this permission applies */
	userId: string;
	/** The door this unlocks */
	permissionType: PermissionType;
	/** Group to which this permission applies */
	scope: UUID | undefined;
	/** Timestamp (in millis) when this permission was assigned */
	createdAt: number;
	/** The user who assigned this permission */
	createdBy: UUID;
	/** Whether the permission is active, suspended, or awaiting approval */
	status?: PermissionStatus;
}

export const cSelfManageablePermissions = [
	PermissionType.PERMISSIONS_READ,
	PermissionType.PERMISSIONS_SUSPEND,
];
// The permission assignments on the system can be defined by super admins.
// The permission *types* must be directly referenced in code, and cannot
// be defined by super admins.
// Each permissionsMap row is like a hotel room keycard.
// - Multiple people can have a keycard for the same room.
// - Any keycard can be scoped to a given floor.
// - A user may have multiple cards for multiple floors.
// - A user may have a global pass, but admins cannot configure this.

export class UserPermissions {
	// public static async getInstance(
	// 	req: IReq,
	// 	userId: UUID
	// ): Promise<UserPermissions> {
	// 	const instance = new UserPermissions(req, userId);

	// 	await instance.loadAllPermissions();

	// 	return instance;
	// }

	public static async getPermissionsList(
		req: IReq,
		filters: {
			scope?: UUID;
			userId?: UUID;
			status?: PermissionStatus[];
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

		if (filters.scope) {
			wheres.push('p.scope = ?');
			params.push(filters.scope);
		}

		if (filters.userId) {
			wheres.push('p.userId LIKE ?');
			params.push(`%${filters.userId}%`);
		}

		if (filters.status?.length) {
			wheres.push('p.`status` IN (?)');
			params.push(filters.status);
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
			wheres.push('p.userId IS NOT NULL');
		}

		const db = await Database.getInstance(req);

		let total = 0;

		try {
			const countData = await db.query1r(
				`SELECT COUNT(p.userId) AS count FROM permissionsMap p WHERE ${wheres.join(
					' AND '
				)}`,
				params
			);

			total = countData?.count || 0;
		} catch (e) {
			handleError({
				message: 'Could not get count for permissions.',
				error: e,
			});
		}

		const permissions = await db.select(
			`SELECT 
				p.userId,
				p.permissionType,
				p.scope,
				p.createdAt,
				p.updatedAt,
				p.createdBy,
				p.status,
				l.username
            FROM permissionsMap p
			JOIN logins l ON l.userId = p.userId
			WHERE ${wheres.join(' AND ')}
			LIMIT ? OFFSET ?`,
			params
		);

		return {
			permissions,
			total,
			limit: filters.pagination.limit,
			page: filters.pagination.page,
		};
	}

	private req: IReq;
	private userId: UUID;
	// private permissions: PermissionMapRow[];

	constructor(req: IReq, userId?: UUID) {
		this.req = req;
		this.userId = userId || req.currentUser.userId;
	}

	// private async loadAllPermissions(): Promise<void> {
	// 	const db = await Database.getInstance(this.req);

	// 	this.permissions = await db.select(
	// 		'SELECT * FROM permissionsMap WHERE userId = ?',
	// 		[this.userId]
	// 	);
	// }

	/**
	 * Fetch all permissions for this user, with optional additional filters.
	 * This deliberately does NOT return disabled permissions.
	 * @param scope
	 */
	private async getUsersActivePermissions(
		opts?: Partial<PermissionMapRow>
	): Promise<void> {
		// TODO: Guard against users phishing for others' permissions
		const db = await Database.getInstance(this.req);
		const wheres = [];
		const params = [];

		// userId first
		wheres.push('userId = ?');
		params.push(this.userId);

		if (opts?.scope) {
			wheres.push('scope = ?');
			params.push(opts.scope);
		}

		if (opts?.permissionType) {
			wheres.push('permissionType = ?');
			params.push(opts.permissionType);
		}

		if (opts?.createdBy) {
			wheres.push('createdBy = ?');
			params.push(opts.createdBy);
		}

		// ensure only active permissions
		wheres.push('status = ?');
		params.push(PermissionStatus.ACTIVE);

		return db.select(
			`SELECT * FROM permissionsMap WHERE (${wheres.join(' AND ')})`,
			params
		);
	}

	// assign a permission to a user
	private async insertPermission(rowData: PermissionMapRow): Promise<void> {
		const db = await Database.getInstance(this.req);

		if (!rowData.userId || !rowData.permissionType || !rowData.createdBy) {
			throw new Error('Bad permission row data');
		}

		await db.insert(
			`INSERT INTO permissionsMap (
				permissionType, userId, scope, createdAt, createdBy, status
			) VALUES (?, ?, ?, ?, ?, ?)`,
			[
				rowData.permissionType,
				rowData.userId,
				rowData.scope,
				rowData.createdAt ?? Date.now(),
				rowData.createdBy,
				rowData.status ?? PermissionStatus.UNVERIFIED,
			]
		);
	}

	/**
	 * Assign a given permission to a given user.
	 * @param permissionType
	 * @param userId
	 */
	public async assignPermission(
		permissionType: PermissionType,
		userId: UUID,
		scope: UUID,
		andLog?: boolean
	): Promise<void> {
		/** Unscoped permissions can only be manually added */
		if (!scope) {
			throw new Error('Not allowed!');
		}

		// Does this permission already exist?
		const existingPermission = await this.getPermission(
			permissionType,
			scope,
			[
				PermissionStatus.ACTIVE,
				PermissionStatus.SUSPENDED,
				PermissionStatus.UNVERIFIED,
			]
		);

		if (existingPermission) {
			return;
		}

		await this.insertPermission({
			permissionType,
			userId,
			scope,
			createdAt: Date.now(),
			createdBy: this.req.currentUser.userId,
			status: PermissionStatus.UNVERIFIED,
		});

		if (andLog) {
			console.log(
				`Permission ${permissionType} assigned to ${userId} for ${scope}`
			);
		}
	}

	/**
	 * UNSAFE - only do this when assigning basic initial permissions
	 * Assign a given permission to a given user.
	 * @param permissionType
	 * @param userId
	 */
	public async assignPermissionUnsafe(
		permissionType: PermissionType,
		userId: UUID,
		scope: UUID,
		status: PermissionStatus
	): Promise<void> {
		if (!scope || !userId || !permissionType) {
			throw new Error('CANNOT GRANT');
		}

		// Does this permission already exist?
		const existingPermission = await this.getPermission(
			permissionType,
			scope,
			[
				PermissionStatus.ACTIVE,
				PermissionStatus.SUSPENDED,
				PermissionStatus.UNVERIFIED,
			]
		);

		if (existingPermission) {
			return;
		}

		await this.insertPermission({
			permissionType,
			userId,
			scope,
			createdAt: Date.now(),
			createdBy: this.req.currentUser.userId,
			status: status || PermissionStatus.UNVERIFIED,
		});

		console.log(
			`(UNSAFE) Permission ${permissionType} assigned to ${userId} for ${scope}`
		);
	}

	/**
	 * Permissions can be disabled, but nothing else about them can be changed.
	 * This is to preserve a record of permission assignments and allow logic
	 * based on whether a user has had the permission before.
	 * @param permissionType
	 * @param userId
	 * @param scope
	 */
	public async verifyPermission(
		permissionType: PermissionType,
		userId: UUID,
		scope?: UUID
	): Promise<void> {
		/** Unscoped permissions can only be manually added */
		if (!scope) {
			throw new Error('Not allowed!');
		}

		const db = await Database.getInstance(this.req, true);

		await db.update(
			`UPDATE permissionsMap SET
				status = ?,
				updatedAt = ?,
				approvedBy = ?
			WHERE (
				permissionType = ? AND userId = ? AND scope = ?
			) LIMIT 1`,
			[
				PermissionStatus.ACTIVE,
				Date.now(),
				this.req.currentUser?.userId,
				permissionType,
				userId,
				scope,
			]
		);
	}

	/**
	 * Permissions can be disabled, but nothing else about them can be changed.
	 * This is to preserve a record of permission assignments and allow logic
	 * based on whether a user has had the permission before.
	 * @param permissionType
	 * @param userId
	 * @param scope
	 */
	public async suspendPermission(
		permissionType: PermissionType,
		userId: UUID,
		scope?: UUID
	): Promise<void> {
		/** Unscoped permissions can only be manually added */
		if (!scope) {
			throw new Error('Not allowed!');
		}

		const db = await Database.getInstance(this.req);

		await db.update(
			`UPDATE permissionsMap SET \`status\` = ?, updatedAt = ? WHERE (
				permissionType = ? AND userId = ? AND \`scope\` = ?
			)`,
			[
				PermissionStatus.SUSPENDED,
				Date.now(),
				permissionType,
				userId,
				scope,
			]
		);
	}

	/**
	 * Check if a user has a permission for the given scope.
	 * @param data
	 * @returns
	 */
	public async getPermission(
		permissionType: PermissionType,
		scope?: UUID,
		states?: PermissionStatus[],
		forceNullScope?: boolean
	): Promise<PermissionMapRow> {
		const db = await Database.getInstance(this.req);

		if (!(this.userId && permissionType)) {
			throw new Error(
				`Not enough data to retrieve permission: ${JSON.stringify({
					permissionType,
					scope,
				})}`
			);
		}

		const wheres: string[] = [];
		const params: any[] = [];

		wheres.push('userId = ?');
		params.push(this.userId);

		wheres.push('permissionType = ?');
		params.push(permissionType);

		if (scope) {
			wheres.push('scope = ?');
			params.push(scope);
		} else {
			wheres.push('scope IS NULL');
		}

		wheres.push('status IN (?)');
		params.push(!states?.length ? [PermissionStatus.ACTIVE] : states);

		const userHasPermission = await db.query1r(
			`SELECT * FROM permissionsMap WHERE (${wheres.join(' AND ')})`,
			params
		);

		return userHasPermission;
	}

	public async validate(
		permissionType: PermissionType,
		scope?: UUID
	): Promise<boolean> {
		if (
			scope &&
			this.userId &&
			this.req.currentUser.userId &&
			this.userId === this.req.currentUser.userId &&
			this.userId === scope &&
			permissionType &&
			cSelfManageablePermissions.includes(permissionType)
		) {
			console.log(
				`User ${this.userId} managing OWN permission ${permissionType} on ${scope}`
			);

			// users can do some things to themselves
			return true;
		}

		const usersPermission = await this.getPermission(permissionType, scope);

		if (
			!usersPermission
			// !usersPermission ||
			// !(
			// 	usersPermission?.userId === this.userId &&
			// 	usersPermission?.permissionType === permissionType &&
			// 	usersPermission?.status === PermissionStatus.ACTIVE &&
			// 	((!scope && !usersPermission?.scope) ||
			// 		usersPermission?.scope === scope)
			// )
		) {
			// is this a super admin for this permission?
			const superAdminPermission = await this.getPermission(
				permissionType,
				undefined
			);

			if (superAdminPermission) {
				console.log(
					`${this.userId} is super admin for ${permissionType}`
				);

				return true;
			}

			throw new Error(
				`Not allowed! ${this.userId} for ${permissionType} on ${scope}`
			);
		}

		return true;
	}

	public async validateMultiple(
		permissionTypes: PermissionType[],
		scope?: UUID
	): Promise<any> {
		const resultMap: Partial<Record<PermissionType, boolean>> = {};

		for await (const permissionType of permissionTypes) {
			try {
				if (await this.validate(permissionType, scope)) {
					resultMap[permissionType] = true;
				}
			} catch (e) {
				resultMap[permissionType] = false;
			}
		}

		return {
			results: resultMap,
			success: Object.values(resultMap).every(
				(result) => result === true
			),
		};
	}
}

/**
 * Validate a given user's permission in a given scope (or unscoped).
 * Can only return `true` if validated, otherwise it will error.
 * @param req
 * @param userId
 * @param permissionType
 * @param scope
 * @returns
 */
export async function validatePermission(
	req: IReq,
	userId: UUID,
	permissionType: PermissionType,
	scope?: UUID
): Promise<boolean> {
	const permissions = new UserPermissions(req, userId);

	return permissions.validate(permissionType, scope);
}
