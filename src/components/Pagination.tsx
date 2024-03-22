import Link from 'next/link';
import { CSSRuleObject } from 'tailwindcss/types/config';

export default function Pagination({
	baseRoute,
	routeParams,
	pageParam = 'page',
	currentPage = 1,
	totalPages = 1,
	replaceMap,
}: {
	routeParams: Record<string, any>;
	pageParam?: string;
	baseRoute: string;
	currentPage: number;
	totalPages: number;
	replaceMap?: Record<string, string>;
}) {
	function getUrl(isNext: boolean): string {
		let current = currentPage ?? 1;

		if (typeof currentPage === 'string') {
			current = parseInt(currentPage, 10);
		}

		const next = Math.ceil(Math.min(totalPages, current + 1));
		const prev = Math.ceil(Math.max(1, current - 1));
		const targetPage = isNext ? next : prev;

		console.log({ next, prev, targetPage, current });

		let vars = baseRoute.match(/\[\w+\]/gi) as string[];
		let url = baseRoute.replace(
			`[${pageParam}]`,
			`${Math.ceil(targetPage)}`
		);

		vars = vars.filter((variable) => variable !== `[${pageParam}]`);

		if (vars?.length) {
			vars.forEach((variable) => {
				const key = variable.slice(1, -1);
				const val = routeParams[variable.slice(1, -1)];

				if (typeof val === 'undefined') {
					url = url.replace(`/${variable}`, replaceMap?.[key] || '');
				} else {
					url = url.replace(variable, val);
				}
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
