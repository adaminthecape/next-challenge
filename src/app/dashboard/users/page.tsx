import { redirect } from 'next/navigation';

export default function goAway() {
	redirect('/dashboard/users/table/1');
}
