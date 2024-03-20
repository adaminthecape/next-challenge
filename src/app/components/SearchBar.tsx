'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SearchBar({
	placeholder = 'Search...',
	routeParams,
	keywordParam = 'keyword',
	baseRoute,
}: {
	placeholder?: string;
	routeParams: Record<string, any>;
	keywordParam?: string;
	baseRoute: string;
}) {
	function getUrl(): string {
		const vars = baseRoute.match(/\[\w+\]/gi);
		let url = baseRoute.replace(`[${keywordParam}]`, `${keyword}`);

		if (vars?.length) {
			vars.forEach((variable) => {
				url = url.replace(variable, routeParams[variable.slice(1, -1)]);
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
