import { PrismaClient } from '@prisma/client';
import { formatCurrency, formatNumber, calculateTrendPercentage } from './reportHelpers';
import { generateMemberReportPDF } from './pdfGenerator';
import { organizeMemberFiles, createFileManifest, cleanupTempDirectory } from './fileOrganizer';
import { generateMemberReportZip, formatFileSize } from './zipGenerator';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper function to create project temp directory
const createProjectTempDirectory = (): string => {
  const projectRoot = path.resolve(__dirname, '../../'); // Navigate to project root
  const projectTempDir = path.join(projectRoot, 'temp');
  
  // Ensure project temp directory exists
  if (!fs.existsSync(projectTempDir)) {
    fs.mkdirSync(projectTempDir, { recursive: true });
  }
  
  // Create unique subdirectory for this operation
  const uniqueDir = fs.mkdtempSync(path.join(projectTempDir, 'member-report-'));
  
  console.log(`Created project temp directory: ${uniqueDir}`);
  return uniqueDir;
};

interface MemberReportData {
  memberInfo: {
    id: string;
    memberId: string;
    name: string;
    age: number;
    gender: string;
    location: string;
    email: string;
    phone: string;
    work: string;
    photoUrl?: string;
    documentUrl?: string;
    digitalSignature?: string;
    rentType: string;
    advanceAmount: number;
    pricePerDay?: number;
    pgType: string;
    dateOfJoining: Date;
    dateOfRelieving?: Date;
    isActive: boolean;
    isFirstTimeLogin: boolean;
    membershipDuration: string;
    status: string;
  };
  pgInfo: {
    pgName: string;
    pgLocation: string;
    pgType: string;
    roomNo?: string;
    roomRent?: number;
    roomElectricityCharge?: number;
    roomCapacity?: number;
  };
  paymentSummary: {
    totalPayments: number;
    totalPaidAmount: number;
    totalPendingAmount: number;
    totalOverdueAmount: number;
    approvedPayments: number;
    rejectedPayments: number;
    onlinePayments: number;
    cashPayments: number;
    avgMonthlyPayment: number;
    lastPaymentDate?: Date;
    nextDueDate?: Date;
    paymentComplianceRate: number;
  };
  paymentHistory: Array<{
    id: string;
    month: number;
    year: string;
    amount: number;
    dueDate: Date;
    overdueDate: Date;
    paidDate?: Date;
    paymentMethod?: string;
    paymentStatus: string;
    approvalStatus: string;
    attemptNumber: number;
    isOverdue: boolean;
    daysPastDue?: number;
    rentBillScreenshot?: string;
    electricityBillScreenshot?: string;
  }>;
  leavingRequests: Array<{
    id: string;
    requestedLeaveDate: Date;
    reason: string;
    feedback?: string;
    status: string;
    pendingDues?: number;
    finalAmount?: number;
    settledDate?: Date;
    paymentMethod?: string;
    createdAt: Date;
  }>;
  otpHistory: Array<{
    id: string;
    email: string;
    type: string;
    used: boolean;
    createdAt: Date;
    usedAt?: Date;
    expiresAt: Date;
    isExpired: boolean;
  }>;
  financialSummary: {
    totalAmountPaid: number;
    totalAmountPending: number;
    totalAmountOverdue: number;
    advanceAmountPaid: number;
    averagePaymentDelay: number;
    onTimePaymentPercentage: number;
    monthlyPaymentTrend: Array<{
      month: number;
      year: number;
      amount: number;
      status: string;
      paidOnTime: boolean;
    }>;
  };
  accountActivity: {
    loginAttempts: number;
    lastLoginDate?: Date;
    passwordResets: number;
    accountCreatedDate: Date;
    accountAge: string;
    totalOtpGenerated: number;
    successfulOtpUsage: number;
  };
}

// Helper function to calculate age from date of birth
const calculateAge = (dob: Date): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Helper function to calculate membership duration
const calculateMembershipDuration = (joiningDate: Date, leavingDate?: Date): string => {
  const endDate = leavingDate || new Date();
  const diffTime = Math.abs(endDate.getTime() - joiningDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}, ${days} day${days > 1 ? 's' : ''}`;
  } else {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
};

// Helper function to get month name
const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

// Helper function to calculate average payment delay
const calculateAveragePaymentDelay = (payments: any[]): number => {
  const paidPayments = payments.filter(p => p.paidDate && p.paymentStatus === 'PAID');
  if (paidPayments.length === 0) return 0;
  
  const totalDelay = paidPayments.reduce((sum, payment) => {
    const dueDate = new Date(payment.dueDate);
    const paidDate = new Date(payment.paidDate);
    const delayDays = Math.max(0, Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    return sum + delayDays;
  }, 0);
  
  return Math.round(totalDelay / paidPayments.length);
};

// Helper function to calculate on-time payment percentage
const calculateOnTimePaymentPercentage = (payments: any[]): number => {
  const paidPayments = payments.filter(p => p.paidDate && p.paymentStatus === 'PAID');
  if (paidPayments.length === 0) return 0;
  
  const onTimePayments = paidPayments.filter(payment => {
    const dueDate = new Date(payment.dueDate);
    const paidDate = new Date(payment.paidDate);
    return paidDate <= dueDate;
  });
  
  return Math.round((onTimePayments.length / paidPayments.length) * 100);
};

// Main function to generate comprehensive member report
export const generateMemberReport = async (memberId: string): Promise<MemberReportData> => {
  try {
    // Fetch member with all related data
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        pg: {
          select: {
            id: true,
            name: true,
            location: true,
            type: true
          }
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            rent: true,
            electricityCharge: true,
            capacity: true
          }
        },
        payment: {
          orderBy: [
            { year: 'desc' },
            { month: 'desc' },
            { attemptNumber: 'desc' }
          ]
        },
        leavingRequests: {
          orderBy: { createdAt: 'desc' }
        },
        OTP: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!member) {
      throw new Error('Member not found');
    }

    // Calculate member info
    const memberInfo = {
      id: member.id,
      memberId: member.memberId,
      name: member.name,
      age: calculateAge(member.dob),
      gender: member.gender,
      location: member.location,
      email: member.email,
      phone: member.phone,
      work: member.work,
      photoUrl: member.photoUrl || undefined,
      documentUrl: member.documentUrl || undefined,
      digitalSignature: member.digitalSignature || undefined,
      rentType: member.rentType,
      advanceAmount: member.advanceAmount,
      pricePerDay: member.pricePerDay || undefined,
      pgType: member.pgType,
      dateOfJoining: member.dateOfJoining,
      dateOfRelieving: member.dateOfRelieving || undefined,
      isActive: member.isActive,
      isFirstTimeLogin: member.isFirstTimeLogin,
      membershipDuration: calculateMembershipDuration(member.dateOfJoining, member.dateOfRelieving || undefined),
      status: member.isActive ? 'Active' : 'Inactive'
    };

    // Calculate PG info
    const pgInfo = {
      pgName: member.pg.name,
      pgLocation: member.pg.location,
      pgType: member.pg.type,
      roomNo: member.room?.roomNo,
      roomRent: member.room?.rent,
      roomElectricityCharge: member.room?.electricityCharge,
      roomCapacity: member.room?.capacity
    };

    // Process payment history
    const currentDate = new Date();
    const paymentHistory = member.payment.map(payment => ({
      id: payment.id,
      month: payment.month,
      year: payment.year.toString(),
      amount: payment.amount,
      dueDate: payment.dueDate,
      overdueDate: payment.overdueDate,
      paidDate: payment.paidDate || undefined,
      paymentMethod: payment.paymentMethod || undefined,
      paymentStatus: payment.paymentStatus,
      approvalStatus: payment.approvalStatus,
      attemptNumber: payment.attemptNumber,
      isOverdue: payment.paymentStatus === 'OVERDUE' || 
                 (payment.paymentStatus === 'PENDING' && currentDate > payment.overdueDate),
      daysPastDue: payment.paymentStatus === 'OVERDUE' || 
                   (payment.paymentStatus === 'PENDING' && currentDate > payment.overdueDate)
                   ? Math.ceil((currentDate.getTime() - payment.overdueDate.getTime()) / (1000 * 60 * 60 * 24))
                   : undefined,
      rentBillScreenshot: payment.rentBillScreenshot || undefined,
      electricityBillScreenshot: payment.electricityBillScreenshot || undefined
    }));

    // Calculate payment summary
    const totalPayments = member.payment.length;
    const totalPaidAmount = member.payment
      .filter(p => p.paymentStatus === 'PAID' || p.paymentStatus === 'APPROVED')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPendingAmount = member.payment
      .filter(p => p.paymentStatus === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalOverdueAmount = member.payment
      .filter(p => p.paymentStatus === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0);
    const approvedPayments = member.payment.filter(p => p.approvalStatus === 'APPROVED').length;
    const rejectedPayments = member.payment.filter(p => p.approvalStatus === 'REJECTED').length;
    const onlinePayments = member.payment.filter(p => p.paymentMethod === 'ONLINE').length;
    const cashPayments = member.payment.filter(p => p.paymentMethod === 'CASH').length;
    const avgMonthlyPayment = totalPayments > 0 ? totalPaidAmount / totalPayments : 0;
    const lastPayment = member.payment.find(p => p.paidDate);
    const lastPaymentDate = lastPayment?.paidDate;
    const nextDuePayment = member.payment.find(p => p.paymentStatus === 'PENDING');
    const nextDueDate = nextDuePayment?.dueDate;
    const paymentComplianceRate = totalPayments > 0 ? 
      Math.round((approvedPayments / totalPayments) * 100) : 0;

    const paymentSummary = {
      totalPayments,
      totalPaidAmount,
      totalPendingAmount,
      totalOverdueAmount,
      approvedPayments,
      rejectedPayments,
      onlinePayments,
      cashPayments,
      avgMonthlyPayment,
      lastPaymentDate: lastPaymentDate || undefined,
      nextDueDate: nextDueDate || undefined,
      paymentComplianceRate
    };

    // Process leaving requests
    const leavingRequests = member.leavingRequests.map(request => ({
      id: request.id,
      requestedLeaveDate: request.requestedLeaveDate,
      reason: request.reason,
      feedback: request.feedback || undefined,
      status: request.status,
      pendingDues: request.pendingDues || undefined,
      finalAmount: request.finalAmount || undefined,
      settledDate: request.settledDate || undefined,
      paymentMethod: request.paymentMethod || undefined,
      createdAt: request.createdAt
    }));

    // Process OTP history
    const otpHistory = member.OTP.map(otp => ({
      id: otp.id,
      email: otp.email,
      type: otp.type,
      used: otp.used,
      createdAt: otp.createdAt,
      usedAt: otp.usedAt || undefined,
      expiresAt: otp.expiresAt,
      isExpired: currentDate > otp.expiresAt
    }));

    // Calculate financial summary
    const averagePaymentDelay = calculateAveragePaymentDelay(member.payment);
    const onTimePaymentPercentage = calculateOnTimePaymentPercentage(member.payment);
    
    const monthlyPaymentTrend = member.payment.map(payment => ({
      month: payment.month,
      year: payment.year,
      amount: payment.amount,
      status: payment.paymentStatus,
      paidOnTime: payment.paidDate ? new Date(payment.paidDate) <= payment.dueDate : false
    }));

    const financialSummary = {
      totalAmountPaid: totalPaidAmount,
      totalAmountPending: totalPendingAmount,
      totalAmountOverdue: totalOverdueAmount,
      advanceAmountPaid: member.advanceAmount,
      averagePaymentDelay,
      onTimePaymentPercentage,
      monthlyPaymentTrend
    };

    // Calculate account activity
    const totalOtpGenerated = member.OTP.length;
    const successfulOtpUsage = member.OTP.filter(otp => otp.used).length;
    const passwordResets = member.OTP.filter(otp => otp.type === 'PASSWORD_RESET').length;
    
    const accountActivity = {
      loginAttempts: 0, // This would need to be tracked separately
      lastLoginDate: undefined, // This would need to be tracked separately
      passwordResets,
      accountCreatedDate: member.createdAt,
      accountAge: calculateMembershipDuration(member.createdAt),
      totalOtpGenerated,
      successfulOtpUsage
    };

    return {
      memberInfo,
      pgInfo,
      paymentSummary,
      paymentHistory,
      leavingRequests,
      otpHistory,
      financialSummary,
      accountActivity
    };

  } catch (error) {
    console.error('Error generating member report:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Helper function to format member report for display
export const formatMemberReportForDisplay = (reportData: MemberReportData) => {
  return {
    memberSummary: {
      name: reportData.memberInfo.name,
      memberId: reportData.memberInfo.memberId,
      status: reportData.memberInfo.status,
      age: reportData.memberInfo.age,
      membershipDuration: reportData.memberInfo.membershipDuration,
      pgName: reportData.pgInfo.pgName,
      roomNo: reportData.pgInfo.roomNo || 'Not Assigned'
    },
    financialOverview: {
      totalPaid: formatCurrency(reportData.paymentSummary.totalPaidAmount),
      totalPending: formatCurrency(reportData.paymentSummary.totalPendingAmount),
      totalOverdue: formatCurrency(reportData.paymentSummary.totalOverdueAmount),
      paymentCompliance: `${reportData.paymentSummary.paymentComplianceRate}%`,
      avgMonthlyPayment: formatCurrency(reportData.paymentSummary.avgMonthlyPayment),
      onTimePaymentRate: `${reportData.financialSummary.onTimePaymentPercentage}%`
    },
    recentActivity: {
      lastPaymentDate: reportData.paymentSummary.lastPaymentDate,
      nextDueDate: reportData.paymentSummary.nextDueDate,
      pendingLeavingRequests: reportData.leavingRequests.filter(r => r.status === 'PENDING').length,
      recentOtpUsage: reportData.otpHistory.slice(0, 5)
    },
    paymentBreakdown: {
      totalPayments: reportData.paymentSummary.totalPayments,
      approvedPayments: reportData.paymentSummary.approvedPayments,
      rejectedPayments: reportData.paymentSummary.rejectedPayments,
      onlinePayments: reportData.paymentSummary.onlinePayments,
      cashPayments: reportData.paymentSummary.cashPayments
    }
  };
};

// Generate comprehensive member report with PDF and organized files
export const generateMemberReportWithFiles = async (
  memberId: string,
  includeFiles: boolean = true
): Promise<{
  reportData: MemberReportData;
  zipPath?: string;
  zipSize?: string;
  tempDir?: string;
}> => {
  let tempDir: string | undefined;
  
  try {
    // Generate the basic report data
    const reportData = await generateMemberReport(memberId);
    
    if (!includeFiles) {
      return { reportData };
    }
    
    // Create temporary directory for file processing in project
    tempDir = createProjectTempDirectory();
    
    // Generate PDF
    const pdfPath = path.join(tempDir, 'member_report.pdf');
    await generateMemberReportPDF(reportData, pdfPath);
    
    // Organize member files
    const fileOrganization = await organizeMemberFiles(reportData, tempDir);
    
    // Generate ZIP file
    const zipPath = path.join(tempDir, `${reportData.memberInfo.memberId}_complete_report.zip`);
    const zipResult = await generateMemberReportZip({
      memberData: reportData,
      pdfPath,
      tempDir,
      outputPath: zipPath,
      includeManifest: true
    });
    
    return {
      reportData,
      zipPath: zipResult.zipPath,
      zipSize: formatFileSize(zipResult.zipSize),
      tempDir
    };
    
  } catch (error) {
    // Clean up on error
    if (tempDir) {
      cleanupTempDirectory(tempDir);
    }
    console.error('Error generating member report with files:', error);
    throw error;
  }
};