/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit2,
  Award,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { Achievement, AchievementType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

export default function AchievementsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | AchievementType>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Achievement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(
    null,
  );

  // Form States
  const [type, setType] = useState<AchievementType>('CERTIFICATION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [certificateFile, setCertificateFile] = useState('');
  const [featured, setFeatured] = useState(false);
  const [order, setOrder] = useState(0);
  const [images, setImages] = useState<
    { url: string; alt: string; order: number }[]
  >([]);

  // Fetch Achievements
  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ['achievements', activeTab],
    queryFn: async () => {
      const param = activeTab === 'ALL' ? undefined : activeTab;
      const res = await api.get('/achievements', { params: { type: param } });
      return res.data?.data?.data || res.data?.data || res.data || [];
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setType('CERTIFICATION');
    setTitle('');
    setDescription('');
    setIssuer('');
    setIssueDate('');
    setCredentialUrl('');
    setCertificateFile('');
    setFeatured(false);
    setOrder(0);
    setImages([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Achievement) => {
    setEditingItem(item);
    setType(item.type);
    setTitle(item.title);
    setDescription(item.description || '');
    setIssuer(item.issuer || '');
    setIssueDate(
      item.issueDate
        ? new Date(item.issueDate).toISOString().split('T')[0]
        : '',
    );
    setCredentialUrl(item.credentialUrl || '');
    setCertificateFile(item.certificateFile || '');
    setFeatured(item.featured || false);
    setOrder(item.order || 0);
    setImages(item.images || []);
    setIsModalOpen(true);
  };

  // 1. Automatic Document Upload (PDF/DOC)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingDoc(true);
    try {
      const res = await api.post('/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (uploadedUrl) {
        setCertificateFile(uploadedUrl);
        toast.success('Certificate document uploaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // 2. Automatic Image Upload for Gallery
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImageIndex(index);
    try {
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (uploadedUrl) {
        const updated = [...images];
        updated[index].url = uploadedUrl;
        setImages(updated);
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImageIndex(null);
    }
  };

  // Image Gallery Row Management
  const addImageRow = () => {
    setImages([...images, { url: '', alt: '', order: images.length }]);
  };

  const updateImageAlt = (index: number, altValue: string) => {
    const updated = [...images];
    updated[index].alt = altValue;
    setImages(updated);
  };

  const removeImageRow = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');

    setIsSubmitting(true);
    const payload = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      issuer: issuer.trim() || undefined,
      issueDate: issueDate || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
      certificateFile: certificateFile.trim() || undefined,
      featured,
      order: Number(order) || 0,
      images: images.filter((img) => img.url.trim() !== ''),
    };

    try {
      if (editingItem) {
        await api.patch(`/achievements/${editingItem.id}`, payload);
        toast.success('Updated successfully!');
      } else {
        await api.post('/achievements', payload);
        toast.success('Created successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      setIsModalOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save';
      toast.error(typeof msg === 'string' ? msg : msg[0] || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      await api.delete(`/achievements/${itemToDelete.id}`);
      toast.success('Deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      setItemToDelete(null);
    } catch (error: any) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='space-y-6 max-w-5xl mx-auto pb-10 px-4 sm:px-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
            Achievements
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage Certifications, Publications, and Honors/Awards.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className='w-full sm:w-auto shrink-0 gap-2'
        >
          <Plus className='w-4 h-4' /> Add Item
        </Button>
      </div>

      {/* Tabs Filter */}
      <div className='flex items-center gap-2 border-b border-border pb-3 overflow-x-auto'>
        {(['ALL', 'CERTIFICATION', 'ACHIEVEMENT', 'PUBLICATION'] as const).map(
          (tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setActiveTab(tab)}
              className='shrink-0'
            >
              {tab}
            </Button>
          ),
        )}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading items...
        </div>
      ) : achievements.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <Award className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>No items found.</p>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2'>
          {achievements.map((item) => (
            <Card
              key={item.id}
              className='backdrop-blur-sm border-border/50 bg-card/40 flex flex-col justify-between'
            >
              <CardContent className='p-5 space-y-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <Badge
                      variant='outline'
                      className='text-[10px] uppercase bg-primary/10 text-primary border-primary/20 mb-1'
                    >
                      {item.type}
                    </Badge>
                    <h3 className='font-semibold text-foreground text-base sm:text-lg leading-snug'>
                      {item.title}
                    </h3>
                    {item.issuer && (
                      <p className='text-xs text-muted-foreground font-medium mt-0.5'>
                        {item.issuer}
                      </p>
                    )}
                  </div>
                  {item.featured && (
                    <Badge className='bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] shrink-0'>
                      Featured
                    </Badge>
                  )}
                </div>

                {item.description && (
                  <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                    {item.description}
                  </p>
                )}

                {/* Links */}
                <div className='flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground'>
                  {item.credentialUrl && (
                    <a
                      href={item.credentialUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-1 text-primary hover:underline'
                    >
                      <ExternalLink className='w-3.5 h-3.5' /> Credential Link
                    </a>
                  )}
                  {item.certificateFile && (
                    <a
                      href={item.certificateFile}
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-1 text-emerald-500 hover:underline max-w-50 truncate'
                    >
                      <FileText className='w-3.5 h-3.5 shrink-0' /> Certificate
                      Doc
                    </a>
                  )}
                </div>

                {/* Proof Images Badge Count */}
                {item.images && item.images.length > 0 && (
                  <div className='pt-1'>
                    <span className='text-[11px] text-muted-foreground flex items-center gap-1'>
                      <ImageIcon className='w-3 h-3' /> {item.images.length}{' '}
                      Proof Image(s) Attached
                    </span>
                  </div>
                )}
              </CardContent>

              {/* Action Footer */}
              <div className='flex items-center justify-between p-5 pt-0 border-t border-border/40 mt-3'>
                <span className='text-xs text-muted-foreground pt-3'>
                  {item.issueDate
                    ? new Date(item.issueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : ''}
                </span>
                <div className='flex items-center gap-2 pt-3'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => openEditModal(item)}
                  >
                    <Edit2 className='w-3.5 h-3.5 mr-1' /> Edit
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setItemToDelete(item)}
                    className='text-destructive hover:bg-destructive/10'
                  >
                    <Trash2 className='w-3.5 h-3.5 mr-1' /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog (Fully Responsive & Scrollable) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='w-[95vw] sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden'>
          <DialogHeader className='p-6 pb-2'>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Create Item'}
            </DialogTitle>
          </DialogHeader>

          {/* Form Scroll Area */}
          <form
            onSubmit={handleSubmit}
            className='flex-1 overflow-y-auto p-6 pt-0 space-y-4'
          >
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(val: AchievementType) => setType(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='CERTIFICATION'>Certification</SelectItem>
                    <SelectItem value='ACHIEVEMENT'>Achievement</SelectItem>
                    <SelectItem value='PUBLICATION'>Publication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='issuer'>Issuer / Organization</Label>
                <Input
                  id='issuer'
                  placeholder='e.g. AWS, IEEE, Coursera'
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='title'>Title *</Label>
              <Input
                id='title'
                placeholder='e.g. AWS Certified Solutions Architect'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Brief summary...'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='issueDate'>Issue Date</Label>
                <Input
                  id='issueDate'
                  type='date'
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='credentialUrl'>Credential URL</Label>
                <Input
                  id='credentialUrl'
                  placeholder='https://credly.com/...'
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Certificate Document Upload (Auto API Upload) */}
            <div className='space-y-2 border border-border/50 p-3.5 rounded-lg bg-card/20'>
              <Label className='text-sm font-semibold flex items-center gap-1.5'>
                <FileText className='w-4 h-4 text-primary' /> Certificate
                Document (PDF/DOC)
              </Label>
              <div className='flex items-center gap-3'>
                <Input
                  type='file'
                  accept='.pdf,.doc,.docx'
                  onChange={handleFileUpload}
                  disabled={isUploadingDoc}
                  className='cursor-pointer text-xs'
                />
                {isUploadingDoc && (
                  <Loader2 className='w-4 h-4 animate-spin text-primary shrink-0' />
                )}
              </div>
              {certificateFile && (
                <div className='mt-2 text-xs text-emerald-500 bg-emerald-500/10 p-2 rounded flex items-center justify-between min-w-0'>
                  <span className='truncate max-w-[80%] font-medium'>
                    Uploaded Document URL: {certificateFile}
                  </span>
                  <a
                    href={certificateFile}
                    target='_blank'
                    rel='noreferrer'
                    className='underline shrink-0 text-xs font-semibold'
                  >
                    View Doc
                  </a>
                </div>
              )}
            </div>

            <div className='flex items-center justify-between border border-border/50 p-3.5 rounded-lg'>
              <Label
                htmlFor='featured'
                className='cursor-pointer text-sm font-medium'
              >
                Feature on Public Website
              </Label>
              <Switch
                id='featured'
                checked={featured}
                onCheckedChange={setFeatured}
              />
            </div>

            {/* Automatic Image Upload Gallery */}
            <div className='space-y-3 pt-3 border-t border-border/40'>
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-1.5 text-sm font-semibold'>
                  <ImageIcon className='w-4 h-4 text-primary' /> Proof Images /
                  Screenshots
                </Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addImageRow}
                >
                  <Plus className='w-3.5 h-3.5 mr-1' /> Add Image
                </Button>
              </div>

              {images.map((img, idx) => (
                <div
                  key={idx}
                  className='space-y-2 p-3 border border-border/40 rounded-lg bg-card/30'
                >
                  <div className='flex flex-col sm:flex-row items-center gap-2'>
                    {/* Direct Image File Upload Input */}
                    <div className='relative w-full'>
                      <Input
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleImageUpload(e, idx)}
                        disabled={uploadingImageIndex === idx}
                        className='cursor-pointer text-xs'
                      />
                      {uploadingImageIndex === idx && (
                        <Loader2 className='w-4 h-4 animate-spin absolute right-3 top-2.5 text-primary' />
                      )}
                    </div>

                    <Input
                      placeholder='Alt text (e.g. Certificate Preview)'
                      value={img.alt}
                      onChange={(e) => updateImageAlt(idx, e.target.value)}
                      className='w-full sm:w-48 text-xs'
                    />

                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeImageRow(idx)}
                      className='text-destructive shrink-0 hover:bg-destructive/10 self-end sm:self-center'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>

                  {/* Show Uploaded Image Preview / URL Safely */}
                  {img.url && (
                    <div className='flex items-center gap-2 pt-1 text-xs text-muted-foreground min-w-0'>
                      <div className='w-8 h-8 rounded border overflow-hidden shrink-0 bg-muted'>
                        <img
                          src={img.url}
                          alt={img.alt || 'Preview'}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <span className='truncate text-[11px] text-emerald-500 font-mono'>
                        {img.url}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className='pt-4 border-t border-border/40 gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingItem
                    ? 'Update Item'
                    : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent className='w-[95vw] sm:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-destructive'>
              <ShieldAlert className='w-5 h-5' /> Delete Item?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold text-foreground'>
                &quot;{itemToDelete?.title}&quot;
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
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
