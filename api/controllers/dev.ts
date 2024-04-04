import { UUID } from 'crypto';
import { IReq, IRes } from '../../sharedTypes';
import { Database } from '../models/Database';
import { LoginManager, LoginStatus } from '../models/Login';
import { faker } from '@faker-js/faker';
import { PermissionType } from '../models/Permissions';
import { Communications } from '../models/Communications';
import {
	GroupApprovalType,
	GroupRoleType,
	GroupRow,
	Groups,
	GroupStatus,
} from '../models/Groups';

async function getRandomLogins(req: IReq, limit?: number | string) {
	const db = await Database.getInstance(req);

	limit = limit ? parseInt(String(limit), 10) : 10;

	const numUsers = await db.query1(
		`SELECT COUNT(userId) FROM logins WHERE status = ?`,
		[LoginStatus.Active]
	);

	const offset = Math.floor(
		Math.random() * (numUsers - parseInt(String(limit), 10))
	);

	const userIds = (
		await db.select(
			`SELECT userId FROM logins WHERE status = ? LIMIT ? OFFSET ?`,
			[LoginStatus.Active, parseInt(String(limit), 10), offset]
		)
	).map((u: { userId: UUID }) => u.userId);

	return userIds;
}

async function getRandomGroups(
	req: IReq,
	limit?: number | string,
	filters?: Record<string, any>
) {
	limit = limit ? parseInt(String(limit), 10) : 10;

	const groupIds = (
		await Groups.getPageOfGroups(req, {
			status: [GroupStatus.public],
			scope: 'any',
			pagination: {
				page: Math.floor(Math.random() * 20),
				limit: Math.floor(Math.random() * limit),
			},
			...(filters || {}),
		})
	)?.groups?.map((group: any) => group.groupId);

	return groupIds;
}

export async function testCreateUsers(req: IReq, res: IRes): Promise<IRes> {
	const { limit: num } = req.query;

	const password = 'password1';
	const map: any = {};

	for await (const key of [...Array(parseInt(String(num), 10))].keys()) {
		const username = `${faker.person
			.firstName()
			.toLowerCase()}.${faker.person.lastName().toLowerCase()}`;

		const success = await LoginManager.createLogin(req, username, password);

		if (success) {
			console.log('(dev) Successfully created test user ' + username);
		}

		map[username] = success;
	}

	return res.status(200).json(map);
}

export async function testVerifyUsers(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { limit } = req.query;

		const map: any = {};
		const db = await Database.getInstance(req);

		const userIds = (
			await db.select(
				`SELECT userId FROM logins WHERE status = ? LIMIT ?`,
				[LoginStatus.Unverified, parseInt(String(limit), 10)]
			)
		)?.map((u: { userId: UUID }) => u.userId);

		for await (const userId of userIds) {
			const success = await LoginManager.changeLoginStatus(
				req,
				userId,
				LoginStatus.Active
			);

			if (success) {
				console.log('(dev) Successfully verified test user ' + userId);
			}

			map[userId] = success;
		}

		return res.status(200).json(map);
	} catch (e) {
		return res.sendStatus(500);
	}
}

export async function testCommunicateInAllowedScopes(
	req: IReq,
	res: IRes
): Promise<IRes> {
	const { limit } = req.query as any;

	const db = await Database.getInstance(req);
	const map: any = {};

	const userIds = await getRandomLogins(req, limit);

	for await (const userId of userIds) {
		// find a scope where this user can communicate
		const scopes = (
			await db.query(
				`SELECT scope FROM permissionsMap WHERE permissionType = ? AND userId = ? LIMIT 10`,
				[
					PermissionType.COMMUNICATIONS_CREATE,
					userId,
					// parseInt(String(limit), 10),
				]
			)
		)?.map((x: any) => x.scope);

		for await (const scope of scopes) {
			if (scope) {
				// create a communication in this scope
				const comms = new Communications(req, userId, scope);

				const message = `${faker.lorem.sentence(
					Math.floor(Math.random() * 20)
				)}`;

				await comms.addCommunication(undefined, message, scope);

				console.log(
					`(dev) User ${userId} added message in scope ${scope}`
				);

				await new Promise((r) => setTimeout(r, 100));
			}
		}
	}

	return res.status(200).json(map);
}

export async function testCreateGroups(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { limit } = req.query as any;

		const map: any = {};

		const userIds = await getRandomLogins(req, limit);

		const groupIds = await getRandomGroups(req, limit);

		for await (const userId of userIds) {
			const groupData: GroupRow = {
				createdBy: userId,
				scope: groupIds[Math.floor(Math.random() * groupIds.length)],
				// 25% chance to use a country name
				name:
					Math.random() < 0.25
						? `Country of ${faker.location.country()}`
						: `${faker.location.cardinalDirection()} ${faker.animal.bear()} ${
								faker.science.chemicalElement().name
						  } Experimenters`,
				// 5% chance to make the group private
				status:
					Math.random() > 0.05
						? GroupStatus.public
						: GroupStatus.private,
				// 25% chance to be auto acceptance
				approvalType:
					Math.random() > 0.25
						? GroupApprovalType.manual
						: GroupApprovalType.auto,
				jsonData: {
					description: faker.word.words(
						Math.floor(Math.random() * 12)
					),
				},
			};

			const newGroupId = await Groups.addGroup(req, groupData);

			// then make the creator an admin
			const groupHandler = new Groups(req, newGroupId);

			await groupHandler.requestMembership(userId, GroupRoleType.ADMIN);

			// 5% chance to not be immediately accepted
			if (Math.random() > 0.05) {
				await groupHandler.confirmMembership(
					userId,
					GroupRoleType.ADMIN
				);
			}

			console.log(`(dev) User ${userId} added group ${newGroupId}`);
		}

		return res.status(200).json(map);
	} catch (e) {
		return res.sendStatus(500);
	}
}

export async function testJoinGroups(req: IReq, res: IRes): Promise<IRes> {
	try {
		const { limit, userIds: customUserIds } = req.query as any;

		const map: any = {};

		const userIds = customUserIds || (await getRandomLogins(req, 10));

		for await (const userId of userIds) {
			const groupIds = await getRandomGroups(req, limit, {
				userIsNotMember: true,
			});

			for await (const groupId of groupIds) {
				// join the group
				const groupHandler = new Groups(req, groupId);

				await groupHandler.requestMembership(
					userId,
					GroupRoleType.USER
				);
				const success = await groupHandler.confirmMembership(
					userId,
					GroupRoleType.USER
				);

				if (success) {
					console.log(`(dev) User ${userId} joined group ${groupId}`);

					map[groupId] = userId;
				} else {
					console.log('(dev) FAILED TO JOIN GROUP', groupId, userId);
				}
			}
		}

		return res.status(200).json(map);
	} catch (e) {
		return res.sendStatus(500);
	}
}
