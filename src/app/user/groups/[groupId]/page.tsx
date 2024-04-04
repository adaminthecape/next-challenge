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
import GroupCommunications from '@/components/Groups/GroupCommunications';
import ShowUsersModal from '@/components/Groups/ViewUsersModal';

export default async function ViewGroup({
	params: { groupId },
}: {
	params: { groupId: UUID };
}) {
	let renderKey = 0;
	const user = (await getServerUser()) || {
		userId: undefined,
		jwt: undefined,
	};

	const { data } = await get(`/groups/single/${groupId}`, {
		jwt: user?.jwt,
	});

	// const { data: roleData } = await get(`/groups/members/${groupId}/USER`, {
	// 	jwt: user?.jwt,
	// });

	// let { data: communications, status: communicationsStatus } = await post(
	// 	`/communications/messages`,
	// 	{
	// 		scope: groupId,
	// 		pagination: {
	// 			page: 1,
	// 			limit: 20,
	// 		},
	// 	},
	// 	{
	// 		jwt: user?.jwt,
	// 	}
	// );

	// if (!communications) communications = { communications: [], total: 0 };

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
			scope: groupId,
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

	const canSeePermissionsTable =
		role === GroupRoleType.ADMIN &&
		permissionPermissions[PermissionType.PERMISSIONS_READ] &&
		(permissionPermissions[PermissionType.PERMISSIONS_SUSPEND] ||
			permissionPermissions[PermissionType.PERMISSIONS_VERIFY]);

	return (
		<div key={renderKey}>
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
					{role ? (
						<ShowUsersModal
							groupId={groupId}
							usersOnGroup={data.visibleRoles}
							usersRoleOnGroup={role}
						/>
					) : (
						<Link href={`/user/groups/${groupId}/join`}>
							<button className='btn btn-warning'>
								Not a member! Click to join
							</button>
						</Link>
					)}
				</div>
			</div>
			<GroupCommunications groupId={groupId} />
			<SendMessage
				scope={groupId}
				userId={user.userId}
			/>
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
