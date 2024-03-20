import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import { getScopedPermissions } from '../controllers/permission';
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

export default permission;
