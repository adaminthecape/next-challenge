'use client';

import { UUID } from 'crypto';
import ChangeGroupRoleButton from './ChangeRoleButton';

export default function ShowUsersModal({
	usersRoleOnGroup,
	usersOnGroup,
	groupId,
}: {
	groupId: UUID;
	usersRoleOnGroup: 'USER' | 'MOD' | 'ADMIN';
	usersOnGroup: {
		users: { userId: UUID; username: string }[];
		mods: { userId: UUID; username: string }[];
		admins: { userId: UUID; username: string }[];
	};
}) {
	const { users, mods, admins } = usersOnGroup;
	const uniqueUsers: any[] = [];

	const add = (user: any, role: any) => {
		if (!uniqueUsers.some((u) => u.userId === user.userId)) {
			uniqueUsers.push({ ...user, role });
		}
	};

	admins.forEach((user) => {
		add(user, 'ADMIN');
	});

	mods.forEach((user) => {
		add(user, 'MOD');
	});

	users.forEach((user) => {
		add(user, 'USER');
	});

	let btnClasses = ['btn'];

	if (usersRoleOnGroup === 'ADMIN') btnClasses.push('btn-success');
	else if (usersRoleOnGroup === 'MOD') btnClasses.push('btn-warning');

	return (
		<div>
			<button
				className={btnClasses.join(' ')}
				onClick={() =>
					document.getElementById('show_users_modal').showModal()
				}
			>
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<div>
						Your role is: {usersRoleOnGroup.toLocaleLowerCase()}
					</div>
					<div>
						Click to{' '}
						{usersRoleOnGroup === 'ADMIN' ? 'manage' : 'see'} other
						users
					</div>
				</div>
			</button>
			<dialog
				id='show_users_modal'
				className='modal full-width'
			>
				<div className='modal-box m-0 p-0'>
					<h3 className='font-bold text-lg ml-4 mr-4 mt-2'>
						Users of this group
					</h3>
					{/* <p className='py-4'>Users of this group</p> */}
					{/* <div>{JSON.stringify(users, undefined, 2)}</div> */}
					<table className='table table-zebra'>
						<thead>
							<tr>
								<th></th>
								<th>Name</th>
								<th>Role</th>
								{usersRoleOnGroup !== 'ADMIN' ? (
									''
								) : (
									<th>Change role</th>
								)}
							</tr>
						</thead>
						{uniqueUsers.map((user, i) => {
							return (
								<tr key={`user-row-${i}`}>
									<td>{i + 1}</td>
									<td>{user.username}</td>
									<td>{user.role}</td>
									{usersRoleOnGroup !== 'ADMIN' ? (
										''
									) : (
										<td>
											<ChangeGroupRoleButton
												groupId={groupId}
												user={user}
											/>
										</td>
									)}
								</tr>
							);
						})}
					</table>
					<div className='modal-action'>
						{/* <button className='btn btn-error'>Close</button> */}
					</div>
				</div>
			</dialog>
		</div>
	);
}
