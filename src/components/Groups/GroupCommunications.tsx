'use client';

import { post } from '@/api';
import { UUID } from 'crypto';
import {
	ArrowDownNarrowWideIcon,
	MessageCircle,
	MessageSquareDashedIcon,
} from 'lucide-react';
import useSWR from 'swr';

export default function GroupCommunications({ groupId }: { groupId: UUID }) {
	const { data, error, isLoading } = useSWR(
		'/communications/messages',
		(url) =>
			post(url, {
				scope: groupId,
				pagination: {
					page: 1,
					limit: 200,
				},
			})
	);

	// if (communicationsStatus === 200) {
	// 	setTimeout(async () => {
	// 		console.log('re-fetching comms');
	// 		communications = (
	// 			await post(
	// 				`/communications/messages`,
	// 				{
	// 					scope: groupId,
	// 					pagination: {
	// 						page: 1,
	// 						limit: 20,
	// 					},
	// 				},
	// 				{
	// 					jwt: user?.jwt,
	// 				}
	// 			)
	// 		)?.data;
	// 	}, 1000);
	// }

	if (isLoading) {
		return <div className='pt-2'>Loading messages...</div>;
	}

	if (error) {
		return <div>Error loading messages!</div>;
	}

	if (data) {
		return (
			<div style={{ position: 'relative' }}>
				{data?.data?.communications ? (
					<button
						style={{ position: 'absolute', bottom: 30, right: 40 }}
						className='btn btn-md'
						onClick={() => {
							document
								.getElementById('group-chat-container')
								?.scrollBy(0, 1e6);
						}}
					>
						<ArrowDownNarrowWideIcon />
					</button>
				) : (
					''
				)}
				{/* <pre>Data: {JSON.stringify(data, undefined, 2)}</pre> */}
				<div
					id='group-chat-container'
					className='mt-4 mb-4'
					style={{
						maxHeight: '50vh',
						overflowX: 'hidden',
						overflowY: 'scroll',
					}}
				>
					{data.data?.communications?.map((comm: any) => (
						<div
							key={`communication-${comm.id}`}
							className='mb-2'
						>
							<div
								role='alert'
								className='alert shadow-lg'
							>
								<MessageSquareDashedIcon />
								<div>
									<h3 className='font-bold'>
										{comm.fromUsername}
										{comm.toUsername
											? ` -> ${comm.toUsername}`
											: ''}
									</h3>
									<h4 className='text-sm'>
										{new Date(
											comm.createdAt
										).toDateString()}{' '}
										{
											new Date(comm.createdAt)
												.toTimeString()
												.split(' ')[0]
										}
									</h4>
									<div className='text-sm'>
										{comm.message}
									</div>
								</div>
								{/* <button className='btn btn-sm'>See</button> */}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}
}
