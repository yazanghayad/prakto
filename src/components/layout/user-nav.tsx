'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useUser } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { profile, logout } = useUser();
  const router = useRouter();

  const userForAvatar = profile
    ? {
        displayName: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl
      }
    : null;

  if (profile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <UserAvatarProfile user={userForAvatar} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' sideOffset={10} forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>{profile.displayName}</p>
              <p className='text-muted-foreground text-xs leading-none'>{profile.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
              Notifikationer
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await logout();
              router.push('/auth/sign-in');
            }}
          >
            Logga ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
