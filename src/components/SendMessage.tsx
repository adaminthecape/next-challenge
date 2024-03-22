'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SendMessage({
	scope,
	userId,
}: {
	scope: UUID;
	userId?: UUID;
}) {
	const [recipient, setRecipient] = useState<UUID>();
	const [message, setMessage] = useState<string>('');

	const handleSubmit = async () => {
		console.log({ recipient, message, scope });

		if (!message) {
			return;
		}

		try {
			console.log('before post');

			const { status, data: response } = await post(
				'/communications/sendMessage',
				{
					scope,
					message,
					to: recipient || undefined,
				}
			);

			console.log('after post:', status, response);

			if (status === 200) {
				toast.success('Message added');
				setMessage('');
			} else {
				toast.error('Something went wrong! ' + status);
			}
		} catch (e: any) {
			console.warn(e);
			toast.error('Failed to add message: ' + e.message);
		}

		try {
			// redirect(`/user/groups/${scope}`);
			window.location.reload();
		} catch (e) {
			console.warn(e);
		}
	};

	return (
		<div>
			<label className='input input-bordered flex items-center gap-2'>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 16 16'
					fill='currentColor'
					className='w-4 h-4 opacity-70'
				>
					<path
						fillRule='evenodd'
						d='M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z'
						clipRule='evenodd'
					/>
				</svg>
				<input
					name='message'
					type='text'
					placeholder='Join the conversation'
					className='grow'
					onChangeCapture={(e) => setMessage(e.currentTarget.value)}
				/>
				<button
					className='btn btn-sm'
					onClick={handleSubmit}
				>
					Send
				</button>
			</label>
		</div>
	);
}
