'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import { redirect } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function VerifyPermission({
	scope,
	userId,
	permissionType,
	parentRoute,
}: {
	scope: UUID;
	userId: UUID;
	permissionType: string;
	parentRoute?: string;
}) {
	async function confirmUpdateState() {
		const data = await post('/permission/verify', {
			scope,
			userId,
			permissionTypes: [permissionType],
		});

		if (data.status === 200) {
			toast.success('Verified successfully');
		} else if (data.status === 403) {
			toast.error('You are not allowed to do that!');
		} else {
			toast.error('Failed to verify!');
		}

		return true;
	}

	const handleSubmit = async () => {
		let success = false;

		try {
			success = await confirmUpdateState();
		} catch (e) {
			console.warn(e);
		}

		if (success) {
			// redirect(parentRoute || '/dashboard/permissions/1');
		} else {
			alert('Failed to verify user');
		}
	};

	return (
		<button
			className='btn btn-success btn-outline btn-xs ml-2'
			onClick={handleSubmit}
		>
			Grant
		</button>
	);
}
