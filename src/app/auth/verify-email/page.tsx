'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import Image from 'next/image';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'input' | 'verifying' | 'success' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setErrorMessage('');

    // Move to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && newCode.every((d) => d)) {
      handleVerify(newCode.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);

    // Focus last filled or next empty
    const nextEmpty = newCode.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    // Auto-submit if complete
    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  }

  async function handleVerify(codeStr?: string) {
    const fullCode = codeStr || code.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Ange alla 6 siffror.');
      return;
    }

    setStatus('verifying');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: fullCode })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Verifieringen misslyckades.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setStatus('error');
      setErrorMessage('Något gick fel. Försök igen.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  }

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', email })
      });
      const data = await res.json();
      if (data.alreadyVerified) {
        router.push('/dashboard');
        return;
      }
      setResent(true);
      setErrorMessage('');
      setStatus('input');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      // Reset "resent" after 30s
      setTimeout(() => setResent(false), 30000);
    } catch {
      // silent
    } finally {
      setResending(false);
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950'>
      <div className='mx-auto w-full max-w-md text-center'>
        <div className='mb-8'>
          <Image
            src='/logo-dark.png'
            alt='Prakto'
            width={180}
            height={50}
            className='mx-auto h-10 w-auto dark:hidden'
            priority
          />
          <Image
            src='/logo-light.png'
            alt='Prakto'
            width={180}
            height={50}
            className='mx-auto hidden h-10 w-auto dark:block'
            priority
          />
        </div>

        {/* Success */}
        {status === 'success' && (
          <div className='space-y-4'>
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
              <Icons.check className='h-8 w-8 text-green-600 dark:text-green-400' />
            </div>
            <h1 className='text-2xl font-bold tracking-tight'>E-post verifierad!</h1>
            <p className='text-muted-foreground'>
              Din e-postadress har verifierats. Logga in för att komma igång.
            </p>
            <Button onClick={() => router.push('/auth/sign-in?verified=1')} className='mt-4'>
              Logga in
            </Button>
          </div>
        )}

        {/* Input / Error / Verifying */}
        {status !== 'success' && (
          <div className='space-y-6'>
            <div className='space-y-2'>
              <div className='bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
                <Icons.mail className='text-primary h-8 w-8' />
              </div>
              <h1 className='text-2xl font-bold tracking-tight'>Verifiera din e-post</h1>
              <p className='text-muted-foreground'>
                Vi har skickat en 6-siffrig kod till{' '}
                {email ? <strong className='text-foreground'>{email}</strong> : 'din e-postadress'}
              </p>
            </div>

            {/* Code inputs */}
            <div className='flex justify-center gap-2' onPaste={handlePaste}>
              {code.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type='text'
                  inputMode='numeric'
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={status === 'verifying'}
                  className='h-14 w-12 text-center text-2xl font-bold'
                  autoComplete='one-time-code'
                />
              ))}
            </div>

            {/* Error message */}
            {errorMessage && <p className='text-destructive text-sm'>{errorMessage}</p>}

            {/* Verifying spinner */}
            {status === 'verifying' && (
              <div className='flex items-center justify-center gap-2'>
                <Icons.spinner className='h-4 w-4 animate-spin' />
                <span className='text-muted-foreground text-sm'>Verifierar...</span>
              </div>
            )}

            {/* Actions */}
            <div className='space-y-2 pt-2'>
              <Button
                onClick={() => handleVerify()}
                disabled={status === 'verifying' || code.some((d) => !d)}
                className='w-full'
              >
                {status === 'verifying' && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
                Verifiera
              </Button>

              <div className='flex items-center justify-center gap-1 pt-2'>
                <span className='text-muted-foreground text-sm'>Fick du ingen kod?</span>
                <Button
                  variant='link'
                  size='sm'
                  onClick={handleResend}
                  disabled={resending || resent}
                  className='h-auto p-0 text-sm'
                >
                  {resending ? 'Skickar...' : resent ? 'Kod skickad!' : 'Skicka igen'}
                </Button>
              </div>

              <Button
                variant='ghost'
                onClick={() => router.push('/auth/sign-in')}
                className='w-full'
              >
                Tillbaka till inloggningen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <Icons.spinner className='h-8 w-8 animate-spin' />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
