import { redirect } from 'next/navigation';

export default function goAway() {
	redirect('/user/groups/list/1');
}
