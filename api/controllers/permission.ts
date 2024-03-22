import { IReq, IRes } from '../../sharedTypes';
import { Database } from '../models/Database';
import { LoginManager } from '../models/Login';
import {
	PermissionStatus,
	PermissionType,
	UserPermissions,
	validatePermission,
} from '../models/Permissions';
import { handleError } from '../utils';
import { UUID } from 'crypto';

export async function approvePermission(req: IReq, res: IRes): Promise<IRes> {
	try {
		console.log('approvePermission:', req.query);
		// first check if user can validate permission in this scope
		const { permissionTypes, scope, userId } = req.query as {
			permissionTypes: PermissionType[];
			scope: UUID;
			userId: UUID;
		};
		const adminId = req.currentUser.userId;

		const permissions = new UserPermissions(req, userId);
		const resultMap: Partial<Record<PermissionType, boolean>> = {};

		for await (const permissionType of permissionTypes) {
			// get the existing permission
			const existing = await permissions.getPermission(
				permissionType,
				scope,
				[PermissionStatus.UNVERIFIED]
			);

			if (!existing) {
				// nothing to verify
				resultMap[permissionType] = false;
			}

			try {
				await validatePermission(
					req,
					adminId,
					PermissionType.PERMISSIONS_VERIFY,
					scope
				);
			} catch (e) {
				resultMap[permissionType] = false;
			}

			console.log('VERIFIED TO SET PERMISSION');

			resultMap[permissionType] = true;

			// okay, we're allowed to verify and we have something to verify
			await permissions.verifyPermission(permissionType, userId, scope);
		}

		console.log({ resultMap });

		return res.sendStatus(200);
	} catch (e) {
		handleError({
			message: 'Could not verify permissions',
			error: e,
		});
	}
}

/**
 * Given a list of multiple permission types, validate the user for each one,
 * and return the result as a map of permission type to result. This makes
 * querying multiple permissions at once more efficient, but it could be more
 * efficient by using a single SQL query.
 * @param req
 * @param res
 */
export async function validatePermissions(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { permissionTypes, scope } = req.query as {
			permissionTypes: PermissionType[];
			scope: UUID;
		};

		const map: Partial<Record<PermissionType, boolean>> = {};

		for await (const type of permissionTypes) {
			{
				try {
					if (
						await validatePermission(
							req,
							req.currentUser.userId,
							type,
							scope
						)
					) {
						map[type] = true;
					}
				} catch (e) {
					map[type] = false;
				}
			}
		}

		console.log({ map });

		return res.status(200).json(map);
	} catch (e) {
		handleError({
			message:
				'Could not map permissions for user ' + req.currentUser.userId,
			error: e,
		});

		return res.sendStatus(500).json({});
	}
}

export async function getScopedPermissions(
	req: IReq,
	res: IRes
): Promise<IRes> {
	const {
		userId: scopedToUserId,
		username,
		scope,
		pagination,
		status,
	} = req.query as any;

	let userId;

	if (scopedToUserId) {
		userId = scopedToUserId;
	} else if (username) {
		userId = await LoginManager.getIdForUsername(req, username);

		if (!userId) {
			return res.status(404).json([]);
		}
	}

	console.log('getScopedPermissions', { username, scope, userId });

	try {
		// validate if user can manage permissions in scope
		try {
			if (!scope) {
				const db = await Database.getInstance(req);
				const permission = await db.query1r(
					'SELECT * FROM permissionsMap WHERE userId = ? AND permissionType = ? AND scope IS NULL',
					[req.currentUser.userId, PermissionType.PERMISSIONS_READ]
				);

				if (!permission) {
					userId = req.currentUser.userId;
				}
			} else {
				await validatePermission(
					req,
					req.currentUser.userId,
					PermissionType.PERMISSIONS_READ,
					scope
				);
			}
		} catch (e) {
			return res.sendStatus(403);
		}

		const data = await UserPermissions.getPermissionsList(req, {
			scope,
			userId,
			pagination,
			status,
		});

		return res.json(data);
	} catch (e) {
		handleError({
			message: `Failed to fetch permissions for scope ${scope}`,
			error: e,
		});

		return res.sendStatus(500);
	}
}
