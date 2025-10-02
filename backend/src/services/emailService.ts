import nodemailer from 'nodemailer';
import { ENV } from '../config/env';
import { 
  createEmailTemplate,
  createApprovalEmailContent,
  createRejectionEmailContent,
  createPasswordResetEmailContent,
  createWelcomeEmailContent,
  createPaymentConfirmationEmailContent
} from '../utils/emailTemplates';

// Email configuration interface
interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  isHTML?: boolean;
}

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: ENV.EMAIL_HOST,
    port: ENV.EMAIL_PORT,
    secure: ENV.EMAIL_SECURE,
    auth: {
      user: ENV.EMAIL_USER,
      pass: ENV.EMAIL_PASS,
    },
  });
};

// Main email sending function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Validate email configuration
    if (!ENV.EMAIL_USER || !ENV.EMAIL_PASS) {
      console.error('Email configuration missing: EMAIL_USER and EMAIL_PASS must be set');
      return false;
    }

    const transporter = createTransporter();

    // Create email content
    const htmlContent = options.isHTML !== false 
      ? createEmailTemplate(options.body, options.subject)
      : undefined;

    const mailOptions = {
      from: `"${ENV.COMPANY_NAME}" <${ENV.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.isHTML !== false ? undefined : options.body,
      html: htmlContent,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Re-export email template functions for convenience
export {
  createApprovalEmailContent,
  createRejectionEmailContent,
  createPasswordResetEmailContent,
  createWelcomeEmailContent,
  createPaymentConfirmationEmailContent
};