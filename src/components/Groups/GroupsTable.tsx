import { post } from '@/api';
import { validateServerUser, getServerUser } from '@/lib/auth';
import { CSSRuleObject } from 'tailwindcss/types/config';
import SearchBar from '@/components/SearchBar';
import Pagination from '../Pagination';
import SingleGroup from './GroupsRow';
import AddGroupDialog from './AddGroupDialog';
import { UUID } from 'crypto';

export default async function GroupsTable({
	searchParams,
	hideTopBar,
	hidePagination,
}: {
	hideTopBar?: boolean;
	hidePagination?: boolean;
	searchParams: {
		page?: number;
		scope?: UUID;
		name?: string;
		limit?: number;
	};
}) {
	await validateServerUser();

	const { page, name, scope, limit } = searchParams;

	const params = {
		name: name || '',
		scope: scope || '',
		pagination: {
			page: page || 1,
			limit: limit || 6,
		},
	};

	const session = await getServerUser();
	const { data, status } =
		(await post(`/groups/list`, params, {
			jwt: session?.jwt,
		})) || {};

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
		groupList: {
			display: 'flex',
			flexDirection: 'row',
			flexWrap: 'wrap',
		},
	};

	/**
	 * Obviously in production this would kick the user out and/or send
	 * warnings to the devs. I'm doing this for demo purposes.
	 */
	if (status === 403)
		return (
			<div
				style={{ textAlign: 'center' }}
				className='mt-8'
			>
				You must be a member of the group to see its subgroups.
			</div>
		);
	else if (!data) return <div>No records found.</div>;

	return (
		<div>
			<div className='overflow-x-auto'>
				{!hideTopBar && (
					<div
						style={styles.tableTopBar}
						className='card'
					>
						<div>Groups</div>
						<AddGroupDialog scope={scope} />
						<SearchBar
							placeholder='Search by name...'
							baseRoute='/user/groups/list/[page]/[scope]/[name]'
							keywordParam='name'
							routeParams={{
								page: 1,
								scope,
							}}
							replaceMap={{ scope: '/name' }}
						/>
					</div>
				)}
				<div style={styles.groupList}>
					{(data.groups || []).map((item: any) => {
						return (
							<SingleGroup
								group={item}
								key={`group-row-${item.id}`}
							/>
						);
					})}
				</div>
				{!hidePagination && (
					<div style={styles.paginationRow}>
						<Pagination
							currentPage={page || 1}
							totalPages={
								data.total && data.limit
									? data.total / data.limit
									: 1
							}
							baseRoute='/user/groups/list/[page]/[scope]/[name]'
							routeParams={{ name, scope, page }}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
