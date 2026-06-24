import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { signupSchema, driverSignupSchema, type SignupFormData, type DriverSignupFormData, type Role } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useState } from 'react';

export default function SignupForm(): ReactNode {
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [serverError, setServerError] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const activeSchema = selectedRole === 'student' ? signupSchema : driverSignupSchema;
  type ActiveFormData = SignupFormData | DriverSignupFormData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ActiveFormData>({
    resolver: zodResolver(activeSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const handleRoleChange = (role: Role): void => {
    setSelectedRole(role);
    setValue('role' as 'role', role as never);
  };

  const roleOptions: { value: Role; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'driver', label: 'Driver' },
    { value: 'admin', label: 'Admin' },
  ];

  const onSubmit = async (formData: ActiveFormData): Promise<void> => {
    setServerError(null);
    try {
      const email = formData.email;
      const password = formData.password;
      const fullName = formData.fullName;
      const role = selectedRole;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      if (data.user && data.session) {
        addToast('success', 'Account created successfully!');
        navigate('/dashboard');
      } else if (data.user && !data.session) {
        addToast('success', 'Account created. Please check your email to verify your account before signing in.');
        navigate('/login');
      } else {
        addToast('warning', 'Signup may not have completed. If you already have an account, try signing in.');
      }
    } catch (err) {
      let message = 'Sign up failed. Please try again.';
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered')) {
          message = 'An account with this email already exists. Try signing in instead.';
        } else if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('email_exceed')) {
          message = 'Too many signup attempts. Please wait a minute before trying again.';
        } else {
          message = err.message;
        }
      }
      setServerError(message);
    }
  };

  const showInviteCode = selectedRole === 'driver' || selectedRole === 'admin';

  return (
    <form key={selectedRole} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && (
        <Alert type="error" message={serverError} onDismiss={() => setServerError(null)} />
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-900">Role</label>
        <div className="flex gap-2">
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleRoleChange(opt.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                selectedRole === opt.value
                  ? 'border-green-600 bg-green-50 text-green-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Full name"
        type="text"
        placeholder="Your full name"
        error={errors.fullName?.message}
        register={register('fullName')}
      />

      <Input
        label="Email"
        type="email"
        placeholder={
          selectedRole === 'student' ? 'you@diu.edu.bd' : 'you@example.com'
        }
        autoComplete="email"
        error={errors.email?.message}
        register={register('email')}
      />

      {selectedRole === 'student' && (
        <p className="text-xs text-gray-500 -mt-2">
          Only @diu.edu.bd email addresses are accepted for student signup.
        </p>
      )}

      {showInviteCode && (
        <Input
          label="Invite code"
          type="text"
          placeholder="Enter staff invite code"
          error={errors.inviteCode?.message}
          register={register('inviteCode' as 'inviteCode')}
        />
      )}

      <Input
        label="Password"
        type="password"
        placeholder="At least 6 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        register={register('password')}
      />

      <Input
        label="Confirm password"
        type="password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        register={register('confirmPassword')}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        Create account
      </Button>
    </form>
  );
}
