'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Internship } from '@/features/internships/api/types';

export function InternshipSelector({
  internships,
  value,
  onChange
}: {
  internships: Internship[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className='space-y-2'>
      <Label>Välj praktikplats</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Välj en praktikplats...' />
        </SelectTrigger>
        <SelectContent>
          {internships.map((i) => (
            <SelectItem key={i.$id} value={i.$id}>
              {i.title} — {i.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
