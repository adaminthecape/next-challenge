import { post } from '@/api';
import AddUserDialog from '@/components/AddUserDialog';
import { validateServerUser, getServerUser } from '@/lib/auth';
import { CSSRuleObject } from 'tailwindcss/types/config';
import SearchBar from '@/components/SearchBar';
import Pagination from '../../Pagination';
import UserRow from './UserRow';

export default async function UsersTable({ searchParams }: any) {
	await validateServerUser();

	const { page, keyword } = searchParams;

	const session = await getServerUser();
	const { data, status } =
		(await post(
			'/login/downstream',
			{
				username:
					!keyword || keyword === 'null'
						? undefined
						: String(keyword),
				pagination: {
					page: page || 1,
					limit: 6,
				},
			},
			{ jwt: session?.jwt }
		)) || {};

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
					<div>Dashboard - Users</div>
					<AddUserDialog />
					<SearchBar
						placeholder='Search by username...'
						baseRoute='/dashboard/users/table/[page]/search/[keyword]'
						routeParams={{
							page: 1,
							q: keyword,
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
							<th>Join date</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{(data.logins || []).map((user: any) => {
							return (
								<UserRow
									user={user}
									key={`user-${user.userId}`}
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
								: 1
						}
						baseRoute='/dashboard/users/table/[page]/search/[keyword]'
						routeParams={{ keyword }}
					/>
				</div>
			</div>
		</div>
	);
}
