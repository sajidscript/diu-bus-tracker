import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { loginSchema, type LoginFormData } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useState } from 'react';

export default function LoginForm(): ReactNode {
  const [serverError, setServerError] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setServerError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      addToast('success', 'Signed in successfully');
      navigate('/dashboard');
    } catch (err) {
      let message = 'Sign in failed. Please try again.';
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('email_exceed')) {
          message = 'Too many login attempts. Please wait a minute before trying again.';
        } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          message = 'Invalid email or password. Please check your credentials.';
        } else if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
          message = 'Please verify your email before signing in. Check your inbox for the confirmation link.';
        } else {
          message = err.message;
        }
      }
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && (
        <Alert type="error" message={serverError} onDismiss={() => setServerError(null)} />
      )}
      <Input
        label="Email"
        type="email"
        placeholder="you@diu.edu.bd"
        autoComplete="email"
        error={errors.email?.message}
        register={register('email')}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Your password"
        autoComplete="current-password"
        error={errors.password?.message}
        register={register('password')}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
