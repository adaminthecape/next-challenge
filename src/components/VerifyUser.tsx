'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VerifyUserDialog({
	userId,
	currentState,
}: {
	userId: UUID;
	currentState: 0 | 1 | 2;
}) {
	const router = useRouter();
	const [confirm, setConfirm] = useState<boolean>(false);
	const [newState, setNewState] = useState<0 | 1 | 2>(currentState);

	async function confirmUpdateState(userId: UUID, newState: 0 | 1 | 2) {
		if (![0, 1, 2].includes(newState)) return false;

		await post('/login/verify', {
			userId,
			newState: 2,
		});

		return true;
	}

	const handleSubmit = async () => {
		let success = false;

		try {
			success = await confirmUpdateState(userId, newState);
		} catch (e) {
			console.warn(e);
		}

		if (success) {
			router.push('/dashboard/users');
		} else {
			alert('Failed to verify user');
		}
	};

	return confirm ? (
		<button
			className='btn btn-success btn-outline btn-xs ml-2'
			onClick={handleSubmit}
		>
			Verify
		</button>
	) : (
		<button
			className='btn btn-success btn-outline btn-xs ml-2'
			onClick={setConfirm(true)}
		>
			Verify
		</button>
	);
}
