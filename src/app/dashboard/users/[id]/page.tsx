'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import Link from 'next/link';
import useSWR from 'swr';

export default function ManageUser({ params: { id } }) {
	// const { data, error, isLoading } = useSWR('/login/downstream', (url) =>
	// 	post(url, {
	// 		status: 2,
	// 		pagination: {
	// 			page: 1,
	// 			limit: 20,
	// 		},
	// 	})
	// );

	console.log('Manage:', id);

	const loginStatusText = {
		0: 'Banned',
		1: 'Unverified',
		2: 'Active',
	};

	// TODO: Replace with standardized error/loading components
	// if (error) return <div>failed to load</div>;
	// if (isLoading) return <div>Loading...</div>;

	return (
		<div>
			<h2>DASHBOARD - MANAGE USER</h2>
			<div className='overflow-x-auto'>
				<table className='table'>
					<thead>
						<tr>
							<th>
								<label>
									<input
										type='checkbox'
										className='checkbox'
									/>
								</label>
							</th>
							<th>Username</th>
							<th>Join date</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>{id}</tbody>
				</table>
			</div>
		</div>
	);
}
