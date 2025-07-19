const { afterRegistrationSuccess } = require('@/emailTemplate/emailVerfication');

const nodemailer = require('nodemailer');

const nodemailer = require('nodemailer');

const senderpOffer = async ({ email, name }) => {
  // Create a Nodemailer transporter
  let transporter = nodemailer.createTransport({
    service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    auth: {
      user: process.env.NodeMailer_MAIL, // email
      pass: process.env.NodeMailer_API, // password
    },
  });

  // Define mail options
  let mailOptions = {
    from: process.env.NodeMailer_MAIL,
    to: email,
    subject: 'Customize erp ERP CRM or build your own SaaS',
    html: afterRegistrationSuccess({ name }),
  };

  // Send mail with defined transport object
  let info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);

  return info.messageId;
};

module.exports = senderpOffer;
