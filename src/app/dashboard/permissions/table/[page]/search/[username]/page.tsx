import PermissionsTable from '@/components/AdminDashboard/Permissions/PermissionsTable';

export default function PermissionsTableDisplay({
	params: { page, username },
}: {
	params: {
		page: number;
		username: string;
	};
}) {
	return <PermissionsTable searchParams={{ page, username }} />;
}
