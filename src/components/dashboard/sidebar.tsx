'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Cpu,
  UserCircle,
  Briefcase,
  GraduationCap,
  MessageSquare,
  MessageCircle,
  Settings,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/stores/ui-store';
import { ScrollArea } from '@/components/ui/scroll-area';

const sidebarLinks = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Blog', href: '/dashboard/blog', icon: FileText },
  { name: 'Technologies', href: '/dashboard/technologies', icon: Cpu },
  { name: 'Skills', href: '/dashboard/skills', icon: UserCircle },
  { name: 'Experience', href: '/dashboard/experience', icon: Briefcase },
  { name: 'Education', href: '/dashboard/education', icon: GraduationCap },
  { name: 'Testimonials', href: '/dashboard/testimonials', icon: Quote },
  { name: 'Comments', href: '/dashboard/comments', icon: MessageCircle },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Profile Settings', href: '/dashboard/profile', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <div className='flex flex-col h-full bg-card border-r border-border'>
      <div className='p-6'>
        <h2 className='text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'>
          Admin Panel
        </h2>
      </div>
      <ScrollArea className='flex-1 px-4'>
        <nav className='flex flex-col gap-2 pb-6'>
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <link.icon className='w-5 h-5' />
                <span className='font-medium text-sm'>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className='hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40'>
      <SidebarNav />
    </aside>
  );
}
