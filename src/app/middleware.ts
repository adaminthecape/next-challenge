import { NextResponse } from 'next/server';
import { IReq } from '../../sharedTypes';

// we are not exporting by default
export async function middleware(req: IReq) {
	if (req.cookies) {
		const cookie = req.cookies;
		console.log('middleware: cookie:', cookie);
	}
	const profile = null;
	// if profile exists you want to continue. Also
	// maybe user sends request for log-in, and if a user wants to login, obviously it has no token
	const { pathname } = (req as any).nextUrl;

	if (
		// whatever your api route for login is
		pathname.includes('/api/login') ||
		profile
	) {
		return NextResponse.next();
	}

	if (!profile && pathname !== '/login') {
		// since you want to redirect the user to "/"
		return NextResponse.redirect('/');
	}
}
