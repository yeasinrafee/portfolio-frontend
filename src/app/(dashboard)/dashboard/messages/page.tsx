'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Mail,
  MailOpen,
  Trash2,
  Clock,
  User,
  Phone,
  Globe,
  Search,
  CheckCircle2,
  Inbox,
} from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  isRead: boolean;
  ipAddress?: string;
  createdAt: string;
};

export default function MessagesPage() {
  const queryClient = useQueryClient();

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>(
    'all',
  );

  // Fetch all messages (Endpoint: GET /contact)
  const { data: response, isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const { data } = await api.get('/contact');
      return data?.data || data;
    },
  });

  const messages: ContactMessage[] = response || [];

  // Filter messages based on search & read status
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.subject &&
        msg.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'unread') return matchesSearch && !msg.isRead;
    if (filterStatus === 'read') return matchesSearch && msg.isRead;
    return matchesSearch;
  });

  // Mark message as read when opened (Endpoint: PATCH /contact/:id/read-status)
  const handleViewMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);

    if (!msg.isRead) {
      try {
        await api.patch(`/contact/${msg.id}/read-status`, { isRead: true });
        queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      } catch (error) {
        console.error('Failed to mark message as read');
      }
    }
  };

  // Toggle Read/Unread manually (Endpoint: PATCH /contact/:id/read-status)
  const toggleReadStatus = async (e: React.MouseEvent, msg: ContactMessage) => {
    e.stopPropagation();
    const newStatus = !msg.isRead;
    try {
      await api.patch(`/contact/${msg.id}/read-status`, { isRead: newStatus });
      toast.success(newStatus ? 'Marked as read' : 'Marked as unread');
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Delete message (Endpoint: DELETE /contact/:id)
  const confirmDelete = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/contact/${messageToDelete.id}`);
      toast.success('Message deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      if (selectedMessage?.id === messageToDelete.id) {
        setSelectedMessage(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    } finally {
      setIsDeleting(false);
      setMessageToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Contact Messages
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage inquiries and messages submitted by portfolio visitors.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search messages...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilterStatus('all')}
          >
            All ({messages.length})
          </Button>
          <Button
            variant={filterStatus === 'unread' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilterStatus('unread')}
          >
            Unread ({messages.filter((m) => !m.isRead).length})
          </Button>
          <Button
            variant={filterStatus === 'read' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilterStatus('read')}
          >
            Read ({messages.filter((m) => m.isRead).length})
          </Button>
        </div>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading messages...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <Inbox className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>
            No messages found.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredMessages.map((msg) => (
            <Card
              key={msg.id}
              onClick={() => handleViewMessage(msg)}
              className={`cursor-pointer transition-colors backdrop-blur-sm border-border/50 hover:border-primary/50 ${
                !msg.isRead
                  ? 'bg-primary/5 border-l-4 border-l-primary font-medium'
                  : 'bg-card/40 opacity-80'
              }`}
            >
              <CardContent className='p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex items-start gap-3 min-w-0'>
                  <div className='mt-1 shrink-0'>
                    {!msg.isRead ? (
                      <Mail className='w-5 h-5 text-primary fill-primary/10' />
                    ) : (
                      <MailOpen className='w-5 h-5 text-muted-foreground' />
                    )}
                  </div>

                  <div className='space-y-1 min-w-0 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <h4 className='font-semibold text-base text-foreground'>
                        {msg.name}
                      </h4>
                      <span className='text-xs text-muted-foreground'>
                        ({msg.email})
                      </span>
                      {!msg.isRead && (
                        <Badge className='bg-primary/20 text-primary border-primary/30 text-[10px]'>
                          New
                        </Badge>
                      )}
                    </div>

                    {msg.subject && (
                      <p className='text-sm font-medium text-foreground/90 truncate'>
                        {msg.subject}
                      </p>
                    )}

                    <p className='text-sm text-muted-foreground line-clamp-1'>
                      {msg.message}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Clock className='w-3.5 h-3.5' />
                    {formatDate(msg.createdAt)}
                  </span>

                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={(e) => toggleReadStatus(e, msg)}
                      className='h-8 w-8 text-muted-foreground hover:text-foreground'
                      title={msg.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${msg.isRead ? 'text-primary' : ''}`}
                      />
                    </Button>

                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageToDelete(msg);
                      }}
                      className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Message Detail Dialog */}
      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        <DialogContent className='sm:max-w-xl'>
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className='text-xl flex items-center gap-2'>
                  <Mail className='w-5 h-5 text-primary' />
                  {selectedMessage.subject || 'No Subject'}
                </DialogTitle>
              </DialogHeader>

              <div className='space-y-4 pt-2'>
                {/* Sender Details */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 text-sm'>
                  <div className='flex items-center gap-2'>
                    <User className='w-4 h-4 text-primary' />
                    <span className='font-semibold'>
                      {selectedMessage.name}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-primary' />
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className='text-primary hover:underline truncate'
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                  {selectedMessage.phone && (
                    <div className='flex items-center gap-2'>
                      <Phone className='w-4 h-4 text-primary' />
                      <span>{selectedMessage.phone}</span>
                    </div>
                  )}
                  {selectedMessage.ipAddress && (
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Globe className='w-3.5 h-3.5' />
                      <span>IP: {selectedMessage.ipAddress}</span>
                    </div>
                  )}
                  <div className='flex items-center gap-2 text-xs text-muted-foreground col-span-1 sm:col-span-2'>
                    <Clock className='w-3.5 h-3.5' />
                    <span>
                      Sent at: {formatDate(selectedMessage.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className='space-y-1'>
                  <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    Message
                  </span>
                  <div className='p-4 rounded-lg bg-card/60 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap'>
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center justify-between pt-4 border-t border-border/50'>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => {
                      setMessageToDelete(selectedMessage);
                    }}
                  >
                    <Trash2 className='w-4 h-4 mr-2' /> Delete Message
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setSelectedMessage(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              message from
              <span className='font-semibold text-foreground'>
                {' '}
                "{messageToDelete?.name}"{' '}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
