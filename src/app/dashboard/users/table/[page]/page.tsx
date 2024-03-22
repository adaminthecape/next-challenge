import UsersTable from '@/components/AdminDashboard/Users/UsersTable';

export default function UsersTableDisplay({
	params: { page },
}: {
	params: {
		page: number;
	};
}) {
	return <UsersTable searchParams={{ page }} />;
}
