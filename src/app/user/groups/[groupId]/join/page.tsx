import { getServerUser } from '@/lib/auth';
import { UUID } from 'crypto';
import { get } from '@/api';
import Link from 'next/link';

export default async function JoinGroup({
	params: { groupId },
}: {
	params: { groupId: UUID };
}) {
	const user = await getServerUser();

	async function requestGroupJoin() {
		const { data, status } = await get(`/groups/join/${groupId}`, {
			jwt: user?.jwt,
		});

		console.log('REQUEST:', { data, status });

		return status;
	}

	const status = await requestGroupJoin();

	if (status === 200) {
		return (
			<div style={{ textAlign: 'center' }}>
				<div>You have successfully joined the group!</div>
				<button className='btn mt-2'>
					<Link href={`/user/groups/${groupId}`}>
						Visit the group now
					</Link>
				</button>
			</div>
		);
	}

	if (status === 201) {
		return (
			<div style={{ textAlign: 'center' }}>
				Your request to join has been sent and is awaiting admin
				approval.
			</div>
		);
	}

	return (
		<div style={{ textAlign: 'center' }}>
			<div>You have failed to join the group</div>
			<button className='btn mt-2'>
				<Link href={`/user/groups/list/1`}>Find another group</Link>
			</button>
		</div>
	);
}
