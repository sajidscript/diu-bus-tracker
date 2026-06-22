import { z } from 'zod';

export type Role = 'student' | 'driver' | 'admin';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface Route {
  id: string;
  name: string;
  description: string | null;
  color: string;
  polyline: LatLng[];
  created_at: string;
  stops: StopWithOrder[];
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  created_at: string;
}

export interface RouteStop {
  route_id: string;
  stop_id: string;
  stop_order: number;
}

export interface StopWithOrder extends Stop {
  stop_order: number;
}

export interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  route_id: string | null;
  driver_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BusLocation {
  bus_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number | null;
  simulate: boolean;
  updated_at: string;
}

export interface BusWithLocation extends Bus {
  location?: BusLocation;
  route?: Route | null;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z
  .object({
    email: z
      .string()
      .email('Please enter a valid email address')
      .refine((val) => val.endsWith('@diu.edu.bd'), {
        message: 'Only @diu.edu.bd email addresses are accepted.',
        path: ['email'],
      }),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['student', 'driver', 'admin']),
    inviteCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'student') return true;
      return data.inviteCode === import.meta.env.VITE_INVITE_CODE;
    },
    {
      message: 'Invalid invite code',
      path: ['inviteCode'],
    },
  );

export const driverSignupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['driver', 'admin']),
    inviteCode: z.string().min(1, 'Invite code is required for staff signup'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.inviteCode === import.meta.env.VITE_INVITE_CODE, {
    message: 'Invalid invite code',
    path: ['inviteCode'],
  });

export const addBusSchema = z.object({
  bus_number: z.string().min(1, 'Bus number is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').max(100),
  route_id: z.string().nullable(),
  driver_id: z.string().nullable(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type DriverSignupFormData = z.infer<typeof driverSignupSchema>;
export type AddBusFormData = z.infer<typeof addBusSchema>;

export const ROLE_DASHBOARDS: Record<Role, string> = {
  student: '/student',
  driver: '/driver',
  admin: '/admin',
};
