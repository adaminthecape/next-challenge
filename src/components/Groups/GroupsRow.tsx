import { getServerUser } from '@/lib/auth';
import { UUID } from 'crypto';
import Link from 'next/link';
import { get } from '@/api';

/** Copied from Groups.ts */
enum GroupStatus {
	closed = 'closed',
	private = 'private',
	public = 'public',
}

export default async function SingleGroup({
	group,
	isAdmin,
}: {
	isAdmin?: boolean;
	group: {
		groupId?: UUID;
		scope: UUID;
		name: string;
		createdBy?: UUID;
		createdAt?: number;
		status: GroupStatus;
		jsonData?: string;
	};
}) {
	const { groupId, name, scope, createdAt, createdBy, status, jsonData } =
		group || {};

	const json =
		jsonData && typeof jsonData === 'string' ? JSON.parse(jsonData) : {};

	if (!group) {
		return <div>No data!</div>;
	}

	return (
		<div
			className='card w-96 bg-primary text-primary-content m-2'
			key={groupId}
		>
			<div className='card-body'>
				<h2 className='card-title'>{name}</h2>
				<p>{json.desc}</p>
				{scope && <p>In {scope.split('-')[0]}</p>}
				<p>
					Created{' '}
					{createdAt ? new Date(createdAt).toDateString() : ''}
				</p>
				<p>Members: {'{placeholder}'}</p>
				{isAdmin && <p>Status: {status}</p>}
				<div className='card-actions justify-end'>
					<Link href={`/user/groups/${groupId}`}>
						<button className='btn'>View</button>
					</Link>
					<Link href={`/user/groups/${groupId}/join`}>
						<button className='btn btn-primary'>Join</button>
					</Link>
				</div>
			</div>
		</div>
	);
}
