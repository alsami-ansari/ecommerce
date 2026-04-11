import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    // 1. Create a "Transporter" (The postman who delivers the email)
    // NOTE: In production, you will put your real Gmail or Sendgrid credentials in your .env file!
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to Mailgun, Sendgrid, etc.
      auth: {
        user: process.env.EMAIL_USER || 'your_fake_email@gmail.com', 
        pass: process.env.EMAIL_PASS || 'your_fake_password',
      },
    });

    // 2. Define the email details
    const mailOptions = {
      from: 'Ecommerce Admin <admin@ecommerce.com>',
      to: options.email,
      subject: options.subject,
      html: options.message, // We send beautiful HTML instead of plain text!
    };

    // 3. Send it!
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${options.email}`);
    
  } catch (error) {
    // We catch the error so it doesn't crash our entire server if an email fails to send
    console.error('Email failed to send. Check your .env credentials:', error.message);
  }
};

export default sendEmail;
