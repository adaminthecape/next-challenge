'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import { useState } from 'react';
import toast from 'react-hot-toast';

enum GroupRoleType {
	'USER' = 'USER',
	'MOD' = 'MOD',
	'ADMIN' = 'ADMIN',
}

export default function ChangeGroupRoleButton({
	user,
	groupId,
}: {
	user: { userId: UUID; username: string; role: GroupRoleType };
	groupId: UUID;
}) {
	const [newRole, setNewRole] = useState<GroupRoleType | undefined>(
		user.role
	);

	async function changeRole(role: GroupRoleType | undefined) {
		const url = role
			? `/groups/convertTo${role.slice(0, 1).toUpperCase()}${role
					.slice(1)
					.toLowerCase()}`
			: '';

		const { data, status } = await post(url, {
			userId: user.userId,
			groupId,
			role,
		});

		if (status === 200) {
			toast.success(
				`Successfully changed role to ${role} for ${user.username}`
			);

			setNewRole(role);
		} else if (status === 403) {
			toast.error('You are not allowed to do that!');
		} else {
			toast.error('Something went wrong');
		}
	}

	const roleToUse = newRole || user.role;

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'row',
				flexWrap: 'nowrap',
			}}
		>
			<button
				className={`btn btn-xs mr-1 btn-outline ${
					roleToUse === GroupRoleType.ADMIN ? 'btn-success' : ''
				}`}
				onClick={() => changeRole(GroupRoleType.ADMIN)}
			>
				Admin
			</button>
			<button
				className={`btn btn-xs mr-1 btn-outline ${
					roleToUse === GroupRoleType.MOD ? 'btn-success' : ''
				}`}
				onClick={() => changeRole(GroupRoleType.MOD)}
			>
				Mod
			</button>
			<button
				className={`btn btn-xs mr-1 btn-outline ${
					roleToUse === GroupRoleType.USER ? 'btn-success' : ''
				}`}
				onClick={() => changeRole(GroupRoleType.USER)}
			>
				User
			</button>
			{/* <button
				className={`btn btn-xs btn-outline ${
					!roleToUse ? 'btn-success' : ''
				}`}
				onClick={() => changeRole(undefined)}
			>
				None
			</button> */}
		</div>
	);
}
