'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';

const services = [
  {
    title: 'CV-generator',
    description:
      'Skapa ett professionellt CV anpassat för praktikansökningar. Fyll i dina uppgifter och få ett färdigt CV att kopiera eller ladda ner.',
    icon: Icons.cvDocument,
    href: '/dashboard/resources/cv',
    cta: 'Skapa CV'
  },
  {
    title: 'Personligt brev',
    description:
      'Skapa ett övertygande personligt brev anpassat för den praktikplats du söker. Få hjälp med struktur och innehåll.',
    icon: Icons.writing,
    href: '/dashboard/resources/letter',
    cta: 'Skapa personligt brev'
  }
];

export default function ResourcesLanding() {
  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {services.map((service) => {
        const ServiceIcon = service.icon;
        return (
          <Card key={service.href} className='flex flex-col'>
            <CardHeader>
              <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                <ServiceIcon className='text-primary h-6 w-6' />
              </div>
              <CardTitle className='mt-4'>{service.title}</CardTitle>
              <CardDescription className='text-sm'>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className='mt-auto'>
              <Button asChild className='w-full'>
                <Link href={service.href}>
                  {service.cta}
                  <Icons.arrowRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
