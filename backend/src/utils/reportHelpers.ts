// Helper function to get date range for weekly reports
export const getWeeklyDateRange = (dateRange: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  switch (dateRange) {
    case 'last14days':
      start = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
      break;
    case 'custom':
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      }
      break;
    case 'last7days':
    default:
      start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
  }

  // Set to start and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// Helper function to get date range for monthly reports
export const getMonthlyDateRange = (dateRange: string, month?: number, year?: number, startDate?: string, endDate?: string) => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (dateRange) {
    case 'current_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'previous_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'last_3_months':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'custom':
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else if (month && year) {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
  }

  // Set to start and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// Helper function to parse multi-select filter values
export const parseMultiSelectValues = (param: string | undefined): string[] => {
  if (!param) return [];
  return param.split(',').map(val => decodeURIComponent(val.trim())).filter(val => val.length > 0);
};

// Helper function to calculate trend percentages
export const calculateTrendPercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

// Helper function to format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-IN");
};

// Helper function to get previous period range
export const getPreviousPeriodRange = (currentRange: { start: Date; end: Date }, periodType: 'weekly' | 'monthly') => {
  const duration = currentRange.end.getTime() - currentRange.start.getTime();
  
  if (periodType === 'weekly') {
    return {
      start: new Date(currentRange.start.getTime() - duration),
      end: new Date(currentRange.end.getTime() - duration),
    };
  } else {
    // For monthly, get the previous month
    const start = new Date(currentRange.start);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(currentRange.end);
    end.setMonth(end.getMonth() - 1);
    return { start, end };
  }
};

// Helper function to get filtered PG IDs based on admin type and filters
export const getFilteredPgIds = async (
  prisma: any,
  adminPgType: string,
  pgLocation?: string,
  pgId?: string
): Promise<string[]> => {
  // Get all PGs of admin's type
  const pgs = await prisma.pG.findMany({
    where: { type: adminPgType },
    select: { id: true },
  });

  let filteredPgIds = pgs.map((pg: any) => pg.id);

  // Filter PGs based on location if specified
  if (pgLocation) {
    const selectedPgLocations = parseMultiSelectValues(pgLocation);
    if (selectedPgLocations.length > 0) {
      const pgsInLocation = await prisma.pG.findMany({
        where: {
          type: adminPgType,
          location: { in: selectedPgLocations },
        },
        select: { id: true },
      });
      filteredPgIds = pgsInLocation.map((pg: any) => pg.id);
    }
  }

  // Filter by specific PG if provided
  if (pgId && filteredPgIds.includes(pgId)) {
    filteredPgIds = [pgId];
  }

  return filteredPgIds;
};

// Helper function to format member report data for Excel export
export const formatMemberDataForExport = (memberData: any) => {
  return {
    'Member ID': memberData.memberId,
    'Name': memberData.name,
    'Age': memberData.age,
    'Gender': memberData.gender,
    'Phone': memberData.phone,
    'Email': memberData.email,
    'PG Name': memberData.pgName,
    'Room No': memberData.roomNo || 'Not Assigned',
    'Rent Type': memberData.rentType,
    'Status': memberData.status,
    'Date of Joining': memberData.dateOfJoining.toLocaleDateString(),
    'Membership Duration': memberData.membershipDuration,
    'Total Payments': memberData.totalPayments,
    'Total Paid Amount': formatCurrency(memberData.totalPaidAmount),
    'Total Pending Amount': formatCurrency(memberData.totalPendingAmount),
    'Total Overdue Amount': formatCurrency(memberData.totalOverdueAmount),
    'Payment Compliance Rate': `${memberData.paymentComplianceRate}%`,
    'On-Time Payment Rate': `${memberData.onTimePaymentPercentage}%`,
    'Average Payment Delay (Days)': memberData.averagePaymentDelay,
    'Last Payment Date': memberData.lastPaymentDate?.toLocaleDateString() || 'N/A',
    'Next Due Date': memberData.nextDueDate?.toLocaleDateString() || 'N/A'
  };
};

// Helper function to generate payment analytics for member
export const generateMemberPaymentAnalytics = (payments: any[]) => {
  const analytics = {
    monthlyBreakdown: {} as Record<string, { paid: number, pending: number, overdue: number }>,
    paymentMethodBreakdown: { online: 0, cash: 0, unknown: 0 },
    statusBreakdown: { paid: 0, pending: 0, overdue: 0, approved: 0, rejected: 0 },
    averageMonthlyAmount: 0,
    paymentFrequency: 0,
    consecutiveOnTimePayments: 0,
    longestDelayDays: 0
  };

  payments.forEach(payment => {
    const monthYear = `${payment.year}-${payment.month.toString().padStart(2, '0')}`;
    
    // Monthly breakdown
    if (!analytics.monthlyBreakdown[monthYear]) {
      analytics.monthlyBreakdown[monthYear] = { paid: 0, pending: 0, overdue: 0 };
    }
    
    if (payment.paymentStatus === 'PAID' || payment.paymentStatus === 'APPROVED') {
      analytics.monthlyBreakdown[monthYear].paid += payment.amount;
    } else if (payment.paymentStatus === 'PENDING') {
      analytics.monthlyBreakdown[monthYear].pending += payment.amount;
    } else if (payment.paymentStatus === 'OVERDUE') {
      analytics.monthlyBreakdown[monthYear].overdue += payment.amount;
    }

    // Payment method breakdown
    if (payment.paymentMethod === 'ONLINE') {
      analytics.paymentMethodBreakdown.online++;
    } else if (payment.paymentMethod === 'CASH') {
      analytics.paymentMethodBreakdown.cash++;
    } else {
      analytics.paymentMethodBreakdown.unknown++;
    }

    // Status breakdown
    if (payment.paymentStatus === 'PAID') analytics.statusBreakdown.paid++;
    else if (payment.paymentStatus === 'PENDING') analytics.statusBreakdown.pending++;
    else if (payment.paymentStatus === 'OVERDUE') analytics.statusBreakdown.overdue++;
    
    if (payment.approvalStatus === 'APPROVED') analytics.statusBreakdown.approved++;
    else if (payment.approvalStatus === 'REJECTED') analytics.statusBreakdown.rejected++;
  });

  // Calculate averages and metrics
  if (payments.length > 0) {
    analytics.averageMonthlyAmount = payments.reduce((sum, p) => sum + p.amount, 0) / payments.length;
    analytics.paymentFrequency = payments.length;
  }

  return analytics;
};

// Helper function to calculate member financial health score
export const calculateMemberFinancialHealthScore = (memberData: any): number => {
  let score = 100;
  
  // Deduct points for pending payments
  if (memberData.totalPendingAmount > 0) {
    score -= Math.min(20, (memberData.totalPendingAmount / memberData.avgMonthlyPayment) * 5);
  }
  
  // Deduct points for overdue payments
  if (memberData.totalOverdueAmount > 0) {
    score -= Math.min(30, (memberData.totalOverdueAmount / memberData.avgMonthlyPayment) * 10);
  }
  
  // Deduct points for low payment compliance
  if (memberData.paymentComplianceRate < 80) {
    score -= (80 - memberData.paymentComplianceRate) * 0.5;
  }
  
  // Deduct points for high average payment delay
  if (memberData.averagePaymentDelay > 7) {
    score -= Math.min(15, (memberData.averagePaymentDelay - 7) * 2);
  }
  
  // Add points for good on-time payment rate
  if (memberData.onTimePaymentPercentage > 90) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Helper function to get member status badge color
export const getMemberStatusBadgeColor = (status: string, financialHealthScore: number): string => {
  if (status === 'Inactive') return 'red';
  
  if (financialHealthScore >= 80) return 'green';
  if (financialHealthScore >= 60) return 'yellow';
  return 'red';
};

// Helper function to format payment history for timeline display
export const formatPaymentHistoryTimeline = (payments: any[]) => {
  return payments.map(payment => ({
    date: payment.paidDate || payment.dueDate,
    title: `${getMonthName(payment.month)} ${payment.year} Payment`,
    amount: formatCurrency(payment.amount),
    status: payment.paymentStatus,
    isOverdue: payment.isOverdue,
    daysPastDue: payment.daysPastDue,
    paymentMethod: payment.paymentMethod || 'Not Specified',
    color: payment.paymentStatus === 'PAID' || payment.paymentStatus === 'APPROVED' ? 'green' :
           payment.paymentStatus === 'OVERDUE' ? 'red' : 'orange'
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Helper function to get month name from number
const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

// Helper function to format date for display
export const formatDate = (date: Date | string): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
