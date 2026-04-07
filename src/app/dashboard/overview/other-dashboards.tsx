'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30_000
  });
}

export function OtherDashboards({ role }: { role: string }) {
  if (role === 'company') return <CompanyDashboard />;
  if (role === 'education_manager') return <EducationManagerDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <GuestDashboard />;
}

function CompanyDashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  const approvalLabel: Record<string, string> = {
    pending: 'Väntar',
    approved: 'Godkänd',
    rejected: 'Avvisad',
    no_profile: 'Ej registrerad'
  };

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        title='Aktiva annonser'
        value={isLoading ? '...' : String(stats?.activeListings ?? 0)}
        description={`${stats?.totalListings ?? 0} totalt`}
        icon={<Icons.briefcase className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Nya ansökningar'
        value={isLoading ? '...' : String(stats?.newApplications ?? 0)}
        description='Ansökningar att granska'
        icon={<Icons.applications className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Tillsatta platser'
        value={isLoading ? '...' : String(stats?.filledPositions ?? 0)}
        description='Accepterade praktikanter'
        icon={<Icons.check className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Kontostatus'
        value={isLoading ? '...' : (approvalLabel[stats?.approvalStatus] ?? '–')}
        description='Verifieringsstatus'
        icon={<Icons.shieldCheck className='text-muted-foreground h-4 w-4' />}
      />
    </div>
  );
}

function EducationManagerDashboard() {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        title='Studenter'
        value='–'
        description='Studenter i ditt program'
        icon={<Icons.user className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Placerade'
        value='–'
        description='Studenter med praktikplats'
        icon={<Icons.check className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Söker fortfarande'
        value='–'
        description='Studenter utan praktikplats'
        icon={<Icons.search className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Placeringsgrad'
        value='–%'
        description='Andel placerade studenter'
        icon={<Icons.statistics className='text-muted-foreground h-4 w-4' />}
      />
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        title='Totalt användare'
        value={isLoading ? '...' : String(stats?.totalUsers ?? 0)}
        description='Alla registrerade användare'
        icon={<Icons.user className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Väntar godkännande'
        value={isLoading ? '...' : String(stats?.pendingApproval ?? 0)}
        description='Företag som väntar på verifiering'
        icon={<Icons.shieldCheck className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Aktiva annonser'
        value={isLoading ? '...' : String(stats?.activeListings ?? 0)}
        description='Publicerade praktikplatser'
        icon={<Icons.briefcase className='text-muted-foreground h-4 w-4' />}
      />
      <StatCard
        title='Totalt ansökningar'
        value={isLoading ? '...' : String(stats?.totalApplications ?? 0)}
        description='Alla inskickade ansökningar'
        icon={<Icons.applications className='text-muted-foreground h-4 w-4' />}
      />
    </div>
  );
}

function GuestDashboard() {
  return (
    <Card>
      <CardContent className='py-8 text-center'>
        <p className='text-muted-foreground'>Välkommen! Slutför din profil för att komma igång.</p>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </CardContent>
    </Card>
  );
}
