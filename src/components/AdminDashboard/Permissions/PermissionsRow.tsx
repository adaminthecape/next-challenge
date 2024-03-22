import VerifyPermission from '@/components/VerifyPermission';
import VerifyUserDialog from '@/components/VerifyUser';
import Avatar from 'boring-avatars';
import { UUID } from 'crypto';
import Link from 'next/link';

export default function PermissionsRow({
	permission,
}: {
	permission: {
		userId: UUID;
		status: 0 | 1 | 2;
		createdAt: number;
		updatedAt?: number | null;
		createdBy: UUID;
		permissionType: string;
		scope: UUID | null;
		username?: string;
	};
}) {
	const permissionStatusText = {
		0: 'Unverified',
		1: 'Suspended',
		2: 'Active',
	};

	return (
		<tr
			key={`row-${permission.permissionType}-${permission.userId}-${permission.scope}`}
		>
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
								name={permission.userId?.split('-')[0]}
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
						<div className='font-bold'>{permission.username}</div>
						<div className='text-sm opacity-50'>
							{permission.userId}
						</div>
					</div>
				</div>
			</td>
			<td>{permission.permissionType}</td>
			<td>{permission.scope || 'Global'}</td>
			<td>
				<span>{(permissionStatusText as any)[permission.status]}</span>
				{permission.status !== 2 ? (
					<VerifyPermission
						userId={permission.userId}
						scope={permission.scope as UUID}
						permissionType={permission.permissionType}
					/>
				) : (
					''
				)}
				<br />
				<span className='badge badge-ghost badge-sm'>
					{new Date(
						permission.updatedAt || permission.createdAt
					).toDateString()}
					&nbsp;at&nbsp;
					{
						new Date(permission.updatedAt || permission.createdAt)
							.toTimeString()
							.split(' ')[0]
					}
				</span>
			</td>
			<th>
				<Link href={`/dashboard/users/${permission.userId}`}>
					<button className='btn btn-ghost btn-xs'>details</button>
				</Link>
			</th>
		</tr>
	);
}
