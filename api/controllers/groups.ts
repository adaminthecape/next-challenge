import { UUID } from 'crypto';
import { IReq, IRes } from '../../sharedTypes';
import {
	cGroupRoles,
	GroupApprovalType,
	GroupRoleType,
	Groups,
	GroupStatus,
} from '../models/Groups';
import {
	PermissionStatus,
	PermissionType,
	UserPermissions,
} from '../models/Permissions';
import { handleError } from '../utils';

export async function getPageOfGroups(req: IReq, res: IRes): Promise<IRes> {
	// validate that user can see groups in scope
	try {
		const { name, scope, pagination, userId, status, approvalType } =
			req.query as any;

		const data = await Groups.getPageOfGroups(req, {
			name,
			scope,
			userId,
			status,
			pagination,
			approvalType,
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

		await group.requestRole(userId, GroupRoleType.ADMIN);
		await group.assignRole(userId, GroupRoleType.ADMIN);

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
		} else if (approvalType === GroupApprovalType.auto) {
			// does the user have permission to join this group?
			// i.e. do they have permissions to verify themselves on the group
			// or on a group above it
		}

		const success = await group.requestRole(userId, GroupRoleType.USER);

		if (success && approvalType === GroupApprovalType.auto) {
			// also approve the user now
			await group.assignRole(userId, GroupRoleType.USER);
		} else if (success) {
			// TODO: notify group admins
			return res.status(201).json({ result: 'requested' });
		}

		if (success) {
			return res.status(200).json({ result: 'joined' });
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
