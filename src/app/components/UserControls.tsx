'use client';
import Avatar from 'boring-avatars';
import { UUID } from 'crypto';
import Cookies from 'js-cookie';
import Link from 'next/link';
import React, { useState } from 'react';
import { CSSRuleObject } from 'tailwindcss/types/config';

export default function UserControls({
	user,
}: {
	user: { userId: UUID; username: string; jwt: string };
}) {
	const [isMenuActive, setMenuActive] = useState<boolean>(false);

	const toggleMenu = (e: any) => {
		!isMenuActive ? setMenuActive(true) : setMenuActive(false);
	};

	const styles: Record<string, CSSRuleObject> = {
		menuActive: {
			position: 'absolute',
			top: '74px',
			right: '10px',
			zIndex: '6000',
		},
	};

	return (
		<div>
			<div
				className='card w-auto bg-base-100 shadow-xl p-2 m-2'
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
				}}
				onClick={toggleMenu}
			>
				<Avatar
					size={40}
					name={user.userId}
					variant='marble'
					colors={[
						'#92A1C6',
						'#146A7C',
						'#F0AB3D',
						'#C271B4',
						'#C20D90',
					]}
				/>
				<div className='ml-2'>{user.username}</div>
			</div>
			<ul
				className='menu bg-base-200 w-56 rounded-box'
				style={!isMenuActive ? { display: 'none' } : styles.menuActive}
			>
				<li>
					<Link href='/dashboard/overview'>Admin Dashboard</Link>
				</li>
				<li>
					<a>Search for users</a>
				</li>
				<li>
					<a>Search for groups</a>
				</li>
				<li>
					<a>Log out</a>
				</li>
			</ul>
		</div>
	);
}
