import { UUID } from 'crypto';
import { IReq, IRes } from '../../sharedTypes';
import { handleError } from '../utils';
import { Communications } from '../models/Communications';
import { PermissionType, validatePermission } from '../models/Permissions';

export async function getCommunicationsInScope(
	req: IReq,
	res: IRes
): Promise<IRes> {
	const { scope, from, to, pagination } = req.query as {
		scope: UUID;
		from: UUID;
		to: UUID;
		pagination?: any;
	};

	try {
		// Validate that the user can read these communications
		await validatePermission(
			req,
			req.currentUser.userId,
			PermissionType.COMMUNICATIONS_READ,
			scope
		);
	} catch (e) {
		return res.status(403).json({ communications: [], total: 0, page: 1 });
	}

	try {
		const handler = new Communications(req, req.currentUser.userId, scope);

		const data = await handler.getCommunications({
			scope,
			from,
			to,
			pagination,
		});

		return res.status(200).json(data);
	} catch (e) {
		handleError({
			message: 'Could not get communications for scope ' + scope,
			error: e,
		});

		return res.status(500).json({ communications: [], total: 0, page: 1 });
	}
}

export async function addCommunicationInScope(
	req: IReq,
	res: IRes
): Promise<IRes> {
	const { to, message, scope } = req.query as {
		scope: UUID;
		to: UUID;
		message: string;
	};
	const { userId: from } = req.currentUser;

	try {
		const handler = new Communications(req, from, scope);

		await handler.addCommunication(to, message, scope);

		return res.status(200);
	} catch (e) {
		handleError({
			message: 'Could not send communication',
		});

		return res.sendStatus(500);
	}
}
