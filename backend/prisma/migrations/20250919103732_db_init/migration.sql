-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'APPROVED', 'REJECTED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."RentType" AS ENUM ('LONG_TERM', 'SHORT_TERM');

-- CreateEnum
CREATE TYPE "public"."PgType" AS ENUM ('WOMENS', 'MENS');

-- CreateEnum
CREATE TYPE "public"."EnquiryStatus" AS ENUM ('NOT_RESOLVED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('ONLINE', 'CASH');

-- CreateEnum
CREATE TYPE "public"."LeavingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."OTPType" AS ENUM ('PASSWORD_RESET', 'INITIAL_SETUP');

-- CreateEnum
CREATE TYPE "public"."EntryType" AS ENUM ('CASH_IN', 'CASH_OUT');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "pgType" "public"."PgType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "public"."EnquiryStatus" NOT NULL DEFAULT 'NOT_RESOLVED',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PG" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PgType" NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PG_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "rent" DOUBLE PRECISION NOT NULL,
    "electricityCharge" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pGId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "location" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT NOT NULL,
    "work" TEXT NOT NULL,
    "photoUrl" TEXT,
    "documentUrl" TEXT,
    "digitalSignature" TEXT,
    "rentType" "public"."RentType" NOT NULL,
    "advanceAmount" DOUBLE PRECISION NOT NULL,
    "pricePerDay" DOUBLE PRECISION,
    "pgType" "public"."PgType" NOT NULL,
    "pgId" TEXT NOT NULL,
    "roomId" TEXT,
    "dateOfJoining" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfRelieving" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFirstTimeLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OTP" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "public"."OTPType" NOT NULL DEFAULT 'PASSWORD_RESET',
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegisteredMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "location" TEXT NOT NULL,
    "pgLocation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "work" TEXT NOT NULL,
    "photoUrl" TEXT,
    "documentUrl" TEXT,
    "rentType" "public"."RentType" NOT NULL,
    "pgType" "public"."PgType" NOT NULL,
    "dateOfRelieving" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegisteredMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeavingRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "roomId" TEXT,
    "requestedLeaveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "feedback" TEXT,
    "status" "public"."LeavingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "pendingDues" DOUBLE PRECISION,
    "finalAmount" DOUBLE PRECISION,
    "settledDate" TIMESTAMP(3),
    "settlementProof" TEXT,
    "paymentMethod" "public"."PaymentMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "overdueDate" TIMESTAMP(3) NOT NULL,
    "rentBillScreenshot" TEXT,
    "electricityBillScreenshot" TEXT,
    "paidDate" TIMESTAMP(3),
    "paymentMethod" "public"."PaymentMethod",
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "approvalStatus" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentStats" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "pgType" "public"."PgType" NOT NULL,
    "totalPendingPayments" INTEGER NOT NULL,
    "totalAmountPending" INTEGER NOT NULL,
    "totalOverduePayments" INTEGER NOT NULL,
    "thisMonthPendingPaymentCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "entryType" "public"."EntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "partyName" TEXT NOT NULL,
    "paymentType" "public"."PaymentMethod" NOT NULL,
    "remarks" TEXT,
    "attachedBill1" TEXT,
    "attachedBill2" TEXT,
    "attachedBill3" TEXT,
    "createdBy" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExpenseStats" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "pgType" "public"."PgType" NOT NULL,
    "totalCashInAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCashInCount" INTEGER NOT NULL DEFAULT 0,
    "totalCashOutAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCashOutCount" INTEGER NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashOutOnline" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashOutCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashInOnline" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashInCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashInPercentChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashOutPercentChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPercentChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "pgType" "public"."PgType" NOT NULL,
    "year" INTEGER NOT NULL,
    "reportType" "public"."ReportType" NOT NULL,
    "period" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "newMembers" INTEGER NOT NULL,
    "newMembersTrendPercent" DOUBLE PRECISION NOT NULL,
    "rentCollected" DOUBLE PRECISION NOT NULL,
    "rentCollectedTrendPercent" DOUBLE PRECISION NOT NULL,
    "memberDepartures" INTEGER NOT NULL,
    "memberDeparturesTrendPercent" DOUBLE PRECISION NOT NULL,
    "totalExpenses" DOUBLE PRECISION NOT NULL,
    "totalExpensesTrendPercent" DOUBLE PRECISION NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "netProfitTrendPercent" DOUBLE PRECISION NOT NULL,
    "pgPerformanceData" JSONB NOT NULL,
    "roomUtilizationData" JSONB NOT NULL,
    "paymentAnalyticsData" JSONB NOT NULL,
    "financialSummaryData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE INDEX "Enquiry_status_idx" ON "public"."Enquiry"("status");

-- CreateIndex
CREATE INDEX "Enquiry_createdAt_idx" ON "public"."Enquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomNo_pGId_key" ON "public"."Room"("roomNo", "pGId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberId_key" ON "public"."Member"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "public"."Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_phone_key" ON "public"."Member"("phone");

-- CreateIndex
CREATE INDEX "OTP_memberId_idx" ON "public"."OTP"("memberId");

-- CreateIndex
CREATE INDEX "OTP_email_idx" ON "public"."OTP"("email");

-- CreateIndex
CREATE INDEX "OTP_expiresAt_idx" ON "public"."OTP"("expiresAt");

-- CreateIndex
CREATE INDEX "OTP_used_idx" ON "public"."OTP"("used");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredMember_email_key" ON "public"."RegisteredMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredMember_phone_key" ON "public"."RegisteredMember"("phone");

-- CreateIndex
CREATE INDEX "LeavingRequest_memberId_idx" ON "public"."LeavingRequest"("memberId");

-- CreateIndex
CREATE INDEX "LeavingRequest_pgId_idx" ON "public"."LeavingRequest"("pgId");

-- CreateIndex
CREATE INDEX "LeavingRequest_status_idx" ON "public"."LeavingRequest"("status");

-- CreateIndex
CREATE INDEX "LeavingRequest_requestedLeaveDate_idx" ON "public"."LeavingRequest"("requestedLeaveDate");

-- CreateIndex
CREATE INDEX "Payment_pgId_month_year_idx" ON "public"."Payment"("pgId", "month", "year");

-- CreateIndex
CREATE INDEX "Payment_memberId_month_year_idx" ON "public"."Payment"("memberId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_memberId_month_year_attemptNumber_key" ON "public"."Payment"("memberId", "month", "year", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentStats_pgType_month_year_key" ON "public"."PaymentStats"("pgType", "month", "year");

-- CreateIndex
CREATE INDEX "Expense_pgId_idx" ON "public"."Expense"("pgId");

-- CreateIndex
CREATE INDEX "Expense_createdBy_idx" ON "public"."Expense"("createdBy");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "public"."Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_entryType_idx" ON "public"."Expense"("entryType");

-- CreateIndex
CREATE INDEX "ExpenseStats_pgType_idx" ON "public"."ExpenseStats"("pgType");

-- CreateIndex
CREATE INDEX "ExpenseStats_month_year_idx" ON "public"."ExpenseStats"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseStats_pgType_month_year_key" ON "public"."ExpenseStats"("pgType", "month", "year");

-- CreateIndex
CREATE INDEX "Report_reportType_year_period_idx" ON "public"."Report"("reportType", "year", "period");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_pgType_reportType_period_year_key" ON "public"."Report"("pgType", "reportType", "period", "year");

-- AddForeignKey
ALTER TABLE "public"."Enquiry" ADD CONSTRAINT "Enquiry_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_pGId_fkey" FOREIGN KEY ("pGId") REFERENCES "public"."PG"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "public"."PG"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OTP" ADD CONSTRAINT "OTP_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeavingRequest" ADD CONSTRAINT "LeavingRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeavingRequest" ADD CONSTRAINT "LeavingRequest_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "public"."PG"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeavingRequest" ADD CONSTRAINT "LeavingRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "public"."PG"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "public"."PG"("id") ON DELETE CASCADE ON UPDATE CASCADE;
