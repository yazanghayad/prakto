'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InteractiveGridPattern } from './interactive-grid';
import { toast } from 'sonner';

export default function SignInViewPage() {
  const { login } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const verified = searchParams.get('verified');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Show toast if coming from email verification
  useEffect(() => {
    if (verified === '1') {
      toast.success('E-postadressen har verifierats! Logga in för att fortsätta.');
    }
  }, [verified]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Rate limit')) {
        setError('För många försök. Vänta en stund och försök igen.');
      } else if (err instanceof Error && err.message.includes('credentials')) {
        setError('Felaktigt e-postadress eller lösenord.');
      } else {
        const message = err instanceof Error ? err.message : 'Något gick fel. Försök igen.';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center'>
          <Image
            src='/logo-light.png'
            alt='Prakto'
            width={220}
            height={60}
            className='h-14 w-auto'
            priority
          />
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>&ldquo;Hitta rätt praktikplats — snabbt och enkelt.&rdquo;</p>
            <footer className='text-sm'>Prakto</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>Logga in</h1>
            <p className='text-muted-foreground text-sm'>
              Ange din e-postadress och lösenord för att logga in
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>E-postadress</Label>
              <Input
                id='email'
                type='email'
                placeholder='namn@exempel.se'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
                disabled={isLoading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Lösenord</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
                disabled={isLoading}
              />
            </div>
            {error && <p className='text-destructive text-sm'>{error}</p>}
            <Button type='submit' className='w-full' isLoading={isLoading}>
              Logga in
            </Button>
          </form>

          <p className='text-muted-foreground text-center text-sm'>
            Har du inget konto?{' '}
            <Link href='/auth/sign-up' className='hover:text-primary underline underline-offset-4'>
              Skapa konto
            </Link>
          </p>

          <p className='text-muted-foreground px-8 text-center text-xs'>
            Genom att logga in godkänner du våra{' '}
            <Link
              href='/terms-of-service'
              className='hover:text-primary underline underline-offset-4'
            >
              Användarvillkor
            </Link>{' '}
            och{' '}
            <Link
              href='/privacy-policy'
              className='hover:text-primary underline underline-offset-4'
            >
              Integritetspolicy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
