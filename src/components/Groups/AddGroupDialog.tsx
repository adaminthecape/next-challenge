'use client';
import { post } from '@/api';
import { UUID } from 'crypto';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AddGroupDialog({
	scope,
	userId,
}: {
	scope: UUID;
	userId?: UUID;
}) {
	const [name, setName] = useState<string>('');
	const [desc, setDesc] = useState<string>('');
	const [approvalType, setApprovalType] =
		useState</* GroupApprovalType */ any>(
			/* GroupApprovalType.manual */ 'manual'
		);
	const [status, setStatus] = useState</* GroupStatus */ any>(
		/* GroupStatus.public */ 'public'
	);

	async function addGroup(data: /* GroupRow */ any) {
		console.log('add group:', data);
		if (!data.name) return false;

		await post(`/groups/add`, data);

		console.log('added group:', data);
		return true;
	}

	const handleSubmit = async () => {
		if (!name) {
			alert('Failed to add group: Not enough data');
			return;
		}

		const data /* : GroupRow */ = {
			name,
			scope,
			status,
			approvalType,
			jsonData: {
				description: desc,
			},
		};

		let success = false;

		try {
			success = await addGroup(data);
		} catch (e) {
			console.warn(e);
		}

		if (success) {
			toast.success('Added group ' + name);
			try {
				redirect('/user/groups/list/1');
			} catch (e) {
				console.warn(e);
			}
		} else {
			toast.error('Failed to add group ' + name);
		}
	};

	return (
		<div>
			<button
				className='btn btn-primary'
				onClick={() =>
					document.getElementById('add_group_modal')?.showModal()
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
					{scope && <p>Parent group: {scope}</p>}
					<label className='input input-bordered flex items-center gap-2 mb-2 mt-4'>
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
					<label className='textarea input-bordered flex items-center gap-2 mb-2'>
						<textarea
							name='desc'
							className='grow'
							placeholder='Description'
							onChangeCapture={(e) =>
								setDesc(e.currentTarget.value)
							}
						/>
					</label>
					<label className='input input-bordered flex items-center gap-2 mb-2'>
						<div>Visibility</div>
						<select
							name='name'
							className='grow'
							onChangeCapture={(e) =>
								setStatus(e.currentTarget.value)
							}
						>
							<option value={'public'}>Public</option>
							<option value={'private'}>Private</option>
						</select>
					</label>
					<label className='input input-bordered flex items-center gap-2 mb-2'>
						<div>Membership</div>
						<select
							name='name'
							className='grow'
							onChangeCapture={(e) =>
								setApprovalType(e.currentTarget.value)
							}
						>
							<option value={'manual'}>
								Group leaders must approve requests
							</option>
							<option value={'auto'}>Anyone can join</option>
						</select>
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
