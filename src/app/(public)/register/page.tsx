/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react'; // নতুন আইকন
import { api, setAccessToken } from '@/lib/api/axios-instance';
import { useAuthStore } from '@/lib/stores/auth-store';

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
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // টগল স্টেট

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', values);

      setUser(data.user);
      setAccessToken(data.accessToken);

      if (typeof window !== 'undefined')
        localStorage.setItem('refreshToken', data.refreshToken);

      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('Too many attempts. Please try again in a minute.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to register');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background'>
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none'></div>

      <Card className='w-full max-w-md relative z-10 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl shadow-black/50'>
        <CardHeader className='space-y-2 text-center pb-6'>
          <CardTitle className='text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent'>
            Create an account
          </CardTitle>
          <CardDescription className='text-muted-foreground/80'>
            Enter your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-foreground/80'>
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John Doe'
                        disabled={isLoading}
                        className='bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-foreground/80'>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='name@example.com'
                        type='email'
                        disabled={isLoading}
                        className='bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-foreground/80'>
                      Password
                    </FormLabel>
                    <FormControl>
                      {/* পাসওয়ার্ড ফিল্ডে আইকন যুক্ত করা হলো */}
                      <div className='relative'>
                        <Input
                          placeholder='••••••••'
                          type={showPassword ? 'text' : 'password'}
                          disabled={isLoading}
                          className='bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300 pr-10'
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
                className='w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300'
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='flex justify-center border-t border-border/50 mt-2 pt-6'>
          <p className='text-sm text-muted-foreground'>
            Already have an account?{' '}
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
