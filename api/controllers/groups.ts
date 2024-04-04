import { UUID } from 'crypto';
import { IReq, IRes } from '../../sharedTypes';
import {
	cGroupRoles,
	GroupApprovalType,
	GroupMemberCountRow,
	GroupRoleType,
	Groups,
	GroupStatus,
} from '../models/Groups';
import {
	PermissionStatus,
	PermissionType,
	UserPermissions,
	validatePermission,
} from '../models/Permissions';
import { handleError } from '../utils';
import { Database } from '../models/Database';

export async function getPageOfGroups(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { name, scope, pagination, userId, status, approvalType } =
			req.query as any;

		// validate that user can see groups in scope
		if (scope) {
			const [parentGroup] =
				(
					await Groups.getPageOfGroups(req, {
						groupId: scope,
						scope: 'any',
						pagination: {
							limit: 1,
						},
					})
				)?.groups || [];

			if (
				parentGroup /*  && parentGroup.status !== GroupStatus.public */
			) {
				const usersPermissions = new UserPermissions(
					req,
					req.currentUser.userId
				);

				const { success } = await usersPermissions.validateMultiple(
					cGroupRoles.USER,
					scope
				);

				if (!success) {
					return res.status(403).json({ groups: [], total: 0 });
				}
			}
		}

		const data = await Groups.getPageOfGroups(req, {
			name,
			scope,
			userId,
			status,
			pagination,
			approvalType,
		});

		data.groups = data.groups.map((g: any) => {
			if (g.numPermissions >= cGroupRoles.USER.length) {
				g.userIsMember = true;
			}

			return g;
		});

		return res.status(200).json(data);
	} catch (e) {
		handleError({
			message: 'Failed to retrieve groups.',
			error: e,
		});

		return res.status(500).json({ groups: [], total: 0 });
	}
}

export async function addGroup(req: IReq, res: IRes): Promise<IRes> {
	console.log('addGroup:', req.currentUser.userId);
	// validate that user can add groups in scope

	// get the user's id so we know who created this
	const userId = req.currentUser?.userId;

	if (!userId) {
		return res.sendStatus(403);
	}

	try {
		const { name, scope, status, approvalType, jsonData } =
			req.query as any;

		const groupId = await Groups.addGroup(req, {
			name,
			scope,
			createdBy: userId,
			status,
			approvalType,
			jsonData,
		});

		// add a permission for its creator to manage the group
		const permissions = new UserPermissions(req, userId);

		await permissions.assignPermission(
			PermissionType.PERMISSIONS_CREATE,
			userId,
			groupId
		);

		await permissions.verifyPermission(
			PermissionType.PERMISSIONS_CREATE,
			userId,
			groupId
		);

		const group = new Groups(req, groupId);

		// make the creator an admin immediately
		await group.requestMembership(userId, GroupRoleType.ADMIN);
		await group.confirmMembership(userId, GroupRoleType.ADMIN);

		console.log('Done adding group:', groupId);

		return res.status(200).json({ groupId });
	} catch (e) {
		handleError({
			message: 'Failed to retrieve groups.',
			error: e,
		});

		return res.status(500).json({ groups: [], total: 0 });
	}
}

export async function getSingleGroupData(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { groupId } = req.params as { groupId: UUID };
		const { userId } = req.currentUser;

		const [group] =
			(
				await Groups.getPageOfGroups(req, {
					groupId,
					scope: 'any',
					pagination: {
						limit: 1,
					},
				})
			)?.groups || [];

		if (group) {
			// can the user view this group?
			if (group.status !== GroupStatus.public) {
				const usersPermissions = new UserPermissions(
					req,
					req.currentUser.userId
				);

				const { success } = await usersPermissions.validateMultiple(
					cGroupRoles.USER,
					groupId
				);

				if (!success) {
					return res.status(403).json({});
				}
			}

			const groupData = { ...group };

			const handler = new Groups(req, groupId);

			const adminMap =
				await handler.validatePermissionsForAllParentScopes([
					PermissionType.PERMISSIONS_READ,
				]);

			console.log(
				'SCOPE PARENT:',
				await handler.getAllScopeParents(),
				adminMap
			);

			groupData.visibleRoles = {
				users: [],
				mods: [],
				admins: [],
			} as {
				users: GroupMemberCountRow[];
				mods: GroupMemberCountRow[];
				admins: GroupMemberCountRow[];
			};

			const users = await handler.getGroupMembers(GroupRoleType.USER);
			const mods = await handler.getGroupMembers(GroupRoleType.MOD);
			const admins = await handler.getGroupMembers(GroupRoleType.ADMIN);

			if (admins.some((admin) => admin.userId === userId)) {
				groupData.visibleRoles.admins = admins;
			}

			if (mods.some((mod) => mod.userId === userId)) {
				groupData.visibleRoles.mods = mods;
			}

			if (users.some((user) => user.userId === userId)) {
				groupData.visibleRoles.users = users;
			}

			if (group.jsonData) {
				try {
					groupData.jsonData = JSON.parse(group.jsonData);
				} catch (e) {
					//
				}
			}

			// Check for any subgroups
			// This is very inefficient and can be done better with custom SQL
			// I've not bothered as it doesn't have a noticeable effect here
			const subgroups =
				(
					await Groups.getPageOfGroups(req, {
						scope: groupId,
						pagination: {
							limit: 1,
						},
					})
				)?.groups || [];

			if (subgroups?.length) {
				console.log(
					'subgroups:',
					subgroups.map((g: any) => g.groupId)
				);

				groupData.hasSubgroups = true;
			}

			return res.status(200).json(groupData);
		}

		return res.status(404);
	} catch (e) {
		handleError({
			message: 'Failed to fetch single group data',
			error: e,
		});

		return res.status(500);
	}
}

export async function joinGroup(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { groupId } = req.params as { groupId: UUID };
		const { userId } = req.currentUser;

		if (!groupId || !userId) {
			throw new Error('Not enough data to join group');
		}

		// request permissions for the user
		const group = new Groups(req, groupId);

		const status = await group.getStatus();
		const approvalType = await group.getApprovalType();

		if (
			status === GroupStatus.closed ||
			approvalType === GroupApprovalType.never
		) {
			throw new Error('Group is closed!');
		} else if (status === GroupStatus.private) {
			// does the user have permission to join this group?
			// i.e. do they have permissions to verify themselves on the group
			// or on a group above it
			return res.sendStatus(403).json({ result: 'private' });
		}

		const success = await group.requestMembership(
			userId,
			GroupRoleType.USER
		);

		if (success && approvalType === GroupApprovalType.auto) {
			// also approve the user now
			await group.confirmMembership(userId, GroupRoleType.USER);

			return res.status(200).json({ result: 'joined' });
		} else if (success) {
			// TODO: notify group admins
			return res.status(201).json({ result: 'requested' });
		}

		return res.sendStatus(500);
	} catch (e) {
		handleError({
			message: 'Could not join group.',
			error: e,
		});

		return res.sendStatus(500);
	}
}

export async function getGroupMembersForRole(
	req: IReq,
	res: IRes
): Promise<IRes> {
	const { groupId, role } = req.params as {
		groupId: UUID;
		role: GroupRoleType;
	};

	let permissionsNeeded: PermissionType[] = [];

	if (role === GroupRoleType.ADMIN) {
		permissionsNeeded.push(...cGroupRoles.USER);
	} else if (role === GroupRoleType.MOD) {
		permissionsNeeded.push(...cGroupRoles.MOD);
	} else if (role === GroupRoleType.USER) {
		permissionsNeeded.push(...cGroupRoles.USER);
	}

	if (!permissionsNeeded.length) {
		return res.sendStatus(403);
	}

	try {
		try {
			const permissionManager = new UserPermissions(
				req,
				req.currentUser.userId
			);

			const { success } = await permissionManager.validateMultiple(
				permissionsNeeded,
				groupId
			);

			if (!success) {
				throw new Error('Not authorized');
			}
		} catch (e) {
			return res.sendStatus(403);
		}

		const group = new Groups(req, groupId);

		const users = await group.getGroupMembers(role);

		return res.status(200).json(users);
	} catch (e) {
		handleError({
			message: 'Failed to get members of ${groupId} for role ${role}',
		});
	}
}

export async function changeToRole(req: IReq, res: IRes): Promise<IRes> {
	const { role, userId, groupId } = req.query as {
		role: GroupRoleType | undefined;
		userId: UUID;
		groupId: UUID;
	};

	try {
		// check that this user can change roles on this group
		const permissionHandler = new UserPermissions(req, userId);

		try {
			await permissionHandler.validateMultiple(
				cGroupRoles.ADMIN,
				groupId
			);
		} catch (e) {
			return res.sendStatus(403);
		}

		// the user is able to set roles, so let's get started
		// first we must REVOKE any existing roles in case of demotion
		for await (const typeToRevoke of cGroupRoles.ADMIN) {
			await permissionHandler.suspendPermission(
				typeToRevoke,
				userId,
				groupId
			);
		}

		// if no new role, the user has all their group role permissions revoked
		if (role) {
			const groupHandler = new Groups(req, groupId);

			await groupHandler.requestMembership(userId, role);
			// confirm immediately
			await groupHandler.confirmMembership(userId, role);
		}

		return res.sendStatus(200);
	} catch (e) {
		handleError({
			message: `Cannot change role to ${role} for user ${userId} on group ${groupId}`,
		});
	}
}
