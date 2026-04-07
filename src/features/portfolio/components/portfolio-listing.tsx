'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createPortfolioMutation,
  updatePortfolioMutation,
  deletePortfolioMutation
} from '../api/mutations';
import { uploadPortfolioFile, getPortfolioFileUrl } from '../api/service';
import type { PortfolioItemDoc, PortfolioItemPayload } from '../api/types';
import { portfolioItemSchema, type PortfolioItemFormValues } from '../schemas/portfolio';
import { portfolioTypeOptions, portfolioTypeLabels, popularTags } from '../constants/options';

// ─── Portfolio Card ───────────────────────────────────────────

function PortfolioCard({
  item,
  onEdit,
  onDelete,
  deleting
}: Readonly<{
  item: PortfolioItemDoc;
  onEdit: (item: PortfolioItemDoc) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}>) {
  return (
    <Card className='group relative transition-shadow hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='truncate text-base'>{item.title}</CardTitle>
            <CardDescription className='mt-1'>
              <Badge variant='secondary' className='text-xs'>
                {portfolioTypeLabels[item.type] ?? item.type}
              </Badge>
            </CardDescription>
          </div>
          <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
            <Button variant='ghost' size='sm' onClick={() => onEdit(item)}>
              <Icons.edit className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onDelete(item.$id)}
              disabled={deleting}
            >
              <Icons.trash className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-muted-foreground line-clamp-3 text-sm'>{item.description}</p>

        {/* Links */}
        <div className='flex flex-wrap gap-2'>
          {item.projectUrl && (
            <a
              href={item.projectUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
            >
              <Icons.externalLink className='h-3.5 w-3.5' />
              Projekt
            </a>
          )}
          {item.githubUrl && (
            <a
              href={item.githubUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
            >
              <Icons.github className='h-3.5 w-3.5' />
              GitHub
            </a>
          )}
          {item.fileIds?.length > 0 && (
            <span className='text-muted-foreground inline-flex items-center gap-1 text-sm'>
              <Icons.paperclip className='h-3.5 w-3.5' />
              {item.fileIds.length} fil{item.fileIds.length !== 1 ? 'er' : ''}
            </span>
          )}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className='flex flex-wrap gap-1'>
            {item.tags.map((tag) => (
              <Badge key={tag} variant='outline' className='text-xs'>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tag Picker ───────────────────────────────────────────────

function TagPicker({
  selected,
  onToggle,
  onAddCustom
}: Readonly<{
  selected: string[];
  onToggle: (value: string) => void;
  onAddCustom: (value: string) => void;
}>) {
  const [custom, setCustom] = useState('');

  const handleAdd = () => {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onAddCustom(trimmed);
      setCustom('');
    }
  };

  return (
    <div className='space-y-3'>
      {selected.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {selected.map((tag) => (
            <button
              key={tag}
              type='button'
              onClick={() => onToggle(tag)}
              className='bg-primary text-primary-foreground border-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors'
            >
              {tag}
              <Icons.close className='h-3 w-3' />
            </button>
          ))}
        </div>
      )}
      <div>
        <p className='text-muted-foreground mb-1.5 text-xs'>Populära taggar:</p>
        <div className='flex flex-wrap gap-1.5'>
          {popularTags
            .filter((t) => !selected.includes(t))
            .slice(0, 12)
            .map((tag) => (
              <button
                key={tag}
                type='button'
                onClick={() => onToggle(tag)}
                className='bg-background hover:bg-muted border-input inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors'
              >
                <Icons.add className='h-2.5 w-2.5' />
                {tag}
              </button>
            ))}
        </div>
      </div>
      <div className='flex gap-2'>
        <input
          type='text'
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder='Lägg till egen tagg...'
          className='border-input bg-background placeholder:text-muted-foreground flex h-9 flex-1 rounded-md border px-3 text-sm'
        />
        <Button type='button' variant='outline' size='sm' onClick={handleAdd}>
          <Icons.add className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

// ─── File Upload Section ──────────────────────────────────────

function PortfolioFileUpload({
  fileIds,
  onFileUploaded,
  onRemoveFile
}: Readonly<{
  fileIds: string[];
  onFileUploaded: (fileId: string) => void;
  onRemoveFile: (fileId: string) => void;
}>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Filen är för stor. Max 25 MB.');
      return;
    }
    setUploading(true);
    try {
      const fileId = await uploadPortfolioFile(file);
      onFileUploaded(fileId);
      toast.success('Fil uppladdad!');
    } catch {
      toast.error('Kunde inte ladda upp fil.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium'>
        Filer <span className='text-muted-foreground'>(valfritt, max 25 MB per fil)</span>
      </p>

      {fileIds.length > 0 && (
        <div className='space-y-2'>
          {fileIds.map((fid) => (
            <div key={fid} className='bg-muted flex items-center gap-3 rounded-lg p-2'>
              <Icons.page className='h-4 w-4 shrink-0' />
              <a
                href={getPortfolioFileUrl(fid)}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary min-w-0 flex-1 truncate text-sm hover:underline'
              >
                Visa fil
              </a>
              <Button type='button' variant='ghost' size='sm' onClick={() => onRemoveFile(fid)}>
                <Icons.trash className='h-3.5 w-3.5' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <button
        type='button'
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className='border-input hover:bg-muted flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors'
      >
        {uploading ? (
          <Icons.spinner className='h-5 w-5 animate-spin' />
        ) : (
          <Icons.upload className='text-muted-foreground h-5 w-5' />
        )}
        <p className='text-sm'>{uploading ? 'Laddar upp...' : 'Ladda upp fil'}</p>
      </button>
      <input
        ref={fileInputRef}
        type='file'
        accept='.pdf,.png,.jpg,.jpeg,.zip,.doc,.docx'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}

// ─── Portfolio Form Dialog ────────────────────────────────────

function PortfolioFormDialog({
  open,
  onOpenChange,
  editItem
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: PortfolioItemDoc | null;
}>) {
  const isEdit = !!editItem;
  const [tags, setTags] = useState<string[]>(editItem?.tags ?? []);
  const [fileIds, setFileIds] = useState<string[]>(editItem?.fileIds ?? []);

  const createMut = useMutation({
    ...createPortfolioMutation,
    onSuccess: () => {
      toast.success('Portfoliopost skapad!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte skapa post.');
    }
  });

  const updateMut = useMutation({
    ...updatePortfolioMutation,
    onSuccess: () => {
      toast.success('Portfoliopost uppdaterad!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte uppdatera post.');
    }
  });

  const form = useAppForm({
    defaultValues: {
      title: editItem?.title ?? '',
      description: editItem?.description ?? '',
      type: editItem?.type ?? 'project',
      projectUrl: editItem?.projectUrl ?? '',
      githubUrl: editItem?.githubUrl ?? '',
      fileIds: editItem?.fileIds ?? [],
      tags: editItem?.tags ?? []
    } as PortfolioItemFormValues,
    validators: {
      onSubmit: portfolioItemSchema
    },
    onSubmit: ({ value }) => {
      const payload: PortfolioItemPayload = {
        ...value,
        tags,
        fileIds
      };
      if (isEdit) {
        updateMut.mutate({ id: editItem.$id, data: payload });
      } else {
        createMut.mutate(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<PortfolioItemFormValues>();

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Redigera portfoliopost' : 'Lägg till portfoliopost'}</DialogTitle>
        </DialogHeader>

        <form.AppForm>
          <form.Form className='space-y-5'>
            <FormTextField
              name='title'
              label='Titel'
              required
              placeholder='T.ex. E-handelsplattform'
              validators={{
                onBlur: z.string().min(2, 'Titel måste vara minst 2 tecken.')
              }}
            />

            <FormTextareaField
              name='description'
              label='Beskrivning'
              required
              placeholder='Beskriv projektet, din roll och vilka tekniker som användes...'
              maxLength={1000}
              rows={4}
              validators={{
                onBlur: z.string().min(10, 'Beskrivning måste vara minst 10 tecken.')
              }}
            />

            <FormSelectField
              name='type'
              label='Typ'
              required
              options={portfolioTypeOptions}
              placeholder='Välj typ'
            />

            <FormTextField
              name='projectUrl'
              label='Projekt-URL'
              placeholder='https://mitt-projekt.se'
            />

            <FormTextField
              name='githubUrl'
              label='GitHub-URL'
              placeholder='https://github.com/användarnamn/repo'
            />

            {/* Tags */}
            <div className='space-y-2'>
              <p className='text-sm font-medium'>Taggar</p>
              <TagPicker
                selected={tags}
                onToggle={(tag) =>
                  setTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                onAddCustom={(tag) => setTags((prev) => [...prev, tag])}
              />
            </div>

            {/* Files */}
            <PortfolioFileUpload
              fileIds={fileIds}
              onFileUploaded={(fid) => setFileIds((prev) => [...prev, fid])}
              onRemoveFile={(fid) => setFileIds((prev) => prev.filter((f) => f !== fid))}
            />

            <div className='flex justify-end gap-3 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Avbryt
              </Button>
              <Button type='submit' disabled={isPending} isLoading={isPending}>
                {isEdit ? 'Spara ändringar' : 'Lägg till'}
              </Button>
            </div>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState({ onAdd }: Readonly<{ onAdd: () => void }>) {
  return (
    <div className='py-16 text-center'>
      <p className='text-muted-foreground text-sm'>Ingen portfolio ännu.</p>
      <p className='text-muted-foreground mt-1 text-sm'>
        Lägg till projektarbeten, GitHub-länkar och designportfolios.
      </p>
      <Button onClick={onAdd} variant='outline' className='mt-4'>
        <Icons.add className='mr-2 h-4 w-4' />
        Lägg till projekt
      </Button>
    </div>
  );
}

// ─── Main Portfolio Listing Component ─────────────────────────

interface PortfolioListingProps {
  items: PortfolioItemDoc[];
}

export default function PortfolioListing({ items }: Readonly<PortfolioListingProps>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItemDoc | null>(null);

  const deleteMut = useMutation({
    ...deletePortfolioMutation,
    onSuccess: () => {
      toast.success('Portfoliopost borttagen.');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte ta bort post.');
    }
  });

  const handleEdit = (item: PortfolioItemDoc) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditItem(null);
  };

  if (items.length === 0) {
    return (
      <>
        <EmptyState onAdd={handleAdd} />
        <PortfolioFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogChange}
          editItem={editItem}
        />
      </>
    );
  }

  return (
    <>
      <div className='mb-4 flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {items.length} projekt{items.length !== 1 ? '' : ''}
        </p>
        <Button onClick={handleAdd} size='sm'>
          <Icons.add className='mr-2 h-4 w-4' />
          Lägg till
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {items.map((item) => (
          <PortfolioCard
            key={item.$id}
            item={item}
            onEdit={handleEdit}
            onDelete={(id) => deleteMut.mutate(id)}
            deleting={deleteMut.isPending}
          />
        ))}
      </div>

      <PortfolioFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        editItem={editItem}
      />
    </>
  );
}
