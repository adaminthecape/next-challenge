import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import { setUserInReq } from '../app';
import {
	addGroup,
	changeToRole,
	getGroupMembersForRole,
	getPageOfGroups,
	getSingleGroupData,
	joinGroup,
} from '../controllers/groups';

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
groups.post('/convertToUser', changeToRole);
groups.post('/convertToMod', changeToRole);
groups.post('/convertToAdmin', changeToRole);

groups.get('/join/:groupId', joinGroup);
groups.get('/single/:groupId', getSingleGroupData);
groups.get('/members/:groupId/:role', getGroupMembersForRole);

export default groups;
