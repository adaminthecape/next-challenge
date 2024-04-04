import { getServerUser } from '@/lib/auth';
import { UUID } from 'crypto';
import Link from 'next/link';
import { get } from '@/api';
import { Star } from 'lucide-react';
import { CSSRuleObject } from 'tailwindcss/types/config';

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
		numMembers?: number;
		userIsMember?: boolean;
	};
}) {
	const {
		groupId,
		name,
		scope,
		createdAt,
		createdBy,
		status,
		jsonData,
		numMembers,
		userIsMember,
	} = group || {};

	const json =
		jsonData && typeof jsonData === 'string' ? JSON.parse(jsonData) : {};

	if (!group) {
		return <div>No data!</div>;
	}

	return (
		<div
			style={{ color: 'rebeccapurple' }}
			className='card w-96 m-2 bg-secondary shadow-lg'
			key={groupId}
		>
			<Link href={`/user/groups/${groupId}`}>
				<div className='card-body'>
					<h2 className='card-title'>{name}</h2>
					<p>{json.desc}</p>
					{scope && <p>In {scope.split('-')[0]}</p>}
					<p>
						Created{' '}
						{createdAt ? new Date(createdAt).toDateString() : ''}
					</p>
					<p>Members: {numMembers}</p>
					{isAdmin && <p>Status: {status}</p>}
					<div className='card-actions justify-end mt-2'>
						{userIsMember ? (
							<button
								className='btn btn-sm btn-disabled'
								style={{ color: '#cc00cc' }}
							>
								<Star size={16} />
								You are a member
							</button>
						) : (
							<Link href={`/user/groups/${groupId}/join`}>
								<button className='btn btn-sm btn-primary'>
									Join
								</button>
							</Link>
						)}
						<Link href={`/user/groups/${groupId}`}>
							<button className='btn btn-sm'>View</button>
						</Link>
					</div>
				</div>
			</Link>
		</div>
	);
}
