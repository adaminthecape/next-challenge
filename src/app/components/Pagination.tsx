import Link from 'next/link';
import { CSSRuleObject } from 'tailwindcss/types/config';

export default function Pagination({
	baseRoute,
	routeParams,
	pageParam = 'page',
	currentPage = 1,
	totalPages = 1,
}: {
	routeParams: Record<string, any>;
	pageParam?: string;
	baseRoute: string;
	currentPage: number;
	totalPages: number;
}) {
	function getUrl(isNext: boolean): string {
		const next = Math.ceil(Math.min(totalPages, (currentPage || 1) + 1));
		const prev = Math.ceil(Math.max(1, (currentPage || 1) - 1));
		const targetPage = isNext ? next : prev;

		const vars = baseRoute.match(/\[\w+\]/gi);
		let url = baseRoute.replace(
			`[${pageParam}]`,
			`${Math.ceil(targetPage)}`
		);

		if (vars?.length) {
			vars.forEach((variable) => {
				url = url.replace(
					variable,
					routeParams[variable.slice(1, -1)] || ''
				);
			});
		}

		return url;
	}

	const styles: Record<string, CSSRuleObject> = {};
	let linkKey = 0;

	return (
		<div className='join mt-4'>
			<Link
				key={linkKey}
				href={getUrl(false)}
			>
				<button className='join-item btn'>«</button>
			</Link>
			<button className='join-item btn'>
				Page {currentPage || 1} of {Math.ceil(totalPages)}
			</button>
			<Link href={getUrl(true)}>
				<button className='join-item btn'>»</button>
			</Link>
		</div>
	);
}
