import express from 'express';
import cors from 'cors';
import { config as configureEnv } from 'dotenv';
import { setUserInReq } from '../app';
import {
	addCommunicationInScope,
	getCommunicationsInScope,
} from '../controllers/communications';

const communications = express.Router();

configureEnv();

communications.use(
	cors({
		origin: process.env.UI_ORIGIN_URL,
	})
);

communications.use(setUserInReq);

communications.post('/messages', getCommunicationsInScope);
communications.post('/sendMessage', addCommunicationInScope);

export default communications;
