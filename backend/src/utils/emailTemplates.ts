import { ENV } from '../config/env';

// Base HTML email template wrapper
export const createEmailTemplate = (content: string, subject: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .email-container {
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .content {
                padding: 40px 30px;
            }
            .content h2 {
                color: #667eea;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 10px;
                margin-bottom: 25px;
            }
            .highlight-box {
                background-color: #f8f9ff;
                border-left: 4px solid #667eea;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 0 5px 5px 0;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                margin: 5px 0;
            }
            .divider {
                height: 1px;
                background-color: #e9ecef;
                margin: 30px 0;
            }
            .contact-info {
                background-color: #f8f9ff;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .otp-code {
                background: #007bff;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
                font-family: 'Courier New', monospace;
                letter-spacing: 2px;
                font-size: 24px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>${ENV.COMPANY_NAME}</h1>
                <p>PG Management System</p>
            </div>
            
            <div class="content">
                ${content}
                
                <div class="divider"></div>
                
                <div class="contact-info">
                    <h3 style="margin-top: 0; color: #667eea;">Need Help?</h3>
                    <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>This is an automated email. Please do not reply to this message.</strong></p>
                <p>© ${new Date().getFullYear()} ${ENV.COMPANY_NAME}. All rights reserved.</p>
                <p>Visit us at: <a href="${ENV.COMPANY_WEBSITE}" style="color: #667eea;">${ENV.COMPANY_WEBSITE}</a></p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="font-size: 11px; color: #888;">
                        <strong>Terms and Conditions:</strong><br>
                        By using our services, you agree to our terms and conditions. 
                        This email contains confidential information intended solely for the recipient. 
                        If you have received this email in error, please notify us immediately and delete this email.
                    </p>
                </div>
                
                <div style="margin-top: 15px;">
                    <p style="font-size: 11px; color: #888;">
                        <strong>Privacy Notice:</strong><br>
                        We respect your privacy and handle your personal information in accordance with our privacy policy. 
                        Your data is secure and will not be shared with third parties without your consent.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Member approval email template
export const createApprovalEmailContent = (
  memberName: string, 
  memberId: string, 
  pgName: string, 
  pgLocation: string, 
  roomNo?: string, 
  rentAmount?: number, 
  advanceAmount?: number, 
  dateOfJoining?: Date,
  rentType?: 'LONG_TERM' | 'SHORT_TERM',
  pricePerDay?: number,
  dateOfRelieving?: Date,
  otpCode?: string
) => {
  // Format the date of joining
  const formatDate = (date?: Date) => {
    if (!date) return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate total amount for short-term members
  const calculateShortTermTotal = () => {
    if (rentType === 'SHORT_TERM' && pricePerDay && dateOfJoining && dateOfRelieving) {
      const joiningDateObj = new Date(dateOfJoining);
      const endingDateObj = new Date(dateOfRelieving);
      const timeDifference = endingDateObj.getTime() - joiningDateObj.getTime();
      const numberOfDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
      return numberOfDays * pricePerDay;
    }
    return 0;
  };

  const shortTermTotal = calculateShortTermTotal();

  return `
    <h2>🎉 Congratulations! Your Application Has Been Approved</h2>
    
    <p>Dear ${memberName},</p>
    
    <p>We are pleased to inform you that your application for accommodation has been <strong>approved</strong>!</p>
    
    <div class="highlight-box">
        <h3 style="margin-top: 0; color: #28a745;">✅ Application Details:</h3>
        <p><strong>Member ID:</strong> ${memberId}</p>
        <p><strong>PG Name:</strong> ${pgName}</p>
        <p><strong>PG Location:</strong> ${pgLocation}</p>
        <p><strong>Rent Type:</strong> ${rentType === 'SHORT_TERM' ? 'Short Term' : 'Long Term'}</p>
        ${roomNo ? `<p><strong>Room Number:</strong> ${roomNo}</p>` : '<p><strong>Room:</strong> Will be assigned soon</p>'}
        ${rentType === 'LONG_TERM' && roomNo && rentAmount ? `<p><strong>Monthly Rent:</strong> ${formatCurrency(rentAmount)}</p>` : ''}
        ${rentType === 'SHORT_TERM' && pricePerDay ? `<p><strong>Daily Rate:</strong> ${formatCurrency(pricePerDay)}</p>` : ''}
        ${advanceAmount ? `<p><strong>Advance Amount:</strong> ${formatCurrency(advanceAmount)}</p>` : ''}
        <p><strong>Date of Joining:</strong> ${formatDate(dateOfJoining)}</p>
        ${rentType === 'SHORT_TERM' && dateOfRelieving ? `<p><strong>Stay Until:</strong> ${formatDate(dateOfRelieving)}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Approved ✅</span></p>
    </div>
    
    <p>Your journey with us begins now! Please keep your Member ID safe as you'll need it for all future communications and transactions.</p>
    
    <div class="highlight-box" style="background-color: #fff3cd; border-left-color: #ffc107;">
        <h4 style="margin-top: 0; color: #856404;">💰 Payment Information:</h4>
        <ul style="margin-bottom: 0;">
            ${advanceAmount ? `<li><strong>Advance Payment:</strong> ${formatCurrency(advanceAmount)} (to be paid before check-in)</li>` : ''}
            ${rentType === 'LONG_TERM' && roomNo && rentAmount ? `<li><strong>Monthly Rent:</strong> ${formatCurrency(rentAmount)} (due on the same date each month as your joining date)</li>` : ''}
            ${rentType === 'SHORT_TERM' && shortTermTotal > 0 ? `<li><strong>Total Amount for Stay:</strong> ${formatCurrency(shortTermTotal)} (already paid and approved)</li>` : ''}
            <li>Payment details and preferred methods will be shared separately</li>
            <li>Please keep all payment receipts for future reference</li>
        </ul>
    </div>
    
    <div class="highlight-box" style="background-color: #e7f3ff; border-left-color: #007bff;">
        <h4 style="margin-top: 0; color: #004085;">📋 Next Steps:</h4>
        <ul style="margin-bottom: 0;">
            <li><strong>Check-in Date:</strong> ${formatDate(dateOfJoining)}</li>
            ${rentType === 'SHORT_TERM' ? 
              `<li><strong>Check-out Date:</strong> ${dateOfRelieving ? formatDate(dateOfRelieving) : 'To be confirmed'}</li>
               <li>✅ <strong>Payment Status:</strong> Your payment has been processed and approved</li>` : 
              `<li>Complete the advance payment before your joining date</li>
               <li>Monthly rent will be due on the same date each month as your joining date</li>`
            }
            <li>You will receive further instructions about check-in procedures</li>
            <li>Please bring all required documents during check-in</li>
            <li>Contact our support team for any immediate questions</li>
        </ul>
    </div>
    
    <p>Welcome to the ${ENV.COMPANY_NAME} family! We look forward to providing you with a comfortable and safe living experience.</p>
    
    ${rentType === 'LONG_TERM' && otpCode ? `
    <div class="highlight-box" style="background-color: #d4edda; border-left-color: #28a745;">
        <h4 style="margin-top: 0; color: #155724;">🔐 Account Access Information</h4>
        <p style="margin-bottom: 15px;">You can now access your member portal using your email and the temporary OTP below:</p>
        
        <div class="otp-code">
          ${otpCode}
        </div>
        <p style="text-align: center; margin: 10px 0; font-size: 14px; color: #666;">
          Your Initial Setup OTP
        </p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>⚠️ Important Security Instructions:</strong><br>
            • This OTP is valid for <strong>24 hours only</strong><br>
            • Use this OTP as your temporary password for first-time login<br>
            • After logging in, you'll be asked to create a secure password<br>
            • Do not share this OTP with anyone<br>
            • If you don't use this OTP within 24 hours, contact support for a new one
          </p>
        </div>
        
        <div style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0;">
          <p style="margin: 0; color: #004085; font-size: 14px;">
            <strong>📱 How to Access Your Account:</strong><br>
            1. Visit the member login page<br>
            2. Enter your email: <strong>${memberName.toLowerCase().replace(/\s+/g, '')}@email.com</strong> (use your registered email)<br>
            3. Click "Login with OTP" option<br>
            4. Enter the OTP code above<br>
            5. Set up your permanent password
          </p>
        </div>
    </div>
    ` : ''}
    
    <p>Best regards,<br>
    <strong>The ${ENV.COMPANY_NAME} Team</strong></p>
  `;
};

// Member rejection email template
export const createRejectionEmailContent = (memberName: string, pgType: string) => {
  return `
    <h2>Application Update</h2>
    
    <p>Dear ${memberName},</p>
    
    <p>Thank you for your interest in our ${pgType.toLowerCase()} PG accommodation services.</p>
    
    <p>After careful consideration of your application, we regret to inform you that we are unable to offer you accommodation at this time.</p>
    
    <div class="highlight-box" style="background-color: #f8d7da; border-left-color: #dc3545;">
        <h4 style="margin-top: 0; color: #721c24;">📝 Application Status: Not Approved</h4>
        <p style="margin-bottom: 0;">Unfortunately, your application does not meet our current requirements or all available spaces have been filled.</p>
    </div>
    
    <div class="highlight-box">
        <h4 style="margin-top: 0; color: #667eea;">🔄 What's Next?</h4>
        <ul style="margin-bottom: 0;">
            <li>You may reapply in the future when new openings become available</li>
            <li>Consider exploring our other PG locations that might suit your needs</li>
            <li>Contact us if you'd like feedback on your application</li>
            <li>We'll keep your details on file for future opportunities (if desired)</li>
        </ul>
    </div>
    
    <p>We appreciate the time you took to apply and wish you the best in finding suitable accommodation.</p>
    
    <p>If you have any questions about this decision or would like to discuss alternative options, please feel free to contact our support team.</p>
    
    <p>Thank you for considering ${ENV.COMPANY_NAME}.</p>
    
    <p>Best regards,<br>
    <strong>The ${ENV.COMPANY_NAME} Team</strong></p>
  `;
};

// Password reset OTP email template
export const createPasswordResetEmailContent = (userName: string, otpCode: string) => {
  return `
    <h2>🔐 Password Reset Request</h2>
    
    <p>Dear ${userName},</p>
    
    <p>We received a request to reset your password for your ${ENV.COMPANY_NAME} account. If you made this request, please use the OTP code below to reset your password.</p>
    
    <div class="highlight-box" style="background-color: #e7f3ff; border-left-color: #007bff;">
        <h3 style="margin-top: 0; color: #004085;">🔑 Your Password Reset OTP</h3>
        <div class="otp-code">
          ${otpCode}
        </div>
        <p style="text-align: center; margin: 10px 0; font-size: 14px; color: #666;">
          Enter this code to reset your password
        </p>
    </div>
    
    <div class="highlight-box" style="background-color: #fff3cd; border-left-color: #ffc107;">
        <h4 style="margin-top: 0; color: #856404;">⚠️ Important Security Information:</h4>
        <ul style="margin-bottom: 0;">
            <li><strong>Valid for 15 minutes only</strong> - Use this OTP quickly</li>
            <li><strong>One-time use</strong> - This OTP becomes invalid after use</li>
            <li><strong>Keep it confidential</strong> - Never share this OTP with anyone</li>
            <li><strong>Contact support</strong> if you didn't request this reset</li>
        </ul>
    </div>
    
    <div class="highlight-box">
        <h4 style="margin-top: 0; color: #667eea;">📋 How to Reset Your Password:</h4>
        <ol style="margin-bottom: 0;">
            <li>Go to the password reset page</li>
            <li>Enter your email address</li>
            <li>Enter the OTP code: <strong>${otpCode}</strong></li>
            <li>Create a new, strong password</li>
            <li>Confirm your new password</li>
            <li>Login with your new credentials</li>
        </ol>
    </div>
    
    <div class="highlight-box" style="background-color: #f8d7da; border-left-color: #dc3545;">
        <h4 style="margin-top: 0; color: #721c24;">🚨 Didn't Request This?</h4>
        <p style="margin-bottom: 0;">
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged. 
            However, we recommend contacting our support team immediately if you suspect unauthorized access to your account.
        </p>
    </div>
    
    <p>For your security, this OTP will expire in 15 minutes. If you need a new OTP, please make another password reset request.</p>
    
    <p>Best regards,<br>
    <strong>The ${ENV.COMPANY_NAME} Security Team</strong></p>
  `;
};

// Welcome email template for new registrations
export const createWelcomeEmailContent = (userName: string, tempPassword?: string) => {
  return `
    <h2>🎉 Welcome to ${ENV.COMPANY_NAME}!</h2>
    
    <p>Dear ${userName},</p>
    
    <p>Welcome to the ${ENV.COMPANY_NAME} family! We're excited to have you as part of our community.</p>
    
    <div class="highlight-box">
        <h3 style="margin-top: 0; color: #28a745;">✅ Your Registration is Complete</h3>
        <p>Your account has been successfully created and you can now access all our services.</p>
    </div>
    
    ${tempPassword ? `
    <div class="highlight-box" style="background-color: #e7f3ff; border-left-color: #007bff;">
        <h4 style="margin-top: 0; color: #004085;">🔐 Your Account Credentials</h4>
        <p><strong>Email:</strong> Your registered email address</p>
        <p><strong>Temporary Password:</strong></p>
        <div class="otp-code">
          ${tempPassword}
        </div>
        <p style="text-align: center; margin: 10px 0; font-size: 14px; color: #666;">
          Please change this password after your first login
        </p>
    </div>
    
    <div class="highlight-box" style="background-color: #fff3cd; border-left-color: #ffc107;">
        <h4 style="margin-top: 0; color: #856404;">🔒 Security Reminder</h4>
        <ul style="margin-bottom: 0;">
            <li>Change your password immediately after first login</li>
            <li>Choose a strong password with at least 8 characters</li>
            <li>Include uppercase, lowercase, numbers, and special characters</li>
            <li>Never share your login credentials with anyone</li>
        </ul>
    </div>
    ` : ''}
    
    <div class="highlight-box">
        <h4 style="margin-top: 0; color: #667eea;">🚀 What You Can Do Now:</h4>
        <ul style="margin-bottom: 0;">
            <li>Access your member dashboard</li>
            <li>View your accommodation details</li>
            <li>Track your payment history</li>
            <li>Submit service requests</li>
            <li>Update your profile information</li>
            <li>Contact our support team anytime</li>
        </ul>
    </div>
    
    <p>We're committed to providing you with the best possible experience. If you have any questions or need assistance, our support team is always here to help.</p>
    
    <p>Thank you for choosing ${ENV.COMPANY_NAME}. We look forward to serving you!</p>
    
    <p>Best regards,<br>
    <strong>The ${ENV.COMPANY_NAME} Team</strong></p>
  `;
};

// Payment confirmation email template
export const createPaymentConfirmationEmailContent = (
  memberName: string,
  amount: number,
  paymentMethod: string,
  transactionId?: string,
  month?: number,
  year?: number,
  paymentType: string = 'Monthly Rent'
) => {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  
  const getMonthName = (month?: number) => {
    if (!month) return 'N/A';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'N/A';
  };

  return `
    <h2>✅ Payment Confirmation</h2>
    
    <p>Dear ${memberName},</p>
    
    <p>We have successfully received your payment. Thank you for your prompt payment!</p>
    
    <div class="highlight-box" style="background-color: #d4edda; border-left-color: #28a745;">
        <h3 style="margin-top: 0; color: #155724;">💰 Payment Details</h3>
        <p><strong>Amount Paid:</strong> ${formatCurrency(amount)}</p>
        <p><strong>Payment Type:</strong> ${paymentType}</p>
        ${month && year ? `<p><strong>For Period:</strong> ${getMonthName(month)} ${year}</p>` : ''}
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
        <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Confirmed ✅</span></p>
    </div>
    
    <div class="highlight-box">
        <h4 style="margin-top: 0; color: #667eea;">📄 Important Information:</h4>
        <ul style="margin-bottom: 0;">
            <li>Keep this email as your payment receipt</li>
            <li>Your payment has been recorded in our system</li>
            <li>You can view all payment history in your member portal</li>
            <li>Contact us if you notice any discrepancies</li>
        </ul>
    </div>
    
    <div class="highlight-box" style="background-color: #e7f3ff; border-left-color: #007bff;">
        <h4 style="margin-top: 0; color: #004085;">🗓️ Next Payment Reminder</h4>
        <p style="margin-bottom: 0;">
            ${paymentType === 'Monthly Rent' && month && year ? 
              `Your next monthly rent payment will be due on the same date next month (${getMonthName(month === 12 ? 1 : month + 1)} ${month === 12 ? year + 1 : year}).` :
              'We will notify you when your next payment is due.'
            }
        </p>
    </div>
    
    <p>Thank you for being a valued member of ${ENV.COMPANY_NAME}. We appreciate your timely payments!</p>
    
    <p>Best regards,<br>
    <strong>The ${ENV.COMPANY_NAME} Accounts Team</strong></p>
  `;
};