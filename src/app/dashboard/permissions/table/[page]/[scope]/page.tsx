import PermissionsTable from '@/components/AdminDashboard/Permissions/PermissionsTable';

export default function PermissionsTableDisplay({
	params: { page, scope },
}: {
	params: {
		page: number;
		scope: string;
	};
}) {
	return (
		<PermissionsTable
			searchParams={scope === 'any' ? { page } : { page, scope }}
		/>
	);
}
