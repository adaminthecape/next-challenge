import { get, post } from '@/api';
import AddGroupDialog from '@/components/Groups/AddGroupDialog';
import GroupsTable from '@/components/Groups/GroupsTable';
import SendMessage from '@/components/SendMessage';
import { getServerUser } from '@/lib/auth';
import { UUID } from 'crypto';
import { MessageCircle } from 'lucide-react';
import { GroupRoleType, cGroupRoles } from '../../../../../api/models/Groups';
import {
	PermissionStatus,
	PermissionType,
} from '../../../../../api/models/Permissions';
import PermissionsTable from '@/components/AdminDashboard/Permissions/PermissionsTable';
import Link from 'next/link';

export default async function ViewGroup({
	params: { groupId },
}: {
	params: { groupId: UUID };
}) {
	const user = (await getServerUser()) || {
		userId: undefined,
		jwt: undefined,
	};

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

	if (data?.visibleRoles) {
		console.log('Group has roles:', data.visibleRoles);
	}

	if (!data) {
		return <div>No data!</div>;
	}

	// Could just check visibleRoles, but this is more fun
	const { data: permissionPermissions } = await post(
		'/permission/validate',
		{
			permissionTypes: [
				PermissionType.PERMISSIONS_READ,
				PermissionType.PERMISSIONS_VERIFY,
				PermissionType.PERMISSIONS_SUSPEND,
			],
		},
		{
			jwt: user?.jwt,
		}
	);

	const getUsersRoleOnGroup = (): GroupRoleType | undefined => {
		if (!data?.visibleRoles || !user.userId) {
			return undefined;
		}

		if (data.visibleRoles.admins.some((u) => u.userId === user.userId)) {
			return GroupRoleType.ADMIN;
		}

		if (data.visibleRoles.mods.some((u) => u.userId === user.userId)) {
			return GroupRoleType.MOD;
		}

		if (data.visibleRoles.users.some((u) => u.userId === user.userId)) {
			return GroupRoleType.USER;
		}

		return undefined;
	};

	const role = getUsersRoleOnGroup();

	console.log({ role });

	const canSeePermissionsTable =
		role === GroupRoleType.ADMIN &&
		permissionPermissions[PermissionType.PERMISSIONS_READ] &&
		(permissionPermissions[PermissionType.PERMISSIONS_SUSPEND] ||
			permissionPermissions[PermissionType.PERMISSIONS_VERIFY]);

	return (
		<div>
			<div style={{ display: 'flex', flexDirection: 'row' }}>
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
				</div>
				<div style={{ flexGrow: 1 }}></div>
				<div>
					{!role ? (
						<Link href={`/user/groups/${groupId}/join`}>
							<button className='btn btn-warning'>
								Not a member! Click to join
							</button>
						</Link>
					) : (
						''
					)}
					{role === GroupRoleType.ADMIN ? (
						<button className='btn btn-success'>{role}</button>
					) : (
						''
					)}
					{role === GroupRoleType.MOD ? (
						<button className='btn btn-warning'>{role}</button>
					) : (
						''
					)}
					{role === GroupRoleType.USER ? (
						<button className='btn'>{role}</button>
					) : (
						''
					)}
				</div>
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
					{data.visibleRoles.users.some(
						(u) => u.userId === user?.userId
					) ? (
						<div
							style={{ textAlign: 'center' }}
							className='mt-2'
						>
							<AddGroupDialog scope={groupId} />
						</div>
					) : (
						''
					)}
				</div>
			</div>
			{canSeePermissionsTable ? (
				<div className='mt-8'>
					<PermissionsTable
						title='Users awaiting approval'
						searchParams={{
							scope: groupId,
							status: [PermissionStatus.UNVERIFIED],
							pagination: {
								page: 1,
								limit: 100,
							},
						}}
					/>
				</div>
			) : (
				''
			)}
		</div>
	);
}
