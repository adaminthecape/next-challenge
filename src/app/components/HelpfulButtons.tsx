'use client';

import { signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export const LoginButton = () => {
	return (
		<button
			className='btn btn-primary'
			onClick={() => signIn()}
		>
			Sign in
		</button>
	);
};

export const RegisterButton = () => {
	return <Link href='/register'>Register</Link>;
};

export const LogoutButton = () => {
	return (
		<button
			className='btn'
			onClick={() => signOut()}
		>
			Sign Out
		</button>
	);
};

export const ProfileButton = () => {
	return (
		<Link href='/profile'>
			<button className='btn'>Profile</button>
		</Link>
	);
};
