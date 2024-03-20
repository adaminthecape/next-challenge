// declare types for db tables & their fields

import { config as configureEnv } from 'dotenv';
import { IReq } from '../../sharedTypes';
import * as mysql from 'mysql2/promise';
import { handleError } from '../utils';

export type UUID = `${string}-${string}-${string}-${string}`;

/**
 * A UserRole represents their permission level.
 * If the current user's UserRole is less than the specified UserRole,
 * they are not allowed to execute the given action.
 */
export enum UserRole {
	'SuperAdmin' = 99,
	'PlatformAdmin' = 90,
	'Admin' = 10,
	'Leader' = 1,
	'User' = 0,
}

export namespace DbRow {
	export interface UserRoles {
		id: number;
		role: UserRole;
	}

	export interface User {
		id: number;
		userId: UUID;
		profileData: Record<string, any>;
	}
}

export class Database {
	public static async getInstance(req: IReq): Promise<Database> {
		if (req.db) {
			return req.db;
		}

		const instance = new Database(req);

		await instance.connect();

		req.db = instance;

		return req.db;
	}

	private req: IReq;
	private connection: mysql.Connection | undefined;

	constructor(req: IReq) {
		this.req = req;
	}

	public async release() {
		if (this.connection) {
			this.connection.end();
		}
	}

	private async connect(): Promise<void> {
		try {
			configureEnv();

			this.connection = await mysql.createConnection({
				host: process.env.MYSQL_DB_HOST,
				port: Number(process.env.MYSQL_DB_PORT),
				user: process.env.MYSQL_DB_USER,
				password: process.env.MYSQL_DB_PASS,
				database: process.env.MYSQL_DB_NAME,
			});

			await this.connection.connect();
		} catch (e) {
			handleError({
				message: 'DB Connect ERROR',
				error: e,
			});
		}
	}

	public async getFormattedQuery(query: string, params: any[]) {
		return this.connection?.format(query, params);
	}

	public async query1r(
		queryString: string,
		params: any[] = []
	): Promise<any> {
		if (!queryString.includes('LIMIT')) {
			queryString += ' LIMIT 1';
		}

		const parent = await this.query(queryString, params);

		return parent?.[0];
	}

	private async query(
		queryString: string,
		params: any[] = [],
		returnAffected?: boolean
	): Promise<any> {
		if (!this.connection) {
			console.warn('DB query ERROR: No connection!');
			return undefined;
		}

		try {
			// if (returnAffected) {
			// 	const [_, resultData] = await this.connection.query(
			// 		this.connection.format(queryString, params)
			// 	);

			// 	return resultData?.affectedRows;
			// }

			const resultData = await this.connection.query(
				this.connection.format(queryString, params)
			);

			return resultData?.[0];
		} catch (e) {
			handleError({
				message: 'DB query ERROR',
				error: e,
			});

			return undefined;
		}
	}

	public async insert(
		query: `INSERT ${string}`,
		params: any[] = []
	): Promise<void> {
		if (!query.startsWith('INSERT ')) {
			handleError({
				message: 'DB query ERROR',
				throw: new Error(`Not an insert query! ${query}`),
			});
		}

		await this.query(query, params);
	}

	public async update(
		query: `UPDATE ${string}`,
		params: any[] = []
	): Promise<void> {
		if (!query.startsWith('UPDATE ')) {
			handleError({
				message: 'DB query ERROR',
				throw: new Error(`Not an update query! ${query}`),
			});
		}

		await this.query(query, params);
	}

	public async select(
		query: `SELECT ${string}`,
		params: any[] = []
	): Promise<any> {
		if (!query.startsWith('SELECT ')) {
			handleError({
				message: 'DB query ERROR',
				throw: new Error(`Not a select query! ${query}`),
			});

			return undefined;
		}

		return this.query(query, params);
	}
}
