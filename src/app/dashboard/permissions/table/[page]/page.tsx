import PermissionsTable from '@/app/components/AdminDashboard/Permissions/PermissionsTable';

export default function PermissionsTableDisplay({
	params: { page },
}: {
	params: {
		page: number;
	};
}) {
	return <PermissionsTable searchParams={{ page }} />;
}
