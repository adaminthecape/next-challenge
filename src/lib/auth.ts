import { login } from '@/api';
import { UUID } from 'crypto';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const authOptions: NextAuthOptions = {
	session: {
		strategy: 'jwt',
	},
	providers: [
		CredentialsProvider({
			name: 'Sign in',
			credentials: {
				email: {
					label: 'Username',
					type: 'text',
					placeholder: 'my_name_456',
					value: 'adam',
				},
				password: {
					label: 'Password',
					type: 'password',
					value: 'password1',
				},
			},
			async authorize(credentials) {
				const authResult: any = await login(
					credentials?.email as string,
					credentials?.password as string
				);

				if (authResult?.token) {
					cookies().set('client-jwt', authResult.token);

					return {
						id: authResult.id,
						name: authResult.name,
						email: authResult.email,
						token: authResult.token,
					};
				}

				return null;
			},
		}),
	],
	callbacks: {
		// async signIn({ user, account, profile, email, credentials }) {
		// 	redirect(`/portal/login/${(user as any).token}`);
		// },
		// async redirect({ url, baseUrl }) {
		// 	// const jwt = cookies().get('client-jwt');

		// 	// return `${baseUrl}/portal/login/${jwt}`;
		// 	return url;
		// },
		session: ({ session, token }) => {
			return {
				...session,
				user: {
					...session.user,
					id: token.id,
					token: token.token,
				},
			};
		},
		jwt: ({ token, user }) => {
			if (user) {
				const u = user as unknown as any;
				return {
					...token,
					id: u.id,
					token: u.token,
				};
			}
			return token;
		},
	},
};

/**
 * Sugar function to avoid importing authOptions & get the user id/token only.
 * @returns
 */
export async function getServerUser(): Promise<
	undefined | { userId: UUID; jwt: string; username: string }
> {
	const session: null | {
		user: {
			id: string;
			token: string;
			name: string;
			// and some other stuff we don't need here
		};
	} = await getServerSession(authOptions);

	if (!session?.user?.token) {
		return undefined;
	}

	return {
		userId: session.user.id as UUID,
		jwt: session.user.token,
		username: session.user.name,
	};
}

/**
 * In a server component, if this is NOT an authenticated user, execute a
 * callback, such as a redirect. If no callback is provided, the user is
 * redirected to the login page.
 * @param cb
 * @returns Whether the user is authenticated.
 */
export async function validateServerUser(cb?: () => void): Promise<boolean> {
	const session = await getServerUser();

	if (!session?.jwt) {
		cb ? cb() : redirect('/api/auth/signin');

		return false;
	}

	return true;
}

export async function validateClientUser(cb?: () => void): Promise<boolean> {
	const jwt = cookies().get('jwt');

	if (!jwt) {
		cb ? cb() : redirect('/api/auth/signin');

		return false;
	}

	return true;
}
