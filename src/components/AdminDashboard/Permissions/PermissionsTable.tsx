import { post } from '@/api';
import { validateServerUser, getServerUser } from '@/lib/auth';
import { CSSRuleObject } from 'tailwindcss/types/config';
import SearchBar from '@/components/SearchBar';
import Pagination from '../../Pagination';
import PermissionsRow from './PermissionsRow';

const styles: Record<string, CSSRuleObject> = {
	tableTopBar: {
		width: '100%',
		height: '60px',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: '6px 8px',
	},
	tableBody: {
		maxHeight: 'calc(100% - 200px)',
	},
	paginationRow: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
};

export default async function PermissionsTable({ searchParams }: any) {
	await validateServerUser();

	const { page, username, scope } = searchParams;

	const params = {
		username: username || '',
		scope: scope || '',
		pagination: {
			page,
			limit: 8,
		},
	};

	const session = await getServerUser();
	const { data, status } =
		(await post(`/permission/list`, params, {
			jwt: session?.jwt,
		})) || {};

	/**
	 * Obviously in production this would kick the user out and/or send
	 * warnings to the devs. I'm doing this for demo purposes.
	 */
	if (status === 403) return <div>Nothing to see here, move along</div>;
	else if (!data) return <div>No records found.</div>;

	return (
		<div>
			<div className='overflow-x-auto'>
				{/* Top bar */}
				<div
					style={styles.tableTopBar}
					className='card'
				>
					<div>Dashboard - Permissions</div>
					<SearchBar
						placeholder='Search by username...'
						baseRoute='/dashboard/permissions/table/[page]/search/[username]'
						routeParams={{
							page: 1,
						}}
					/>
				</div>
				<table
					className='table'
					style={styles.tableBody}
				>
					<thead>
						<tr>
							<th>
								<label>
									<input
										type='checkbox'
										className='checkbox'
									/>
								</label>
							</th>
							<th>Username</th>
							<th>Permission type</th>
							<th>Scope</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{(data.permissions || []).map((item: any) => {
							return (
								<PermissionsRow
									permission={item}
									key={`permission-${item.id}`}
								/>
							);
						})}
					</tbody>
				</table>
				<div style={styles.paginationRow}>
					<Pagination
						currentPage={page || 1}
						totalPages={
							data.total && data.limit
								? data.total / data.limit
								: 2
						}
						baseRoute='/dashboard/permissions/table/[page]/search/[username]'
						pageParam='page'
						routeParams={{ username }}
						replaceMap={{ username: '/asdf' }}
					/>
				</div>
			</div>
		</div>
	);
}
