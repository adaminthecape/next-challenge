import axios from 'axios';
import { UUID } from 'crypto';
import Cookies from 'js-cookie';
import { setCookie, getCookie } from 'cookies-next';

// TODO: move to .env
const apiUrl = 'http://localhost:4000';

export const getUrl = (endpoint: string) =>
	`${apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

type CustomOptions = {
	jwt?: string;
};

async function apiRequest(
	method: 'get' | 'post',
	url: string,
	params?: Record<string, any>,
	opts?: CustomOptions
): Promise<any> {
	const urlToUse = `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;

	try {
		const token = opts?.jwt || Cookies.get('jwt');

		if (!token) {
			console.warn(`Token not available! (${method} - ${url})`);
			return undefined;
		}

		let data;

		if (method === 'get') {
			data = (
				await axios.get(urlToUse, {
					headers: { Authorization: `Bearer ${token}` },
				})
			)?.data;
		} else if (method === 'post') {
			data = (
				await axios.post(urlToUse, params, {
					headers: { Authorization: `Bearer ${token}` },
					params,
				})
			)?.data;
		}

		return data;
	} catch (e) {
		// TODO: add error handling
		console.warn('Axios ERROR:', e);
		return undefined;
	}
}

export async function get(url: string, opts?: CustomOptions): Promise<any> {
	return apiRequest('get', url, undefined, opts);
}

export async function post(
	url: string,
	params?: Record<string, any>,
	opts?: CustomOptions
): Promise<any> {
	return apiRequest('post', url, params, opts);
}

export async function login(
	username: string,
	password: string
): Promise<
	| undefined
	| {
			token: string;
			id: string;
			name: string;
			email?: string;
	  }
> {
	const url = `/login/${username}/${password}`;
	const urlToUse = `${apiUrl}${url}`;

	try {
		const { data } = await axios.get(urlToUse);

		// console.log('LOGIN:', data);

		// if (data?.token) {
		// 	Cookies.set('jwt', data.token);
		// 	Cookies.set('userId', data.id);
		// 	setCookie('jwt', data.token, { maxAge: 60 * 6 * 24 });
		// 	setCookie('userId', data.id, { maxAge: 60 * 6 * 24 });
		// }

		// console.log('STORED:', getCookie('userId'), getCookie('jwt'));

		return data;
	} catch (e) {
		console.error(e);
		return undefined;
	}
}
