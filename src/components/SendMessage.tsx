'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import { MessageCirclePlus, MessageSquareReply } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import Cookies from 'js-cookie';

export default function SendMessage({
	scope,
	userId,
}: {
	scope: UUID;
	userId?: UUID;
}) {
	const [recipient, setRecipient] = useState<UUID>();
	const [message, setMessage] = useState<string>('');

	const { data: sessionData, status: sessionStatus } = useSession();

	const { token } = (sessionData?.user as any) || {};
	const storedToken = Cookies.get('client-jwt');

	if (token && !storedToken) {
		Cookies.set('client-jwt', token);
		console.log('set jwt!', Cookies.get('client-jwt'));
	}

	console.log('SendMessage scope:', scope);

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
			} else if (status === 403) {
				toast.error('You are not allowed to comment here');
			} else {
				toast.error('Something went wrong! ' + status);
			}
		} catch (e: any) {
			console.warn(e);
			toast.error('Failed to add message: ' + e.message);
		}

		try {
			// redirect(`/user/groups/${scope}`);
			// window.location.reload();
		} catch (e) {
			console.warn(e);
		}
	};

	return (
		<SessionProvider session={sessionData}>
			<div>
				<label className='input input-bordered flex items-center gap-2'>
					<MessageSquareReply />
					<input
						name='message'
						type='text'
						placeholder='Join the conversation'
						className='grow'
						onChangeCapture={(e) =>
							setMessage(e.currentTarget.value)
						}
					/>
					<button
						className='btn btn-sm btn-primary'
						onClick={handleSubmit}
					>
						<MessageCirclePlus />
						Send
					</button>
				</label>
			</div>
		</SessionProvider>
	);
}
