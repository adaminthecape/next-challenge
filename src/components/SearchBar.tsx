'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SearchBar({
	placeholder = 'Search...',
	routeParams,
	keywordParam = 'keyword',
	baseRoute,
	replaceMap,
}: {
	placeholder?: string;
	routeParams: Record<string, any>;
	keywordParam?: string;
	baseRoute: string;
	replaceMap?: Record<string, string>;
}) {
	function getUrl(): string {
		let vars = baseRoute.match(/\[\w+\]/gi) as string[];
		let url = baseRoute.replace(`[${keywordParam}]`, `${keyword}`);

		vars = vars.filter((variable) => variable !== `[${keywordParam}]`);

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

	let linkKey = 0;

	const [keyword, setKeyword] = useState('');

	return (
		<div style={{ display: 'flex' }}>
			<input
				type='text'
				placeholder={placeholder}
				className='input input-bordered w-full max-w-xs mr-2'
				onChangeCapture={(e) => {
					setKeyword(e.currentTarget.value);
					linkKey += 1;
				}}
			/>
			{/* TODO: Make this add/replace the search string in the url query and redirect to that route */}
			<Link
				href={getUrl()}
				key={linkKey}
			>
				<button className='btn btn-success'>
					<Search />
				</button>
			</Link>
		</div>
	);
}
