import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import {
	getScopedPermissions,
	approvePermission,
	validatePermissions,
} from '../controllers/permission';
import { setUserInReq } from '../app';

const permission = express.Router();

configureEnv();

permission.use(
	cors({
		origin: process.env.UI_ORIGIN_URL,
	})
);

permission.use(setUserInReq);

/**
 * Returns a list of permissions in the given scope.
 */
permission.post('/list', getScopedPermissions);
permission.post('/verify', approvePermission);
permission.post('/validate', validatePermissions);

export default permission;
