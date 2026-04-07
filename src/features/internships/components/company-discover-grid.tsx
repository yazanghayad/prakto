'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { discoverCompaniesOptions } from '../api/discover-queries';
import type { DiscoverCompany } from '../api/discover-types';
import { industryOptions } from '@/features/company/constants/options';

// ─── Industry label helper ────────────────────────────────────

const INDUSTRY_MAP: Record<string, string> = Object.fromEntries(
  industryOptions.map((o) => [o.value, o.label])
);

function industryLabel(value: string): string {
  return INDUSTRY_MAP[value] || value;
}

// ─── Company Card ─────────────────────────────────────────────

function CompanyCard({ company }: Readonly<{ company: DiscoverCompany }>) {
  const [imgError, setImgError] = useState(false);

  const initials = company.companyName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className='group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md'>
      {/* Cover image */}
      <div className='relative h-36 w-full overflow-hidden bg-muted'>
        {company.coverUrl && !imgError ? (
          <img
            src={company.coverUrl}
            alt=''
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
            onError={() => setImgError(true)}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent'>
            <Icons.building className='h-10 w-10 text-muted-foreground/30' />
          </div>
        )}
      </div>

      {/* Content */}
      <div className='flex flex-1 flex-col px-4 pb-4 pt-3'>
        {/* Logo + name row */}
        <div className='flex items-start gap-3'>
          {/* Logo circle */}
          <div className='-mt-8 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-card bg-muted shadow-sm'>
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.companyName}
                className='h-full w-full object-cover'
              />
            ) : (
              <span className='text-sm font-bold text-muted-foreground'>{initials}</span>
            )}
          </div>
          <div className='min-w-0 flex-1 pt-1'>
            <h3 className='truncate text-sm font-semibold text-foreground'>
              {company.companyName}
            </h3>
            <p className='truncate text-xs text-muted-foreground'>
              {industryLabel(company.industry)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className='mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground'>
          {company.description || 'Ingen beskrivning tillgänglig.'}
        </p>

        {/* Meta */}
        <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          {company.city && (
            <span className='inline-flex items-center gap-1'>
              <Icons.mapPin className='h-3 w-3' />
              {company.city}
            </span>
          )}
          <span className='inline-flex items-center gap-1'>
            <Icons.briefcase className='h-3 w-3' />
            {company.activeInternships}{' '}
            {company.activeInternships === 1 ? 'aktiv praktikplats' : 'aktiva praktikplatser'}
          </span>
        </div>

        {/* Actions */}
        <div className='mt-4 flex items-center gap-2'>
          <Button asChild size='sm' className='flex-1 rounded-full'>
            <Link href={`/dashboard/internships/company/${company.$id}`}>Se företag</Link>
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8 shrink-0 rounded-full'
            asChild
            aria-label='Se och spara praktikplatser'
          >
            <Link href={`/dashboard/internships/company/${company.$id}`}>
              <Icons.bookmark className='h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Search & Filters Bar ─────────────────────────────────────

function SearchBar({
  search,
  industry,
  city,
  onSearch,
  onIndustryChange,
  onCityChange
}: Readonly<{
  search: string;
  industry: string;
  city: string;
  onSearch: (val: string) => void;
  onIndustryChange: (val: string) => void;
  onCityChange: (val: string) => void;
}>) {
  const [localSearch, setLocalSearch] = useState(search);

  return (
    <div className='rounded-xl border border-border bg-card p-4 shadow-sm'>
      {/* Search input */}
      <div className='relative'>
        <Icons.search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch(localSearch);
          }}
          placeholder='Sök företag...'
          className='pl-9'
        />
      </div>

      {/* Filters row */}
      <div className='mt-3 flex flex-wrap items-center gap-3'>
        <Select
          value={industry || '_all'}
          onValueChange={(v) => onIndustryChange(v === '_all' ? '' : v)}
        >
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='Bransch' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='_all'>Alla branscher</SelectItem>
            {industryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder='Plats'
          className='w-[200px]'
        />

        <Button onClick={() => onSearch(localSearch)} size='sm'>
          Sök
        </Button>
      </div>
    </div>
  );
}

// ─── Main Discover Grid ───────────────────────────────────────

export function CompanyDiscoverGrid() {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(12),
    search: parseAsString,
    industry: parseAsString,
    city: parseAsString
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.search && { search: params.search }),
    ...(params.industry && { industry: params.industry }),
    ...(params.city && { city: params.city })
  };

  const { data } = useSuspenseQuery(discoverCompaniesOptions(filters));
  const totalPages = Math.ceil(data.total / params.perPage);

  return (
    <div className='space-y-6'>
      {/* Search & filters */}
      <SearchBar
        search={params.search || ''}
        industry={params.industry || ''}
        city={params.city || ''}
        onSearch={(val) => void setParams({ search: val || null, page: 1 })}
        onIndustryChange={(val) => void setParams({ industry: val || null, page: 1 })}
        onCityChange={(val) => void setParams({ city: val || null, page: 1 })}
      />

      {/* Card grid */}
      {data.companies.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20'>
          <Icons.search className='mb-4 h-10 w-10 text-muted-foreground/30' />
          <h3 className='text-base font-semibold'>Inga företag hittades</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Försök med andra sökord eller filter.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {data.companies.map((company) => (
            <CompanyCard key={company.$id} company={company} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-muted-foreground'>
            Sida {params.page} av {totalPages} ({data.total} företag)
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={params.page <= 1}
              onClick={() => void setParams({ page: params.page - 1 })}
            >
              <Icons.chevronLeft className='mr-1 h-4 w-4' />
              Föregående
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={params.page >= totalPages}
              onClick={() => void setParams({ page: params.page + 1 })}
            >
              Nästa
              <Icons.chevronRight className='ml-1 h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

export function CompanyDiscoverSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Search bar skeleton */}
      <div className='rounded-xl border border-border bg-card p-4'>
        <Skeleton className='h-9 w-full' />
        <div className='mt-3 flex gap-3'>
          <Skeleton className='h-9 w-[200px]' />
          <Skeleton className='h-9 w-[200px]' />
          <Skeleton className='h-9 w-16' />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='flex flex-col overflow-hidden rounded-xl border border-border'>
            <Skeleton className='h-36 w-full' />
            <div className='px-4 pb-4 pt-3'>
              <div className='flex items-start gap-3'>
                <Skeleton className='-mt-8 h-14 w-14 rounded-full' />
                <div className='flex-1 space-y-1.5 pt-1'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                </div>
              </div>
              <div className='mt-3 space-y-1.5'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-4/5' />
              </div>
              <div className='mt-3 flex gap-3'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-3 w-28' />
              </div>
              <div className='mt-4 flex gap-2'>
                <Skeleton className='h-8 flex-1 rounded-full' />
                <Skeleton className='h-8 w-8 rounded-full' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
