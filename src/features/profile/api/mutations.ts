import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createStudentProfile, updateStudentProfile, uploadStudentCV } from './service';
import { studentKeys } from './queries';
import type { StudentProfilePayload } from './types';

export const createStudentMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: string; data: StudentProfilePayload }) =>
    createStudentProfile(userId, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: studentKeys.all });
  }
});

export const updateStudentMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<StudentProfilePayload> }) =>
    updateStudentProfile(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: studentKeys.all });
  }
});

export const uploadCVMutation = mutationOptions({
  mutationFn: (file: File) => uploadStudentCV(file)
});
