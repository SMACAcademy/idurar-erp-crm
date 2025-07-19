const fs = require('fs');
const custom = require('@/controllers/pdfController');
const { SendOffer } = require('@/emailTemplate/SendEmailTemplate');
const mongoose = require('mongoose');
const OfferModel = mongoose.model('Offer');
const nodemailer = require('nodemailer');
const { loadSettings } = require('@/middlewares/settings');
const { useAppSettings } = require('@/settings');

const mail = async (req, res) => {
  const { id } = req.body;

  // Throw error if no id
  if (!id) {
    throw { name: 'ValidationError' };
  }

  const result = await OfferModel.findOne({
    _id: id,
    removed: false,
  }).exec();

  // Throw error if no result
  if (!result) {
    throw { name: 'ValidationError' };
  }

  // Continue process if result is returned
  const { lead } = result;
  const { name } = lead;
  const email = lead[lead.type].email;

  if (!email) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Lead has no email, add new email and try again',
    });
  }

  const modelName = 'Offer';

  const fileId = modelName.toLowerCase() + '-' + result._id + '.pdf';
  const folderPath = modelName.toLowerCase();
  const targetLocation = `src/public/download/${folderPath}/${fileId}`;

  await custom.generatePdf(
    modelName,
    { filename: folderPath, format: 'A4', targetLocation },
    result,
    async () => {
      try {
        const { messageId } = await sendMail({
          email,
          name,
          targetLocation,
        });

        await OfferModel.findByIdAndUpdate({ _id: id, removed: false }, { status: 'sent' }).exec();

        return res.status(200).json({
          success: true,
          result: messageId,
          message: `Successfully sent offer to ${email}`,
        });
      } catch (error) {
        console.error('Error sending email:', error);
        throw error;
      }
    }
  );
};

const sendMail = async ({ email, name, targetLocation }) => {
  // Create a Nodemailer transporter
  let transporter = nodemailer.createTransport({
    service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    auth: {
      user: 'harshy050902@gmail.com', // email
      pass: process.env.NodeMailer_API, // password
    },
  });

  const settings = await loadSettings();
  const erp_app_email = 'harshy050902@gmail.com';
  const erp_app_company_email = settings['erp_app_company_email'];
  const company_name = settings['company_name'];

  // Read the file to be attached
  const attachment = {
    filename: 'Offer.pdf',
    content: fs.createReadStream(targetLocation),
  };

  // Define mail options
  let mailOptions = {
    from: erp_app_email,
    to: email,
    subject: 'Offer From ' + company_name,
    replyTo: erp_app_company_email,
    attachments: [attachment],
    html: SendOffer({ name, title: 'Offer From ' + company_name }),
  };

  // Send mail with defined transport object
  let info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);

  return info;
};

module.exports = mail;
