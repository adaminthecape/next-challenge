'use client';
import { post } from '@/api';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AddUserDialog() {
	const [username, setUsername] = useState<string>('adam4');
	const [password, setPassword] = useState<string>();

	async function addUser(username: string, password: string) {
		if (!username || !password) return false;

		await post(`/login/create/${username}/${password}`);

		return true;
	}

	const handleSubmit = async () => {
		if (!username || !password) {
			alert('Failed to add user: Not enough data');
			return;
		}

		let success = false;

		try {
			success = await addUser(username, password);
		} catch (e) {
			console.warn(e);
		}

		if (success) {
			toast.success('Added user ' + username);
			redirect('/dashboard/users');
		} else {
			toast.error('Failed to add user ' + username);
			alert('Failed to add user');
		}
	};

	return (
		<div>
			<button
				className='btn btn-primary'
				onClick={() =>
					document.getElementById('add_user_modal').showModal()
				}
			>
				Add User
			</button>
			<dialog
				id='add_user_modal'
				className='modal'
			>
				<div className='modal-box'>
					<h3 className='font-bold text-lg'>Add a new user</h3>
					<p className='py-4'>
						You may add a new, unverified login here. This login
						will remain inactive until verified by an admin.
					</p>
					<label className='input input-bordered flex items-center gap-2 mb-2'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 16 16'
							fill='currentColor'
							className='w-4 h-4 opacity-70'
						>
							<path d='M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z' />
							<path d='M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z' />
						</svg>
						<input
							name='email'
							type='text'
							className='grow'
							placeholder='Email'
						/>
					</label>
					<label className='input input-bordered flex items-center gap-2 mb-2'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 16 16'
							fill='currentColor'
							className='w-4 h-4 opacity-70'
						>
							<path d='M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z' />
						</svg>
						<input
							name='username'
							type='text'
							className='grow'
							placeholder='Username'
							onChangeCapture={(e) =>
								setUsername(e.currentTarget.value)
							}
						/>
					</label>
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
							name='password'
							type='password'
							className='grow'
							onChangeCapture={(e) =>
								setPassword(e.currentTarget.value)
							}
						/>
					</label>
					<div className='modal-action'>
						<form
							method='dialog'
							name='add_user_form'
						>
							{/* if there is a button in form, it will close the modal */}
							<button className='btn mr-2'>Cancel</button>
							<button
								className='btn btn-primary'
								type='submit'
								onClick={handleSubmit}
							>
								Submit
							</button>
						</form>
					</div>
				</div>
			</dialog>
		</div>
	);
}
