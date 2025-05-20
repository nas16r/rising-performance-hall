import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // For development, use Ethereal (fake SMTP service)
  // In production, you would use a real email service
  let transporter;
  
  if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
    // Production email setup
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development email setup (using Ethereal)
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Rising Performance Hall <noreply@risingperformancehall.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };
  
  const info = await transporter.sendMail(mailOptions);
  
  // Log the Ethereal URL in development for testing
  if (process.env.NODE_ENV !== 'production') {
    console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};