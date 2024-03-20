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
			params.push(
				typeof filters.scope === 'number'
					? filters.scope
					: parseInt(filters.scope, 10)
			);
		}

		if (filters.userId) {
			wheres.push('p.userId LIKE ?');
			params.push(`%${filters.userId}%`);
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
				message: 'Could not get count for active logins.',
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
		scope?: UUID
	): Promise<void> {
		// Validate if the user can insert permissions
		await this.validate(PermissionType.PERMISSIONS_CREATE, scope);

		// Does this permission already exist?
		const existingPermission = await this.getPermission(
			permissionType,
			scope
		);

		if (existingPermission) {
			throw new Error('Permission already exists!');
		}

		await this.insertPermission({
			permissionType,
			userId,
			scope,
			createdAt: Date.now(),
			createdBy: this.req.currentUser.userId,
			status: PermissionStatus.UNVERIFIED,
		});
	}

	/**
	 * Permissions can be disabled, but nothing else about them can be changed.
	 * This is to preserve a record of permission assignments and allow logic
	 * based on whether a user has had the permission before.
	 * @param permissionType
	 * @param userId
	 * @param scope
	 */
	private async verifyPermission(
		permissionType: PermissionType,
		userId: UUID,
		scope?: UUID
	): Promise<void> {
		// Validate if the user can suspend permissions
		await this.validate(PermissionType.PERMISSIONS_CREATE, scope);

		const db = await Database.getInstance(this.req);

		await db.update(
			`UPDATE permissionsMap SET status = ?, updatedAt = ? WHERE (
				permissionType = ? AND userId = ? AND scope = ?
			)`,
			[PermissionStatus.ACTIVE, Date.now(), permissionType, userId, scope]
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
	private async suspendPermission(
		permissionType: PermissionType,
		userId: UUID,
		scope?: UUID
	): Promise<void> {
		// Validate if the user can suspend permissions
		await this.validate(PermissionType.PERMISSIONS_SUSPEND, scope);

		const db = await Database.getInstance(this.req);

		await db.update(
			`UPDATE permissionsMap SET status = ?, updatedAt = ? WHERE (
				permissionType = ? AND userId = ? AND scope = ?
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
		states?: PermissionStatus[]
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
		const usersPermission = await this.getPermission(permissionType, scope);

		if (
			!(
				usersPermission?.userId === this.userId &&
				usersPermission?.permissionType === permissionType &&
				usersPermission.status === PermissionStatus.ACTIVE &&
				((!scope && !usersPermission.scope) ||
					usersPermission?.scope === scope)
			)
		) {
			throw new Error('Not allowed!');
		}

		return true;
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
