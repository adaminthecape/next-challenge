import { redirect } from 'next/navigation';

export default function goAway({ params: { page } }: any) {
	redirect(`/dashboard/permissions/table/${page}`);
}
