const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const Invoice = mongoose.model('Invoice');
const { generatePdf } = require('@/controllers/pdfController');
const { loadSettings } = require('@/middlewares/settings');

/**
 * POST /api/invoice/mail   (PUBLIC, no auth)
 * Body: { invoiceId: string, email: string, subject?: string }
 *
 * Validations:
 * - invoiceId must be a valid ObjectId and reference an existing invoice (removed: false)
 * - email must be valid and MUST match the invoice's client.email (case-insensitive)
 *
 * If valid:
 * - Generate Invoice PDF using src/pdf/Invoice.pug
 * - Send email via Resend with the PDF attached
 */
module.exports = async function sendInvoiceMail(req, res) {
  try {
    const { email, invoiceId: bodyInvoiceId, id: idParam, subject } = req.body || {};
    const invoiceId = (bodyInvoiceId || idParam || '').trim();
    const emailInput = (email || '').trim();

    // 1) Basic presence checks
    if (!invoiceId || !emailInput) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'email and invoiceId are required in request body',
        code: 'VALIDATION_REQUIRED_FIELDS',
      });
    }

    // 2) Validate invoiceId format
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid invoiceId format',
        code: 'INVALID_INVOICE_ID',
      });
    }

    // 3) Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // 4) Ensure mail service is configured
    if (!process.env.RESEND_API) {
      return res.status(501).json({
        success: false,
        result: null,
        message: 'Mail service not configured. Set RESEND_API in environment.',
        code: 'MAILER_NOT_CONFIGURED',
      });
    }

    // 5) Load app/company settings (used for sender and PDF helpers)
    const settings = await loadSettings();
    const fromEmail = settings?.idurar_app_email || 'no-reply@idurarapp.com';

    // 6) Fetch invoice with client details
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      removed: false,
    })
      .populate('client')
      .exec();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND',
      });
    }

    // 7) Ensure client present and has email
    const clientEmail = (invoice?.client?.email || '').trim();
    if (!clientEmail) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Client email is not available for this invoice',
        code: 'CLIENT_EMAIL_MISSING',
      });
    }

    // 8) Compare provided email with client's email (case-insensitive)
    if (clientEmail.toLowerCase() !== emailInput.toLowerCase()) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Provided email does not match the invoice client email',
        code: 'EMAIL_MISMATCH',
        details: { provided: emailInput, expected: clientEmail },
      });
    }

    // 9) Prepare PDF target path
    const filename = `invoice-${invoice._id}.pdf`;
    const targetLocation = path.resolve('src', 'public', 'pdf', 'invoice', filename);

    // 10) Generate the PDF using the existing Pug template and money/date formatters
    // Important: use "Invoice" (capitalized) to match file src/pdf/Invoice.pug
    await new Promise((resolve, reject) => {
      try {
        generatePdf(
          'Invoice',
          { filename, format: 'A4', targetLocation },
          invoice,
          (err) => (err ? reject(err) : resolve())
        );
      } catch (e) {
        reject(e);
      }
    });

    // 11) Read the generated PDF
    const pdfBuffer = fs.readFileSync(targetLocation);

    // 12) Send email with attachment
    const resend = new Resend(process.env.RESEND_API);
    const mailSubject =
      (subject && String(subject).trim()) || `Invoice #${invoice.number}/${invoice.year}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px 0; color: #4B0082;">Invoice</h2>
        <p>Hello${invoice?.client?.name ? ' ' + invoice.client.name : ''},</p>
        <p>Please find attached your invoice <strong>#${invoice.number}/${invoice.year}</strong>.</p>
        <ul style="padding-left:16px;">
          <li>Date: ${new Date(invoice.date).toLocaleDateString()}</li>
          <li>Expired Date: ${new Date(invoice.expiredDate).toLocaleDateString()}</li>
          <li>Total: ${invoice.total}</li>
          <li>Client Email (verified): ${clientEmail}</li>
        </ul>
        <p>Regards,<br/>${settings?.company_name || 'Your Company'}</p>
      </div>
    `;

    const { data } = await resend.emails.send({
      from: fromEmail,
      to: emailInput,
      subject: mailSubject,
      html: htmlBody,
      attachments: [
        {
          filename,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    return res.status(200).json({
      success: true,
      result: {
        id: data?.id,
        to: emailInput,
        filename,
        invoiceId: String(invoice._id),
        clientId: String(invoice?.client?._id || ''),
      },
      message: 'Invoice sent successfully',
    });
  } catch (error) {
    console.error('sendInvoiceMail error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Failed to send invoice email',
      error,
      code: 'SEND_INVOICE_MAIL_FAILED',
    });
  }
};
