'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

// Duplicated here from Groups.ts - should be in a shared repo
enum GroupStatus {
	closed = 'closed',
	private = 'private',
	public = 'public',
}

// Duplicated here from Groups.ts - should be in a shared repo
interface GroupRow {
	groupId?: UUID;
	scope: UUID;
	name: string;
	createdBy?: UUID;
	createdAt?: number;
	status: GroupStatus;
	json?: Record<string, any>;
}

export default function AddGroupDialog({ scope }: { scope: UUID }) {
	const [name, setName] = useState<string>('');
	const [desc, setDesc] = useState<string>('');
	const [status, setStatus] = useState<GroupStatus>(GroupStatus.public);

	async function addGroup(data: GroupRow) {
		if (!data.name) return false;

		console.log('GROUP DATA TO ADD:', data);

		await post(`/groups/add`, data);

		return true;
	}

	const handleSubmit = async () => {
		if (!name) {
			alert('Failed to add group: Not enough data');
			return;
		}

		const data = {
			name,
			scope,
			status,
		};

		let success = false;

		try {
			success = await addGroup(data);
		} catch (e) {
			console.warn(e);
		}

		if (success) {
			toast.success('Added group ' + name);
			redirect('/user/groups/list/1');
		} else {
			toast.error('Failed to add group ' + name);
		}
	};

	return (
		<div>
			<button
				className='btn btn-primary'
				onClick={() =>
					document.getElementById('add_group_modal').showModal()
				}
			>
				Add Group
			</button>
			<dialog
				id='add_group_modal'
				className='modal'
			>
				<div className='modal-box'>
					<h3 className='font-bold text-lg'>Add a new group</h3>
					<p className='py-4'>
						You may add a new group here. The default status is
						Public.
					</p>
					<label className='input input-bordered flex items-center gap-2 mb-2'>
						<input
							name='name'
							type='text'
							className='grow'
							placeholder='Name'
							onChangeCapture={(e) =>
								setName(e.currentTarget.value)
							}
						/>
					</label>
					<label className='input input-bordered flex items-center gap-2 mb-2'>
						<select
							name='name'
							className='grow'
							onChangeCapture={(e) =>
								setStatus(e.currentTarget.value as GroupStatus)
							}
						>
							<option value={GroupStatus.public}>Public</option>
							<option value={GroupStatus.private}>Private</option>
						</select>
					</label>
					<label className='input input-bordered flex items-center gap-2 mb-2'>
						<input
							name='desc'
							type='textarea'
							className='grow'
							placeholder='Description'
							onChangeCapture={(e) =>
								setDesc(e.currentTarget.value)
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
