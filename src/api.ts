import axios, { AxiosError } from 'axios';
import { UUID } from 'crypto';
import Cookies from 'js-cookie';
import { setCookie, getCookie } from 'cookies-next';
import toast from 'react-hot-toast';

// TODO: move to .env
export const apiUrl = 'http://localhost:4000';

export const getUrl = (endpoint: string) =>
	`${apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

type CustomOptions = {
	jwt?: string;
	debug?: boolean;
};

async function apiRequest(
	method: 'get' | 'post',
	url: string,
	params?: Record<string, any>,
	opts?: CustomOptions
): Promise<any> {
	const urlToUse = `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;

	const debug = (...msgs: any) => {
		if (opts?.debug) {
			console.log('(api.ts)', ...msgs);
		}
	};

	try {
		const token = opts?.jwt || Cookies.get('client-jwt');

		if (!token) {
			console.warn(`Token not available! (${method} - ${url})`);
			return { data: undefined, status: 403 };
		}

		const config = {
			headers: { Authorization: `Bearer ${token}` },
		};

		debug('fetching...', urlToUse, config);

		let data;

		try {
			if (method === 'get') {
				data = await axios.get(urlToUse, config);
				// data = await fetch(urlToUse, config);
			} else if (method === 'post') {
				data = await axios.post(urlToUse, params, {
					...config,
					params,
				});
			}
		} catch (e: any) {
			console.warn(e);

			return {
				data: undefined,
				error: e,
				status: e.response?.status || 500,
			};
		}

		debug('done fetching', urlToUse, data?.status, data);

		if (data?.status === 403) {
			toast.error('Not authorized!');
		}

		return { data: data?.data, status: data?.status };
	} catch (e: any) {
		// TODO: add error handling
		console.warn('Axios ERROR:', e);

		if (e?.response?.code === 403) {
			toast.error('Not authorized! ' + e.message);
		}

		return { data: undefined, error: e, status: 500 };
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
		const { data, headers } = await axios.get(urlToUse);

		console.log('LOGIN:', data);

		if (data?.token) {
			Cookies.set('jwt', data.token);
			Cookies.set('userId', data.id);
		}

		console.log('STORED 1:', Cookies.get('userId'), Cookies.get('jwt'));

		if (data?.token) {
			setCookie('jwt', data.token, { maxAge: 60 * 6 * 24 });
			setCookie('userId', data.id, { maxAge: 60 * 6 * 24 });
		}

		console.log('STORED 2:', getCookie('userId'), getCookie('jwt'));

		return { ...data, headers };
	} catch (e) {
		console.error(e);
		return undefined;
	}
}
