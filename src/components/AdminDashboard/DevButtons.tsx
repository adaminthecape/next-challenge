'use client';
import { post } from '@/api';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import Cookies from 'js-cookie';

export default function DevButtons() {
	let responseData;

	async function test(url: string, extra?: Record<string, any>) {
		const params = extra
			? { ...extra, limit: limit || 10 }
			: {
					limit: limit || 10,
			  };
		responseData = (await post(url, params))?.data;
	}

	function clearCookiesAndSignOut() {
		Cookies.remove('client-jwt');

		signOut();
	}

	const [limit, setLimit] = useState();

	return (
		<div>
			Testing endpoints:
			<input
				type='number'
				placeholder='Batch amount (10)'
				className='btn btn-sm m-1'
				onClick={(e) => setLimit(e.currentTarget.value)}
			/>
			<br />
			<button
				className='btn btn-sm m-1'
				onClick={() => test('/dev/createUsers')}
			>
				add users
			</button>
			<button
				className='btn btn-sm m-1'
				onClick={() => test('/dev/verifyUsers')}
			>
				verify users
			</button>
			<button
				className='btn btn-sm m-1'
				onClick={() => test('/dev/createGroups')}
			>
				add groups
			</button>
			<button
				className='btn btn-sm m-1'
				onClick={() => test('/dev/joinGroups')}
			>
				join groups
			</button>
			<button
				className='btn btn-sm m-1'
				onClick={() =>
					test('/dev/joinGroups', {
						userIds: ['22211951-7c9a-4bec-9540-c5d26fbcdd49'],
					})
				}
			>
				join groups (su only)
			</button>
			<button
				className='btn btn-sm m-1'
				onClick={() => test('/dev/createComms')}
			>
				add communications
			</button>
			<button
				className='btn btn-sm m-1'
				onClick={() => clearCookiesAndSignOut()}
			>
				clear cookies & sign out
			</button>
			<pre>{JSON.stringify(responseData, undefined, 2)}</pre>
		</div>
	);
}
