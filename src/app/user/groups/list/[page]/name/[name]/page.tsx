import GroupsTable from '@/components/Groups/GroupsTable';

export default function GroupsTableDisplay({
	params: { page, name },
}: {
	params: {
		page: number;
		name: string;
	};
}) {
	return <GroupsTable searchParams={{ page, name }} />;
}
