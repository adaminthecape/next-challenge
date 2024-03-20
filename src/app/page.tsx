import Link from 'next/link';
import UserControls from './components/UserControls';
import { CSSRuleObject } from 'tailwindcss/types/config';
import { getServerUser } from '@/lib/auth';
import { UUID } from 'crypto';

export default async function Home() {
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
			background: 'rgba(25, 25, 250, 0.2)',
		},
		leftDrawerMenu: {
			height: '100%',
		},
		leftDrawer: {
			width: '180px',
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

	return (
		<div style={styles.masterContainer}>
			{/* Header */}
			<header style={styles.topBar}>
				{/* Logo */}
				<div>Logo</div>

				{/* User Controls menu */}
				<div>
					<UserControls />
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
							<a>Search for users</a>
						</li>
						<li>
							<a>Search for groups</a>
						</li>
						<li>
							<a>Log out</a>
						</li>
					</ul>
				</div>
				{/* Main content */}
				<div style={styles.mainContent}>
					{/* Here we show the default page */}
				</div>
			</div>
			<footer style={styles.footer}>FOOTER</footer>
		</div>
	);
}
