import { IReq, IRes } from '../../sharedTypes';
import { UserPermissions } from '../models/Permissions';
import { handleError } from '../utils';

export async function getScopedPermissions(
	req: IReq,
	res: IRes
): Promise<IRes> {
	const { username, scope, pagination } = req.query as any;

	console.log({ username, scope, pagination });

	try {
		const data = await UserPermissions.getPermissionsList(req, {
			userId: '222' as any,
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
