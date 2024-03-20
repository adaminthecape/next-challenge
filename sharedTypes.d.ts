import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from './api/models/Database';

export type IReq = NextApiRequest & {
	db?: Database;
	currentUser?: any;
	ipAddress?: any;
	params?: Record<string, any>;
};

export type IRes = any;

export enum GroupStatus {
	closed = 'closed',
	private = 'private',
	public = 'public',
}

export interface GroupRow {
	groupId?: UUID;
	scope: UUID;
	name: string;
	createdBy?: UUID;
	createdAt?: number;
	status: GroupStatus;
	json?: Record<string, any>;
}
