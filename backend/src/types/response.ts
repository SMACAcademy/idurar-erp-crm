import { PG, Room, Member, Admin } from "@prisma/client";

// Generic response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Admin response types
export interface AdminResponse extends Omit<Admin, 'password'> {}

export interface AdminLoginResponse {
  admin: AdminResponse;
  token: string;
  expiresIn: string;
}

// PG response types
export interface PGResponse extends PG {
  _count?: {
    rooms: number;
    members: number;
    payments: number;
  };
}

// Member response types
export interface MemberPaymentStatus {
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  month: string;
  paymentDetails?: {
    id: string;
    amount: number;
    paidDate: Date;
  } | null;
}

export interface MemberInfo extends Member {
  room: Room | null;
  paymentStatus: MemberPaymentStatus | null;
}

// Enquiry response types
export interface EnquiryResponse {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: 'NOT_RESOLVED' | 'RESOLVED';
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resolver?: {
    id: string;
    name: string;
    email: string;
    pgType: string;
  } | null;
}

export interface EnquiryStatsCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  subtitle: string;
  badge?: {
    text: string;
    color: string;
  };
}
