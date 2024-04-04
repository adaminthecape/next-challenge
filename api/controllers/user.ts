// Get the user's profile
// Get the user's permissions
// Get the user's communications

import { IReq, IRes } from '../../sharedTypes';
import { LoginManager } from '../models/Login';

export async function getAllUserData(req: IReq, res: IRes): Promise<IRes> {
	// Validate each permission along the way
	// A user may retrieve all of his/her OWN data, but not others unless auth'd
}
