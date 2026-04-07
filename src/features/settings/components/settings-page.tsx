'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

async function accountAction(body: Record<string, string>) {
  const res = await fetch('/api/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Något gick fel.');
  return data;
}

export default function SettingsPage() {
  const { user, profile, isLoading, logout } = useUser();
  const router = useRouter();

  // ─── Email state ──────────────────────────────────────────
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // ─── Password state ──────────────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ─── Delete state ─────────────────────────────────────────
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (isLoading) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  const currentEmail = user?.email ?? profile?.email ?? '';

  // ─── Handlers ─────────────────────────────────────────────

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setEmailLoading(true);
    try {
      await accountAction({ action: 'update-email', newEmail: newEmail.trim() });
      toast.success('E-postadressen har uppdaterats.');
      setNewEmail('');
      // Reload to reflect new email
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte uppdatera e-post.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error('Lösenorden matchar inte.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Lösenordet måste vara minst 8 tecken.');
      return;
    }

    setPasswordLoading(true);
    try {
      await accountAction({ action: 'update-password', newPassword });
      toast.success('Lösenordet har uppdaterats.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte uppdatera lösenord.');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await accountAction({ action: 'delete-account' });
      toast.success('Ditt konto har raderats.');
      await logout();
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte radera kontot.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className='space-y-6'>
      {/* ── Email ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.mail className='h-5 w-5' />
            E-postadress
          </CardTitle>
          <CardDescription>
            Din nuvarande e-postadress är <strong>{currentEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='new-email'>Ny e-postadress</Label>
              <Input
                id='new-email'
                type='email'
                placeholder='ny@epost.se'
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <Button type='submit' disabled={emailLoading || !newEmail.trim()}>
              {emailLoading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
              Uppdatera e-post
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Password ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.lock className='h-5 w-5' />
            Lösenord
          </CardTitle>
          <CardDescription>Byt ditt lösenord. Minst 8 tecken.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='new-password'>Nytt lösenord</Label>
              <Input
                id='new-password'
                type='password'
                placeholder='••••••••'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirm-password'>Bekräfta lösenord</Label>
              <Input
                id='confirm-password'
                type='password'
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type='submit' disabled={passwordLoading || !newPassword || !confirmPassword}>
              {passwordLoading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
              Uppdatera lösenord
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Delete account ─────────────────────────────────── */}
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-destructive flex items-center gap-2'>
            <Icons.warning className='h-5 w-5' />
            Radera konto
          </CardTitle>
          <CardDescription>
            Denna åtgärd är permanent och kan inte ångras. All din data raderas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive'>Radera mitt konto</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Denna åtgärd kan inte ångras. Ditt konto och all tillhörande data raderas
                  permanent. Skriv <strong className='text-foreground'>radera</strong> nedan för att
                  bekräfta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className='py-2'>
                <Input
                  placeholder='Skriv "radera" för att bekräfta'
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                  Avbryt
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'radera' || deleteLoading}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                >
                  {deleteLoading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
                  Radera permanent
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
