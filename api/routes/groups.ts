import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import { setUserInReq } from '../app';
import { addGroup, getPageOfGroups } from '../controllers/groups';

const groups = express.Router();

configureEnv();

groups.use(
	cors({
		origin: process.env.UI_ORIGIN_URL,
	})
);

groups.use(setUserInReq);

groups.post('/list', getPageOfGroups);
groups.post('/add', addGroup);

export default groups;
