const { emailVerfication, passwordVerfication } = require('@/emailTemplate/emailVerfication');

const nodemailer = require('nodemailer');

const sendMail = async ({
  email,
  name,
  link,
  erp_app_email,
  subject = 'Verify your email | erp',
  type = 'emailVerification',
  emailToken,
}) => {
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
    from: erp_app_email,
    to: email,
    subject: subject,
    html:
      type === 'emailVerfication'
        ? emailVerfication({ name, link, emailToken })
        : passwordVerfication({ name, link }),
  };

  // Send mail with defined transport object
  let info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);

  return info.messageId;
};

module.exports = sendMail;
