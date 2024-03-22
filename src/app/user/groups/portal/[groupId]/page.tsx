import { UUID } from 'crypto';
import { redirect } from 'next/navigation';

export default async function RedirectToGroup({
	params: { groupId },
}: {
	params: { groupId: UUID };
}) {
	const url = `/user/groups/${groupId}`;

	console.log('redirecting to', url);

	redirect(url);

	console.log('redirected to', url);

	return <></>;
}
