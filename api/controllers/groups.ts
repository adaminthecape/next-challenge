import { IReq, IRes } from '../../sharedTypes';
import { Groups } from '../models/Groups';
import { handleError } from '../utils';

export async function getPageOfGroups(req: IReq, res: IRes): Promise<IRes> {
	// validate that user can see groups in scope
	try {
		const { name, scope, pagination, userId, status } = req.query as any;

		const data = await Groups.getPageOfGroups(req, {
			name,
			scope,
			userId,
			status,
			pagination,
		});

		console.log('Group data:', data);

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
		const { name, scope, status } = req.query as any;

		const data = await Groups.addGroup(req, {
			name,
			scope,
			createdBy: userId,
			status,
		});

		console.log('Group data:', data);

		return res.status(200).json(data);
	} catch (e) {
		handleError({
			message: 'Failed to retrieve groups.',
			error: e,
		});

		return res.status(500).json({ groups: [], total: 0 });
	}
}
