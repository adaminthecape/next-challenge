import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import {
	authenticateUser,
	getActiveLogins,
	registerUser,
	updateLoginState,
} from '../controllers/login';
import { setUserInReq } from '../app';

const login = express.Router();

configureEnv();

login.use(
	cors({
		origin: process.env.UI_ORIGIN_URL,
	})
);

/**
 * This endpoint lets a user log in, if they have valid credentials.
 */
login.get('/:username/:password', authenticateUser);

/**
 * This endpoint creates a login stub for a prospective user. The user will
 * remain unverified until an admin manually approves them.
 */
login.post('/create/:username/:password', registerUser);

login.post('/downstream', setUserInReq, getActiveLogins);

login.post('/verify', setUserInReq, updateLoginState);

export default login;
