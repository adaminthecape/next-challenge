import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import { setUserInReq } from '../app';
import { getAllUserData } from '../controllers/user';

const user = express.Router();

configureEnv();

user.use(
	cors({
		origin: process.env.UI_ORIGIN_URL,
	})
);

user.use(setUserInReq);

user.get('/allData/:userId', getAllUserData);

export default user;
