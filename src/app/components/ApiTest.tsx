'use client';
import { Button } from '@/components/ui/button';

import { get, login } from '../../api';

export default function ApiTest() {
	async function testApi(): Promise<void> {
		const userId = '22211951-7c9a-4bec-9540-c5d26fbcdd49';
		await get(`/session/current/${userId}`);
	}

	async function testDb(): Promise<void> {
		// const res = await apiRequest('/login/adam/password1');
		try {
			// const res = await apiRequest('/login/adam/password1');
			const res = await login('adam', 'password1');

			console.log('TEST:', res);
		} catch (e) {
			console.warn('error??', e);
		}
	}

	const buttonStyle = {
		margin: '0.5rem',
		padding: '0.5rem',
		border: '1px solid #aaa',
	};

	return (
		<div className='row'>
			<Button>Button</Button>
			<button
				style={buttonStyle}
				onClick={testApi}
			>
				Test API
			</button>
			<button
				style={buttonStyle}
				onClick={testDb}
			>
				Test DB
			</button>
		</div>
	);
}
