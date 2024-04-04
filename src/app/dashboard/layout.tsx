// Admin overview - where an admin can manage users below them
// User MUST be an admin of any level
//
import * as React from 'react';
import Link from 'next/link';

import UserControls from '../../components/UserControls';
import { CSSRuleObject } from 'tailwindcss/types/config';
import { getServerUser, validateServerUser } from '@/lib/auth';
import { LogoutButton } from '@/components/HelpfulButtons';

const styles: Record<string, CSSRuleObject> = {
	masterContainer: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		height: '100vh',
	},
	topBar: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		background: 'rgba(250, 25, 250, 0.10)',
	},
	leftDrawerMenu: {
		height: '100%',
	},
	leftDrawer: {
		width: '180px',
		minWidth: '180px',
	},
	mainContentContainer: {
		display: 'flex',
		flexDirection: 'row',
		height: '100%',
	},
	mainContent: {
		flexGrow: '1',
		height: '100%',
		padding: '16px',
	},
	footer: {
		display: 'none',
	},
};

export default async function AdminDashboard({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	await validateServerUser();
	const user = await getServerUser();

	return (
		<div style={styles.masterContainer}>
			{/* COMMENT */}
			{/* Header */}
			<header style={styles.topBar}>
				{/* Logo */}
				<img
					src='https://imgur.com/YEusnPd.png'
					alt='logo'
					width='140'
					height='80'
					className='ml-4'
				/>

				{/* User Controls menu */}
				<div>
					<UserControls user={user || {}} />
				</div>
			</header>
			<div style={styles.mainContentContainer}>
				<div style={styles.leftDrawer}>
					<ul
						className='menu bg-base-200'
						style={styles.leftDrawerMenu}
					>
						<li>
							<Link href='/dashboard/overview'>
								Admin Dashboard
							</Link>
						</li>
						<li>
							<Link href='/dashboard/users'>Manage users</Link>
						</li>
						<li>
							<Link href='/dashboard/permissions/table/1'>
								Manage permissions
							</Link>
						</li>
						<li>
							<Link href='/user/groups/list/1'>View groups</Link>
						</li>
						{/* <li>
							<Link href='/user/profile/list/1'>View users</Link>
						</li>
						<li>
							<Link href='/user/chats/list'>
								View recent chats
							</Link>
						</li> */}
						<li>
							<LogoutButton />
						</li>
					</ul>
				</div>
				{/* Main content */}
				<div style={styles.mainContent}>{children}</div>
			</div>
			<footer style={styles.footer}>FOOTER</footer>
		</div>
	);
}
