import GroupsTable from '@/components/Groups/GroupsTable';

export default function GroupsTableDisplay({
	params: { page },
}: {
	params: {
		page: number;
	};
}) {
	return <GroupsTable searchParams={{ page }} />;
}
