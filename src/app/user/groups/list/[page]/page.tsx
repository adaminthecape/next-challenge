import GroupsTable from '@/app/components/Groups/GroupsTable';

export default function GroupsTableDisplay({
	params: { page },
}: {
	params: {
		page: number;
	};
}) {
	return <GroupsTable searchParams={{ page }} />;
}
