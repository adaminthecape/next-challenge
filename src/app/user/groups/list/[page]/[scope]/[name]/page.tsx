import GroupsTable from '@/components/Groups/GroupsTable';

export default function GroupsTableDisplay({
	params: { page, scope, name },
}: {
	params: {
		page: number;
		scope: string;
		name: string;
	};
}) {
	return <GroupsTable searchParams={{ page, scope, name }} />;
}
