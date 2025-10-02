import { Request, Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import { 
  generateMemberToken, 
  hashPassword, 
  comparePassword, 
  generateSecureOTP, 
  hashOTP, 
  verifyOTP 
} from "../utils/auth";
import { sendEmail } from "../services/emailService";
import calculateAge from "../utils/ageCalculator";

// Enhanced request interface for member auth
export interface AuthenticatedMemberRequest extends Request {
  member?: {
    id: string;
    email: string;
    name: string;
    memberId: string;
    pgType: string;
  };
}

// OTP Email Template
const createOTPEmailContent = (name: string, otpCode: string, isInitialSetup: boolean = false): string => {
  const purpose = isInitialSetup ? "complete your account setup" : "login to your account";
  const title = isInitialSetup ? "Welcome to PG Management!" : "Login OTP";
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
          Hello <strong>${name}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">
          Your OTP code to ${purpose} is:
        </p>
        
        <div style="background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
          <h2 style="margin: 0; font-size: 32px; letter-spacing: 3px; font-family: 'Courier New', monospace;">
            ${otpCode}
          </h2>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>⚠️ Important:</strong> This OTP will expire in 15 minutes. Do not share this code with anyone.
          </p>
        </div>
        
        ${isInitialSetup ? `
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #155724; font-size: 14px;">
            <strong>📱 Next Steps:</strong> After using this OTP, you'll be asked to create a secure password for future logins.
          </p>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 14px;">
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p>© 2025 PG Management System. All rights reserved.</p>
      </div>
    </div>
  `;
};

// Send OTP to member
export const sendMemberOTP = async (memberId: string, type: 'PASSWORD_RESET' | 'INITIAL_SETUP' = 'INITIAL_SETUP'): Promise<void> => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    // Generate OTP
    const otpCode = generateSecureOTP();
    const hashedOTP = await hashOTP(otpCode);

    // Delete existing unused OTPs for this member of the same type
    await prisma.oTP.deleteMany({
      where: {
        memberId: member.id,
        type: type,
      },
    });

    // Create new OTP
    await prisma.oTP.create({
      data: {
        memberId: member.id,
        email: member.email,
        code: hashedOTP,
        type: type,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Send OTP email
    const emailContent = createOTPEmailContent(
      member.name, 
      otpCode, 
      type === 'INITIAL_SETUP'
    );
    
    await sendEmail({
      to: member.email,
      subject: type === 'INITIAL_SETUP' 
        ? `🔐 Account Setup OTP - ${member.name}`
        : `🔐 Login OTP - ${member.name}`,
      body: emailContent,
    });

    console.log(`OTP sent to member: ${member.email} (Type: ${type})`);
  } catch (error) {
    console.error('Error sending member OTP:', error);
    throw error;
  }
};

// Verify OTP without logging in
export const verifyMemberOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      } as ApiResponse<null>);
      return;
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      } as ApiResponse<null>);
      return;
    }

    // Check if member is active
    if (!member.isActive) {
      res.status(403).json({
        success: false,
        message: 'Member account is inactive. Please contact admin.',
      } as ApiResponse<null>);
      return;
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        memberId: member.id,
        email: member.email,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      } as ApiResponse<null>);
      return;
    }

    // Verify OTP
    const isOTPValid = await verifyOTP(otp, otpRecord.code);

    if (!isOTPValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code',
      } as ApiResponse<null>);
      return;
    }

    // Delete the used OTP
    await prisma.oTP.delete({
      where: { id: otpRecord.id },
    });

    res.status(200).json({
      success: true,
      message: 'OTP verification successful',
      data: {
        email: member.email,
        verified: true,
        otpType: otpRecord.type,
      },
    } as ApiResponse<any>);

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

// Member password setup (after first OTP login)
export const setupMemberPassword = async (req: AuthenticatedMemberRequest, res: Response): Promise<void> => {
  try {
    const { password, confirmPassword } = req.body;
    const memberId = req.member?.id;

    // Validate input
    if (!password || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Password and confirmation are required',
      } as ApiResponse<null>);
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      } as ApiResponse<null>);
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      } as ApiResponse<null>);
      return;
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      } as ApiResponse<null>);
      return;
    }

    // Check if it's first time login
    if (!member.isFirstTimeLogin) {
      res.status(400).json({
        success: false,
        message: 'Password has already been set up',
      } as ApiResponse<null>);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update member
    await prisma.member.update({
      where: { id: memberId },
      data: {
        password: hashedPassword,
        isFirstTimeLogin: false,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password set up successfully. You can now login with your email and password.',
    } as ApiResponse<null>);

  } catch (error) {
    console.error('Password setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

// Unified member login (handles both first-time OTP login and regular password login)
export const memberLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password/OTP are required',
      } as ApiResponse<null>);
      return;
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { email },
      include: {
        pg: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            rent: true,
          },
        },
      },
    });

    if (!member) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or credentials',
      } as ApiResponse<null>);
      return;
    }

    // Check if member is active
    if (!member.isActive) {
      res.status(403).json({
        success: false,
        message: 'Member account is inactive. Please contact admin.',
      } as ApiResponse<null>);
      return;
    }

    let isLoginSuccessful = false;
    let loginMethod = '';
    let requirePasswordSetup = false;

    // Check if this is first-time login (should use OTP)
    if (member.isFirstTimeLogin) {
      // For first-time users, treat the 'password' field as OTP
      const otp = password;

      // Validate OTP format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        res.status(400).json({
          success: false,
          message: 'Invalid OTP format. OTP must be 6 digits.',
        } as ApiResponse<null>);
        return;
      }

      // Find valid OTP for this member
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          memberId: member.id,
          email: member.email,
          type: 'INITIAL_SETUP',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new one or contact support.',
        } as ApiResponse<null>);
        return;
      }

      // Verify OTP
      const isOTPValid = await verifyOTP(otp, otpRecord.code);

      if (!isOTPValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid OTP code',
        } as ApiResponse<null>);
        return;
      }

      // OTP is valid - delete the used OTP
      await prisma.oTP.delete({
        where: { id: otpRecord.id },
      });

      isLoginSuccessful = true;
      loginMethod = 'OTP';
      requirePasswordSetup = true;

    } else {
      // For returning users, use regular password authentication
      if (!member.password) {
        res.status(400).json({
          success: false,
          message: 'Account setup incomplete. Please contact support.',
        } as ApiResponse<null>);
        return;
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, member.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        } as ApiResponse<null>);
        return;
      }

      isLoginSuccessful = true;
      loginMethod = 'PASSWORD';
      requirePasswordSetup = false;
    }

    // If login successful, generate token and return response
    if (isLoginSuccessful) {
      const token = generateMemberToken({
        id: member.id,
        email: member.email,
        name: member.name,
        memberId: member.memberId,
        pgType: member.pgType,
      });

      res.status(200).json({
        success: true,
        message: loginMethod === 'OTP' 
          ? 'OTP verification successful. Please set up your password.' 
          : 'Login successful',
        data: {
          token,
          member: {
            id: member.id,
            name: member.name,
            email: member.email,
            memberId: member.memberId,
            pgType: member.pgType,
            pg: member.pg,
            room: member.room,
            isFirstTimeLogin: member.isFirstTimeLogin,
          },
          loginMethod,
          requirePasswordSetup,
          ...(loginMethod === 'OTP' && {
            nextStep: 'password_setup',
            message_detail: 'You must set up a password before accessing your account fully.'
          }),
        },
      } as ApiResponse<any>);
    }

  } catch (error) {
    console.error('Member login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

// Change password (for logged-in members)
export const changeMemberPassword = async (req: AuthenticatedMemberRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const memberId = req.member?.id;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'All password fields are required',
      } as ApiResponse<null>);
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      } as ApiResponse<null>);
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      } as ApiResponse<null>);
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || !member.password) {
      res.status(404).json({
        success: false,
        message: 'Member not found or password not set',
      } as ApiResponse<null>);
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, member.password);

    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      } as ApiResponse<null>);
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.member.update({
      where: { id: memberId },
      data: {
        password: hashedNewPassword,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    } as ApiResponse<null>);

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

// Reset password (after OTP verification)
export const resetMemberPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, new password, and confirm password are required',
      } as ApiResponse<null>);
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      } as ApiResponse<null>);
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      } as ApiResponse<null>);
      return;
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      } as ApiResponse<null>);
      return;
    }

    // Check if member is active
    if (!member.isActive) {
      res.status(403).json({
        success: false,
        message: 'Member account is inactive. Please contact admin.',
      } as ApiResponse<null>);
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update member password
    await prisma.member.update({
      where: { id: member.id },
      data: {
        password: hashedPassword,
        isFirstTimeLogin: false, // Ensure it's not first time login anymore
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    } as ApiResponse<null>);

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

// Request password reset OTP
export const requestPasswordResetOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      } as ApiResponse<null>);
      return;
    }

    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member) {
      // Don't reveal if email exists or not for security
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset OTP has been sent',
      } as ApiResponse<null>);
      return;
    }

    if (!member.isActive) {
      res.status(403).json({
        success: false,
        message: 'Member account is inactive',
      } as ApiResponse<null>);
      return;
    }

    await sendMemberOTP(member.id, 'PASSWORD_RESET');

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent successfully',
    } as ApiResponse<null>);

  } catch (error) {
    console.error('Request password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

// Get member profile
export const getMemberProfile = async (req: AuthenticatedMemberRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.member?.id;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        pg: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            rent: true,
            capacity: true,
          },
        },
      },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      } as ApiResponse<null>);
      return;
    }

    const profileData = {
      pgDetails: {
        pgName: member.pg?.name || 'N/A',
        roomNumber: member.room?.roomNo || 'Not assigned',
        pgLocation: member.pg?.location || 'N/A',
        dateOfJoining: member.dateOfJoining,
        monthlyRent: member.room?.rent || 0,
        advanceAmount: member.advanceAmount,
      },
      personalInfo: {
        name: member.name,
        age: calculateAge(member.dob),
        dob: member.dob,
        gender: member.gender,
        workType: member.work,
      },
      contactInfo: {
        phoneNo: member.phone,
        email: member.email,
        location: member.location,
      },
    };

    res.status(200).json({
      success: true,
      message: 'Member profile retrieved successfully',
      data: profileData,
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Get member profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

// Update member profile
export const updateMemberProfile = async (req: AuthenticatedMemberRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.member?.id;
    const { name, dob, phone, location, work } = req.body;

    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      } as ApiResponse<null>);
      return;
    }

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!existingMember) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      } as ApiResponse<null>);
      return;
    }

    // Check if phone number already exists (if phone is being updated)
    if (phone && phone !== existingMember.phone) {
      const existingPhoneMember = await prisma.member.findUnique({
        where: { phone },
      });

      if (existingPhoneMember) {
        res.status(400).json({
          success: false,
          message: 'Phone number already exists with another member',
        } as ApiResponse<null>);
        return;
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (dob !== undefined) updateData.dob = new Date(dob);
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location.trim();
    if (work !== undefined) updateData.work = work.trim();

    // Update member profile
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
      include: {
        pg: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            rent: true,
            capacity: true,
          },
        },
      },
    });

    const profileData = {
      pgDetails: {
        pgName: updatedMember.pg?.name || 'N/A',
        roomNumber: updatedMember.room?.roomNo || 'Not assigned',
        pgLocation: updatedMember.pg?.location || 'N/A',
        dateOfJoining: updatedMember.dateOfJoining,
        monthlyRent: updatedMember.room?.rent || 0,
        advanceAmount: updatedMember.advanceAmount,
      },
      personalInfo: {
        name: updatedMember.name,
        age: calculateAge(updatedMember.dob),
        dob: updatedMember.dob,
        gender: updatedMember.gender,
        workType: updatedMember.work,
      },
      contactInfo: {
        phoneNo: updatedMember.phone,
        email: updatedMember.email,
        location: updatedMember.location,
      },
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData,
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Update member profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

/**
 * Get current month overview for member
 */
export const getCurrentMonthOverview = async (req: AuthenticatedMemberRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.member?.id;

    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - Member not found',
      } as ApiResponse<null>);
      return;
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get member details with room and payment info
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        room: true,
        pg: {
          select: {
            name: true,
            location: true,
          }
        },
        payment: {
          where: {
            month: currentMonth,
            year: currentYear,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        }
      }
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      } as ApiResponse<null>);
      return;
    }

    if (!member.room) {
      res.status(400).json({
        success: false,
        message: 'Room not assigned to member',
      } as ApiResponse<null>);
      return;
    }

    // Calculate rent amount based on rent type
    let rentAmount = 0;
    if (member.rentType === 'LONG_TERM') {
      rentAmount = member.room.rent;
    } else if (member.rentType === 'SHORT_TERM' && member.pricePerDay) {
      // For daily rent, calculate based on days in current month
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      rentAmount = member.pricePerDay * daysInMonth;
    }

    // Get electricity bill amount
    const electricityBillAmount = member.room.electricityCharge;

    // Get payment details if exists
    const currentPayment = member.payment[0];
    
    const overviewData = {
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        monthName: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' }),
      },
      billing: {
        rentAmount,
        electricityBillAmount,
        totalAmount: rentAmount + electricityBillAmount,
      },
      paymentInfo: {
        paymentStatus: currentPayment.paymentStatus,
        dueDate: currentPayment.dueDate,
      },
      isOverdue: currentPayment ? (
        currentPayment.paymentStatus !== 'PAID' && 
        new Date() > new Date(currentPayment.overdueDate)
      ) : false,
    };

    res.status(200).json({
      success: true,
      message: 'Current month overview retrieved successfully',
      data: overviewData,
    } as ApiResponse<typeof overviewData>);

  } catch (error) {
    console.error('Get current month overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse<null>);
  }
};

export const updateDigitalSignature = async (req: AuthenticatedMemberRequest, res: Response) => {
  try {
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse<null>);
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Digital signature image is required',
      } as ApiResponse<null>);
    }

    // Get current member to check if they have an existing digital signature
    const currentMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { digitalSignature: true, name: true }
    });

    if (!currentMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      } as ApiResponse<null>);
    }

    // If member has an existing digital signature, delete the old file
    if (currentMember.digitalSignature) {
      try {
        const { deleteImage, ImageType } = await import('../utils/imageUpload');
        await deleteImage(currentMember.digitalSignature, ImageType.DOCUMENT);
      } catch (error) {
        console.warn('Failed to delete old digital signature:', error);
        // Continue with update even if old file deletion fails
      }
    }

    // Update the member's digital signature
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        digitalSignature: req.file.filename
      },
      select: {
        id: true,
        name: true,
        digitalSignature: true
      }
    });

    // Get the image URL for response
    const { getImageUrl, ImageType } = await import('../utils/imageUpload');
    const digitalSignatureUrl = getImageUrl(req.file.filename, ImageType.DOCUMENT);

    res.status(200).json({
      success: true,
      message: 'Digital signature updated successfully',
      data: {
        id: updatedMember.id,
        name: updatedMember.name,
        digitalSignature: updatedMember.digitalSignature,
        digitalSignatureUrl
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Update digital signature error:', error);
    
    // If there was an error, try to clean up the uploaded file
    if (req.file) {
      try {
        const { deleteImage, ImageType } = await import('../utils/imageUpload');
        await deleteImage(req.file.filename, ImageType.DOCUMENT);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file after error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update digital signature',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

// Get member digital signature
export const getMemberDigitalSignature = async (req: AuthenticatedMemberRequest, res: Response) => {
  try {
    if (!req.member) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse<null>);
    }

    const member = await prisma.member.findUnique({
      where: { 
        id: req.member.id 
      },
      select: {
        id: true,
        name: true,
        digitalSignature: true
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      } as ApiResponse<null>);
    }

    // Get the image URL if digital signature exists
    let digitalSignatureUrl = null;
    if (member.digitalSignature) {
      const { getImageUrl, ImageType } = await import('../utils/imageUpload');
      digitalSignatureUrl = getImageUrl(member.digitalSignature, ImageType.DOCUMENT);
    }

    res.status(200).json({
      success: true,
      message: 'Digital signature retrieved successfully',
      data: {
        id: member.id,
        name: member.name,
        digitalSignature: member.digitalSignature,
        digitalSignatureUrl
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Get digital signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve digital signature',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

// Get member document proof
export const getMemberDocumentProof = async (req: AuthenticatedMemberRequest, res: Response) => {
  try {
    if (!req.member) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse<null>);
    }

    const member = await prisma.member.findUnique({
      where: { 
        id: req.member.id 
      },
      select: {
        id: true,
        name: true,
        documentUrl: true
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      } as ApiResponse<null>);
    }

    res.status(200).json({
      success: true,
      message: 'Document proof retrieved successfully',
      data: {
        id: member.id,
        name: member.name,
        documentUrl: member.documentUrl
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Get document proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document proof',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

// Update member document proof
export const updateMemberDocumentProof = async (req: AuthenticatedMemberRequest, res: Response) => {
  try {
    if (!req.member) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse<null>);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required'
      } as ApiResponse<null>);
    }

    // Get current member to check for existing document
    const currentMember = await prisma.member.findUnique({
      where: { id: req.member.id },
      select: { documentUrl: true }
    });

    if (!currentMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      } as ApiResponse<null>);
    }

    // Generate document URL
    const documentUrl = `/uploads/document/${req.file.filename}`;

    // Update member with new document
    const updatedMember = await prisma.member.update({
      where: { 
        id: req.member.id 
      },
      data: {
        documentUrl: documentUrl
      },
      select: {
        id: true,
        name: true,
        documentUrl: true
      }
    });

    // If there was a previous document, try to delete it
    if (currentMember.documentUrl) {
      try {
        const { deleteImage, ImageType } = await import('../utils/imageUpload');
        const oldFilename = currentMember.documentUrl.split('/').pop();
        if (oldFilename) {
          await deleteImage(oldFilename, ImageType.DOCUMENT);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup old document file:', cleanupError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Document proof updated successfully',
      data: {
        id: updatedMember.id,
        name: updatedMember.name,
        documentUrl: updatedMember.documentUrl
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Update document proof error:', error);
    
    // If there was an error, try to clean up the uploaded file
    if (req.file) {
      try {
        const { deleteImage, ImageType } = await import('../utils/imageUpload');
        await deleteImage(req.file.filename, ImageType.DOCUMENT);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file after error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update document proof',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};