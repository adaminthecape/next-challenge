import VerifyUserDialog from '@/components/VerifyUser';
import Avatar from 'boring-avatars';
import { UUID } from 'crypto';
import Link from 'next/link';

export default function UserRow({
	user,
}: {
	user: {
		username: string;
		country?: string;
		userId: UUID;
		status: 0 | 1 | 2;
		createdAt: number;
	};
}) {
	const loginStatusText = {
		0: 'Banned',
		1: 'Unverified',
		2: 'Active',
	};

	return (
		<tr key={`row-${user.userId}`}>
			<th>
				<label>
					<input
						type='checkbox'
						className='checkbox'
					/>
				</label>
			</th>
			<td>
				<div className='flex items-center gap-3'>
					<div className='avatar'>
						<div className='mask mask-squircle w-12 h-12'>
							<Avatar
								size={40}
								name={user.userId}
								variant='marble'
								colors={[
									'#92A1C6',
									'#146A7C',
									'#F0AB3D',
									'#C271B4',
									'#C20D90',
								]}
							/>
						</div>
					</div>
					<div>
						<div className='font-bold'>{user.username}</div>
						<div className='text-sm opacity-50'>{user.country}</div>
					</div>
				</div>
			</td>
			<td>
				<span>{(loginStatusText as any)[user.status]}</span>
				{user.status !== 2 ? (
					<VerifyUserDialog
						userId={user.userId}
						currentState={user.status}
					/>
				) : (
					''
				)}
				<br />
				<span className='badge badge-ghost badge-sm'>
					{new Date(user.createdAt).toDateString()}
					&nbsp;at&nbsp;
					{new Date(user.createdAt).toTimeString().split(' ')[0]}
				</span>
			</td>
			<th>
				<Link href={`/dashboard/users/${user.userId}`}>
					<button className='btn btn-ghost btn-xs'>details</button>
				</Link>
			</th>
		</tr>
	);
}
