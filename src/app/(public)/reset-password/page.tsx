/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api/axios-instance';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  newPassword: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // টগল স্টেট

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: values.newPassword,
      });
      toast.success('Password reset successful! Please login.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className='text-center p-6'>
        <p className='text-destructive font-medium mb-2'>Missing Reset Token</p>
        <p className='text-muted-foreground text-sm'>
          Please use the link sent to your email.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4 sm:space-y-5'
      >
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-foreground/80'>New Password</FormLabel>
              <FormControl>
                {/* পাসওয়ার্ড ফিল্ডে আইকন যুক্ত করা হলো */}
                <div className='relative'>
                  <Input
                    placeholder='••••••••'
                    type={showPassword ? 'text' : 'password'}
                    disabled={isLoading}
                    className='bg-background/50 border-border/50 h-10 sm:h-11 focus-visible:ring-primary/50 pr-10'
                    {...field}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300'
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </Form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background'>
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none'></div>

      <Card className='w-full max-w-[95%] sm:max-w-md relative z-10 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl shadow-black/50'>
        <CardHeader className='space-y-2 text-center pb-4 sm:pb-6'>
          <CardTitle className='text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent'>
            Create New Password
          </CardTitle>
          <CardDescription className='text-sm sm:text-base text-muted-foreground/80 px-2'>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className='text-center py-4 text-muted-foreground text-sm'>
                Loading...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
