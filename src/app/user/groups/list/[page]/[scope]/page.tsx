import GroupsTable from '@/components/Groups/GroupsTable';

export default function GroupsTableDisplay({
	params: { page, scope },
}: {
	params: {
		page: number;
		scope: string;
	};
}) {
	return <GroupsTable searchParams={{ page, scope }} />;
}
