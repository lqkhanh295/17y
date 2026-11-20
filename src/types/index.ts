export type MemberRole = 'ACTIVE' | 'ALUMNI';

export interface MemberDirectoryItem {
  id: string;
  mssv: string;
  fullName: string;
  role: MemberRole;
  honorific: 'Anh' | 'Chị' | 'Bạn';
  generation?: string; // Khóa K14, K15, K16...
  department?: string; // Ban Nội dung, Ban Kỹ thuật, Ban Sự kiện...
}

export type PaymentPlan = 'FULL' | 'DEPOSIT_100' | 'DEPOSIT_150';

export type PaymentStatus = 
  | 'UNPAID'
  | 'PENDING'
  | 'PARTIAL'
  | 'FULLY_PAID'
  | 'REJECTED'
  | 'DEPOSITED'
  | 'PENDING_APPROVAL'
  | 'COMPLETED_100';

export interface PaymentSubmission {
  id: string;
  phase: 1 | 2;
  amount: number;
  receiptUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface RegistrationRecord {
  id: string;
  memberId: string;
  fullName: string;
  mssv: string;
  role: MemberRole;
  honorific: 'Anh' | 'Chị' | 'Bạn';
  gmail: string;
  personalPhone: string;
  emergencyPhone: string;
  allergies: string[];
  allergyNote: string;
  wishes: string;
  isPublicConsent?: boolean;
  
  // Finance
  plan: PaymentPlan;
  paymentPlan?: PaymentPlan;
  totalRequired: number; // 349000 (Active) | 449000 (Alumni)
  paidAmount: number; // Verified amount only!
  remainingAmount: number;
  receiptPhase1Url: string;
  receiptPhase2Url?: string;
  
  // Approval & State
  status: PaymentStatus;
  isApproved100: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  
  // Payment History
  paymentHistory?: PaymentSubmission[];

  // Ticket & Calendar
  ticketCode: string;
  ticketToken?: string;
  createdAt: string;
  isEmailSent?: boolean;

  // Check-in state
  isCheckedIn?: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
}

export interface MascotFrog {
  id: string;
  name: string;
  role: MemberRole;
  wish: string;
  x: number; // percentage 5% - 90%
  y: number; // percentage 10% - 85%
  scale: number;
  direction: number; // 1 or -1
}
