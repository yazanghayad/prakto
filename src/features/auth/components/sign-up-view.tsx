'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { USER_ROLES, ROLE_LABELS } from '@/types/platform';
import type { UserRole } from '@/types/platform';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { InteractiveGridPattern } from './interactive-grid';

export default function SignUpViewPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Only allow non-admin roles in self-registration
  const registrableRoles = USER_ROLES.filter((r) => r !== 'admin');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      setError('Välj en roll.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Create account + profile (no session — must verify email first)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registrering misslyckades');

      // Redirect to verification page
      router.push('/auth/verify-email?email=' + encodeURIComponent(email));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Något gick fel. Försök igen.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center'>
          <Image
            src='/logo-light.png'
            alt='Prakto'
            width={220}
            height={60}
            className='h-11 w-auto'
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
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>Skapa konto</h1>
            <p className='text-muted-foreground text-sm'>
              Fyll i uppgifterna nedan för att registrera dig
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Namn</Label>
              <Input
                id='name'
                type='text'
                placeholder='Ditt fullständiga namn'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete='name'
                disabled={isLoading}
              />
            </div>
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
                placeholder='Minst 8 tecken'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete='new-password'
                disabled={isLoading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='role'>Jag är</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger id='role'>
                  <SelectValue placeholder='Välj din roll' />
                </SelectTrigger>
                <SelectContent>
                  {registrableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className='text-destructive text-sm'>{error}</p>}
            <Button type='submit' className='w-full' isLoading={isLoading}>
              Skapa konto
            </Button>
          </form>

          <p className='text-muted-foreground text-center text-sm'>
            Har du redan ett konto?{' '}
            <Link href='/auth/sign-in' className='hover:text-primary underline underline-offset-4'>
              Logga in
            </Link>
          </p>

          <p className='text-muted-foreground px-8 text-center text-xs'>
            Genom att registrera dig godkänner du våra{' '}
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
