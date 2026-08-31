'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { api, setAccessToken } from '@/lib/api/axios-instance';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar';

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isSidebarOpen, setSidebarOpen } = useUiStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
      logout();
      router.push('/login');
    }
  };

  return (
    <header className='sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-border bg-card/80 backdrop-blur-md lg:px-8'>
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          className='lg:hidden'
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className='w-6 h-6 text-foreground' />
        </Button>

        <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side='left' className='p-0 w-64 bg-card border-r-0'>
            <SheetTitle className='sr-only'>Navigation Menu</SheetTitle>
            <div className='h-full'>
              <SidebarNav />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className='flex items-center gap-4'>
        <DropdownMenu>
          <DropdownMenuTrigger className='focus:outline-none rounded-full cursor-pointer hover:opacity-80 transition-opacity'>
            <Avatar className='h-10 w-10 border border-border shadow-sm'>
              <AvatarImage
                src={user?.avatar || ''}
                alt={user?.name || 'Admin'}
              />
              <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent className='w-56' align='end'>
            {/* Base UI requirement অনুযায়ী DropdownMenuGroup ব্যবহার করা হয়েছে */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className='font-normal p-2'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    {user?.name || 'Admin'}
                  </p>
                  <p className='text-xs leading-none text-muted-foreground truncate'>
                    {user?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild className='cursor-pointer'>
                <Link
                  href='/dashboard/profile'
                  className='flex items-center w-full'
                >
                  <User className='mr-2 h-4 w-4' />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleLogout}
                className='cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive mt-1'
              >
                <LogOut className='mr-2 h-4 w-4' />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
