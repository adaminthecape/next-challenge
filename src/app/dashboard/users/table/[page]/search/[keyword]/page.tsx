import UsersTable from '@/app/components/AdminDashboard/Users/UsersTable';

export default function UsersTableDisplay({
	params: { page, keyword },
}: {
	params: {
		page: number;
		keyword: string;
	};
}) {
	return <UsersTable searchParams={{ page, keyword }} />;
}
