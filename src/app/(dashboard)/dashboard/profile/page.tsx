'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Save,
  Upload,
  Plus,
  Trash2,
  User,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api/axios-instance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Profile schema mapping backend properties
const profileSchema = z.object({
  name: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  currentStatus: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  primaryPhone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1, 'Platform is required'),
        url: z.string().url('Must be a valid URL'),
        icon: z.string().optional(),
        order: z.coerce.number().default(0),
      }),
    )
    .default([]),
});

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch profile data (Singleton endpoint)[cite: 1]
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile');
      return data?.data || data;
    },
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      shortDescription: '',
      description: '',
      avatar: '',
      currentStatus: '',
      email: '',
      primaryPhone: '',
      secondaryPhone: '',
      presentAddress: '',
      permanentAddress: '',
      socialLinks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'socialLinks',
  });

  // Populate form once profile data is fetched
  useEffect(() => {
    if (profileResponse) {
      form.reset({
        name: profileResponse.name || '',
        shortDescription: profileResponse.shortDescription || '',
        description: profileResponse.description || '',
        avatar: profileResponse.avatar || '',
        currentStatus: profileResponse.currentStatus || '',
        email: profileResponse.email || '',
        primaryPhone: profileResponse.primaryPhone || '',
        secondaryPhone: profileResponse.secondaryPhone || '',
        presentAddress: profileResponse.presentAddress || '',
        permanentAddress: profileResponse.permanentAddress || '',
        socialLinks: profileResponse.socialLinks || [],
      });
    }
  }, [profileResponse, form]);

  // Handle avatar upload to Cloudinary[cite: 1]
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      form.setValue('avatar', data.url);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsSaving(true);
    try {
      // Clean up empty strings to avoid validation errors
      const cleanField = (val?: string) =>
        val && val.trim() !== '' ? val : null;

      const payload = {
        ...values,
        name: cleanField(values.name),
        shortDescription: cleanField(values.shortDescription),
        description: cleanField(values.description),
        avatar: cleanField(values.avatar),
        currentStatus: cleanField(values.currentStatus),
        email: cleanField(values.email),
        primaryPhone: cleanField(values.primaryPhone),
        secondaryPhone: cleanField(values.secondaryPhone),
        presentAddress: cleanField(values.presentAddress),
        permanentAddress: cleanField(values.permanentAddress),
        socialLinks: values.socialLinks.map((link, idx) => ({
          ...link,
          order: idx,
        })),
      };

      // PUT request for Profile upsert[cite: 1]
      await api.put('/profile', payload);

      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-[60vh] items-center justify-center animate-pulse text-muted-foreground'>
        Loading profile...
      </div>
    );
  }

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-foreground'>
          Profile Settings
        </h1>
        <p className='text-muted-foreground mt-1'>
          Manage your personal information, bio, and social links.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {/* Section 1: Basic Info & Avatar */}
          <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <User className='w-5 h-5 text-primary' /> Basic Information
              </CardTitle>
              <CardDescription>
                Your main identity details shown across the portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Avatar Upload Preview */}
              <div className='flex items-center gap-6'>
                <div className='w-20 h-20 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0'>
                  {form.watch('avatar') ? (
                    <img
                      src={form.watch('avatar')}
                      alt='Avatar'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <User className='w-8 h-8 text-muted-foreground/50' />
                  )}
                </div>
                <div className='space-y-2'>
                  <FormLabel>Profile Avatar</FormLabel>
                  <div className='flex items-center gap-3'>
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      disabled={isUploading}
                      className='relative cursor-pointer'
                    >
                      {isUploading ? (
                        'Uploading...'
                      ) : (
                        <>
                          <Upload className='w-4 h-4 mr-2' /> Change Avatar
                        </>
                      )}
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleAvatarUpload}
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                        disabled={isUploading}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='currentStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Status</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Building AI tools...'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='col-span-1 md:col-span-2'>
                  <FormField
                    control={form.control}
                    name='shortDescription'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description / Headline</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='col-span-1 md:col-span-2'>
                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Biography</FormLabel>
                        <FormControl>
                          <Textarea className='min-h-[150px]' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Contact & Addresses */}
          <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <MapPin className='w-5 h-5 text-primary' /> Contact & Location
              </CardTitle>
              <CardDescription>
                How visitors and clients can reach you.
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type='email' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='primaryPhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* সেকেন্ডারি ফোন নম্বরের ফিল্ডটি এখানে যুক্ত করা হলো */}
              <FormField
                control={form.control}
                name='secondaryPhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='presentAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Present Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='permanentAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 3: Social Links */}
          <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Globe className='w-5 h-5 text-primary' /> Social Links
                </CardTitle>
                <CardDescription>
                  Connect your professional profiles.
                </CardDescription>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  append({
                    platform: '',
                    url: '',
                    icon: '',
                    order: fields.length,
                  })
                }
              >
                <Plus className='w-4 h-4 mr-2' /> Add Link
              </Button>
            </CardHeader>
            <CardContent className='space-y-4'>
              {fields.length === 0 && (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  No social links added yet. Click 'Add Link' to start.
                </p>
              )}

              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className='flex items-end gap-3 p-3 rounded-lg border border-border/50 bg-muted/20'
                >
                  <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name={`socialLinks.${index}.platform`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>
                            Platform (e.g. GitHub)
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`socialLinks.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Profile URL</FormLabel>
                          <FormControl>
                            <Input placeholder='https://...' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    onClick={() => remove(index)}
                    className='h-10 w-10 shrink-0'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className='flex justify-end gap-4 pt-4'>
            <Button
              type='submit'
              disabled={isSaving}
              className='bg-primary min-w-[160px] shadow-lg shadow-primary/20'
            >
              {isSaving ? (
                'Saving Profile...'
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
