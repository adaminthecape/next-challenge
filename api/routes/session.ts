import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import {
	getSession,
	createSession,
	validateSession,
} from '../controllers/session';
import { setUserInReq } from '../app';

const session = express.Router();

configureEnv();

session.use(
	cors({
		origin: process.env.UI_ORIGIN_URL,
	})
);

session.use(setUserInReq);

session.get('/validate', validateSession);
session.get('/current/:userId', getSession);

session.get('/create/:userId', createSession);

export default session;
