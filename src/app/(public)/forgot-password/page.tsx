/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api/axios-instance';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', values);

      setIsSubmitted(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background'>
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none'></div>

      <Card className='w-full max-w-[95%] sm:max-w-md relative z-10 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl shadow-black/50'>
        <CardHeader className='space-y-2 text-center pb-4 sm:pb-6'>
          <CardTitle className='text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent'>
            Forgot Password
          </CardTitle>
          <CardDescription className='text-sm sm:text-base text-muted-foreground/80 px-2'>
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4 sm:space-y-5'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-foreground/80'>
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='name@example.com'
                          type='email'
                          disabled={isLoading}
                          className='bg-background/50 border-border/50 h-10 sm:h-11 focus-visible:ring-primary/50'
                          {...field}
                        />
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
                  {isLoading ? 'Sending link...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className='text-center p-4 bg-primary/10 rounded-lg border border-primary/20'>
              <p className='text-sm sm:text-base text-foreground/90'>
                Check your email inbox! We&apos;ve sent a recovery link to{' '}
                <strong>{form.getValues().email}</strong>.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex justify-center border-t border-border/50 mt-2 pt-4 sm:pt-6'>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Remember your password?{' '}
            <Link
              href='/login'
              className='font-medium text-primary hover:text-primary/80 hover:underline transition-colors'
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
