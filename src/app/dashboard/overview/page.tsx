// Admin overview - where an admin can manage users below them
// User MUST be an admin of any level
//
'use server';
import DevButtons from '@/components/AdminDashboard/DevButtons';
import { LoginButton, LogoutButton } from '@/components/HelpfulButtons';
import { validateServerUser } from '@/lib/auth';

export default async function AdminOverview() {
	await validateServerUser();

	return (
		<div>
			<div>DASHBOARD</div>
			<div>
				TODO: Add some basic statistics and/or links to other pages
			</div>
			<div className='m-2'>
				<LoginButton />
			</div>
			<div className='m-2'>
				<LogoutButton />
			</div>
			<div className='m-2'>
				<DevButtons />
			</div>
		</div>
	);
}
