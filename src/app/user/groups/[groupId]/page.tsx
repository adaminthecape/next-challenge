import { get, post } from '@/api';
import AddGroupDialog from '@/components/Groups/AddGroupDialog';
import GroupsTable from '@/components/Groups/GroupsTable';
import SendMessage from '@/components/SendMessage';
import { getServerUser } from '@/lib/auth';
import { UUID } from 'crypto';
import { MessageCircle } from 'lucide-react';

export default async function ViewGroup({
	params: { groupId },
}: {
	params: { groupId: UUID };
}) {
	const user = await getServerUser();

	const { data } = await get(`/groups/single/${groupId}`, {
		jwt: user?.jwt,
	});

	let { data: communications } = await post(
		`/communications/messages`,
		{
			scope: groupId,
			pagination: {
				page: 1,
				limit: 20,
			},
		},
		{
			jwt: user?.jwt,
		}
	);

	if (!communications) communications = { communications: [], total: 0 };

	console.log('communications:', communications);

	if (communications?.total) {
		console.log('Group has', communications.total, 'communications!');
	}

	if (!data) {
		return <div>No data!</div>;
	}

	return (
		<div>
			<div>
				Viewing a single group: <b>{data.name}</b>
			</div>
			{/* <pre>{JSON.stringify(data, undefined, 2)}</pre> */}
			{data.scope && <div>In {data.parentName}</div>}
			<div className='mb-4'>
				Created {new Date(data.createdAt).toDateString()} by{' '}
				{data.createdByName}
			</div>
			{communications.total ? (
				<div
					className='mt-4 mb-4'
					style={{
						maxHeight: '50vh',
						overflowX: 'hidden',
						overflowY: 'scroll',
					}}
				>
					{communications.communications.map((comm: any) => (
						<div
							key={`communication-${comm.id}`}
							className='mb-2'
						>
							<div
								role='alert'
								className='alert shadow-lg'
							>
								<MessageCircle />
								<div>
									<h3 className='font-bold'>
										{comm.fromUsername}
										{comm.toUsername
											? ` -> ${comm.toUsername}`
											: ''}
									</h3>
									<div className='text-sm'>
										{comm.message}
									</div>
								</div>
								<button className='btn btn-sm'>See</button>
							</div>
						</div>
					))}
				</div>
			) : (
				''
			)}
			<SendMessage scope={groupId} />
			{data.hasSubgroups ? (
				<div className='mt-4'>
					<GroupsTable
						searchParams={{ page: 1, scope: groupId, limit: 100 }}
						hidePagination
						hideTopBar
					/>
				</div>
			) : (
				''
			)}
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
				}}
				className='mt-8'
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						flexDirection: 'column',
					}}
				>
					<p style={{ textAlign: 'center' }}>
						{data.hasSubgroups
							? ''
							: 'There are no subgroups yet. Be the first to create one!'}
					</p>
					<div
						style={{ textAlign: 'center' }}
						className='mt-2'
					>
						<AddGroupDialog scope={groupId} />
					</div>
				</div>
			</div>
		</div>
	);
}
