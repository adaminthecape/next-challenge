import PermissionsTable from '@/components/AdminDashboard/Permissions/PermissionsTable';

export default function PermissionsTableDisplay({
	params: { page, scope, username },
}: {
	params: {
		page: number;
		scope: string;
		username: string;
	};
}) {
	return (
		<PermissionsTable
			searchParams={
				scope === 'any' ? { page, username } : { page, scope, username }
			}
		/>
	);
}
