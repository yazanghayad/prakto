'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { contactListOptions, contactKeys } from '../api/queries';
import { createContact, deleteContact, updateContact } from '../api/service';
import type { ContactDoc } from '../api/types';

// ─── New Contact Dialog ───────────────────────────────────────

function NewContactDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      setOpen(false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      name: fd.get('name') as string,
      role: (fd.get('role') as string) ?? '',
      company: (fd.get('company') as string) ?? '',
      email: (fd.get('email') as string) ?? '',
      phone: (fd.get('phone') as string) ?? '',
      notes: (fd.get('notes') as string) ?? ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className='mr-2 h-4 w-4' />
          Ny kontakt
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Lägg till kontakt</DialogTitle>
        </DialogHeader>
        <form id='contact-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='c-name'>Namn</Label>
              <Input id='c-name' name='name' placeholder='Förnamn Efternamn' required />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='c-role'>Roll</Label>
              <Input id='c-role' name='role' placeholder='T.ex. Handledare' />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='c-company'>Företag</Label>
            <Input id='c-company' name='company' placeholder='Företagsnamn' />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='c-email'>E-post</Label>
              <Input id='c-email' name='email' type='email' placeholder='namn@foretag.se' />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='c-phone'>Telefon</Label>
              <Input id='c-phone' name='phone' placeholder='070-123 45 67' />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='c-notes'>Anteckningar</Label>
            <Textarea
              id='c-notes'
              name='notes'
              placeholder='Hur ni träffades, vad ni pratade om...'
            />
          </div>
        </form>
        <DialogFooter>
          <Button type='submit' form='contact-form' isLoading={mutation.isPending}>
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contact Card ─────────────────────────────────────────────

function ContactCard({ contact }: { contact: ContactDoc }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const updateMut = useMutation({
    mutationFn: (d: Partial<ContactDoc>) => updateContact(contact.$id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      setEditing(false);
    }
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteContact(contact.$id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all })
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMut.mutate({
      name: fd.get('name') as string,
      role: fd.get('role') as string,
      company: fd.get('company') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      notes: fd.get('notes') as string
    });
  };

  if (editing) {
    return (
      <Card>
        <CardContent className='pt-4'>
          <form className='grid gap-3' onSubmit={handleUpdate}>
            <div className='grid grid-cols-2 gap-3'>
              <Input name='name' defaultValue={contact.name} placeholder='Namn' />
              <Input name='role' defaultValue={contact.role} placeholder='Roll' />
            </div>
            <Input name='company' defaultValue={contact.company} placeholder='Företag' />
            <div className='grid grid-cols-2 gap-3'>
              <Input name='email' defaultValue={contact.email} placeholder='E-post' />
              <Input name='phone' defaultValue={contact.phone} placeholder='Telefon' />
            </div>
            <Textarea name='notes' defaultValue={contact.notes} placeholder='Anteckningar' />
            <div className='flex gap-2'>
              <Button type='submit' size='sm' isLoading={updateMut.isPending}>
                Spara
              </Button>
              <Button type='button' variant='outline' size='sm' onClick={() => setEditing(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className='pt-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
              <Icons.user className='text-primary h-5 w-5' />
            </div>
            <div>
              <p className='text-sm font-semibold'>{contact.name}</p>
              <p className='text-muted-foreground text-xs'>
                {[contact.role, contact.company].filter(Boolean).join(' · ') ||
                  'Ingen roll/företag'}
              </p>
            </div>
          </div>
          <div className='flex gap-0.5'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => setEditing(true)}
            >
              <Icons.edit className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='text-destructive h-7 w-7'
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              <Icons.trash className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className='mt-3 flex flex-wrap gap-3 text-xs'>
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className='text-primary flex items-center gap-1 hover:underline'
            >
              <Icons.mail className='h-3.5 w-3.5' /> {contact.email}
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className='text-primary flex items-center gap-1 hover:underline'
            >
              <Icons.phone className='h-3.5 w-3.5' /> {contact.phone}
            </a>
          )}
        </div>

        {contact.notes && (
          <p className='text-muted-foreground mt-2 text-xs whitespace-pre-wrap'>{contact.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LiaContactsPage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';
  const { data: contacts, isLoading } = useQuery(contactListOptions(userId));

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  const sorted = [...(contacts ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'sv'));

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <NewContactDialog />
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <Icons.addressBook className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='text-lg font-semibold'>Inga kontakter ännu</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Spara personer du träffar under din praktik — handledare, kollegor, kontaktpersoner.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2'>
          {sorted.map((c) => (
            <ContactCard key={c.$id} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}
