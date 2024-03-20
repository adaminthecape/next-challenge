'use client';
import { useRouter } from 'next/navigation';
import { login } from '../../api';
import {
	CardTitle,
	CardDescription,
	CardHeader,
	CardContent,
	Card,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LoginPage() {
	const router = useRouter();

	const [username, setUsername] = useState<string>();
	const [password, setPassword] = useState<string>();

	const handleSubmit = async () => {
		if (!username || !password) {
			return;
		}

		const success = await login(username, password);

		if (success) {
			router.push('/');
			router.refresh();
		} else {
			alert('Login failed');
			router.push('/login');
			router.refresh();
		}
	};

	const styles = {
		loginContainer: {
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100vh',
		},
	};

	return (
		<div style={styles.loginContainer}>
			{username}/{password}
			<Card className='mx-auto max-w-sm'>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl font-bold'>Log in</CardTitle>
					<CardDescription>
						Enter your username and password to log in
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								placeholder='adam'
								required
								type='email'
								onChangeCapture={(e) =>
									setUsername(e.currentTarget.value)
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='password'>Password</Label>
							<Input
								id='password'
								required
								type='password'
								onChangeCapture={(e) =>
									setPassword(e.currentTarget.value)
								}
							/>
						</div>
						<Button
							className='w-full'
							type='submit'
							onClick={handleSubmit}
						>
							Login
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
