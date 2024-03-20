import { IReq } from '../../sharedTypes';
import { Database, UUID } from '../models/Database';
import { handleError } from '../utils';

/**
 * JSON data to represent any free-form data users may have.
 * This could/should be properly typed, but not specifying it here allows
 * rapid prototyping & manipulation of user data for demo purposes.
 */
export interface ProfileData {
	[key: string]: any;
}

export class Profile {
	public static async getInstance(req: IReq, userId: UUID): Promise<any> {
		// fetch the user's profile data
		const instance = new Profile(req, userId);

		await instance.getData();

		return instance;
	}

	private req: IReq;
	private userId: UUID;
	public profileData: ProfileData = {};

	constructor(req: IReq, userId: UUID) {
		this.req = req;
		this.userId = userId;
	}

	public async doesProfileExist(): Promise<boolean> {
		const db = await Database.getInstance(this.req);

		const userId = (
			await db.query1r('SELECT userId FROM profiles WHERE userId = ?', [
				this.userId,
			])
		)?.userId;

		return !!userId;
	}

	public async createProfileStub(): Promise<void> {
		if (await this.doesProfileExist()) {
			return;
		}

		const db = await Database.getInstance(this.req);

		await db.insert(
			`INSERT INTO profiles (userId, updatedAt, json)
            VALUES (?, ?, JSON_OBJECT())`,
			[this.userId, Date.now()]
		);
	}

	public async getData(): Promise<ProfileData | undefined> {
		const db = await Database.getInstance(this.req);

		try {
			const data = await db.query1r(
				'SELECT CAST(`json` AS JSON) FROM profiles WHERE userId = ?',
				[this.userId]
			);

			console.log('User', this.userId, 'has data:', typeof data, data);

			if (data) {
				this.profileData = data;

				return data;
			}
		} catch (e) {
			handleError({
				message: `Could not retrieve profile for user ${this.userId}`,
				error: e,
			});
		}

		return undefined;
	}

	/**
	 * Merge the user's current JSON data with any incoming mutations.
	 * This could be more efficient by setting data by JSON path instead of
	 * merging the entire profile.
	 * TODO: Optimize this if needed for larger scale
	 * @param mutations
	 * @returns
	 */
	public async setData(mutations: Record<string, any>): Promise<void> {
		const db = await Database.getInstance(this.req);

		try {
			const currentData: { json: ProfileData } = (
				await db.query1r(
					`SELECT CAST(\`json\` AS JSON) AS json
                    FROM profiles WHERE userId = ?`,
					[this.userId]
				)
			)?.json;

			console.log(
				'User',
				this.userId,
				'has currentData:',
				typeof currentData,
				currentData
			);

			// This should use a better merge strategy, e.g. deepClone
			const newData = {
				...(currentData || {}),
				...mutations,
			};

			await db.update(
				`UPDATE profiles SET
                    json = JSON_SET(json, "$", ?),
                    updatedAt = ?
                WHERE userId = ? LIMIT 1`,
				[JSON.stringify(newData), Date.now(), this.userId]
			);
		} catch (e) {
			handleError({
				message: `Could not update profile for user ${this.userId}`,
				error: e,
			});
		}

		return undefined;
	}
}
