const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const templates = {
  loanApproved: (data) => ({
    subject: 'Loan Request Approved - School Lab System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Loan Approved</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${data.userName}</strong>,</p>
          <p style="font-size: 16px; color: #333;">Your loan request has been <strong style="color: #10b981;">APPROVED</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #333;">Loan Details:</h3>
            <p style="margin: 5px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${data.quantity}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
          </div>
          
          <p style="font-size: 14px; color: #666;">Please return the item on time to avoid penalties.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/loans" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Loan Details</a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>School Lab System © ${new Date().getFullYear()}</p>
        </div>
      </div>
    `,
  }),

  loanRejected: (data) => ({
    subject: 'Loan Request Rejected - School Lab System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">❌ Loan Rejected</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${data.userName}</strong>,</p>
          <p style="font-size: 16px; color: #333;">Unfortunately, your loan request has been <strong style="color: #ef4444;">REJECTED</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="margin-top: 0; color: #333;">Details:</h3>
            <p style="margin: 5px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${data.quantity}</p>
            ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          
          <p style="font-size: 14px; color: #666;">If you have questions, please contact your lab administrator.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/loans" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>School Lab System © ${new Date().getFullYear()}</p>
        </div>
      </div>
    `,
  }),

  loanReminder: (data) => ({
    subject: 'Loan Return Reminder - School Lab System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏰ Return Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${data.userName}</strong>,</p>
          <p style="font-size: 16px; color: #333;">This is a reminder to return your borrowed item.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #333;">Item Details:</h3>
            <p style="margin: 5px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Days Overdue:</strong> ${data.daysOverdue || 0}</p>
          </div>
          
          <p style="font-size: 14px; color: #ef4444;"><strong>Please return the item as soon as possible to avoid penalties.</strong></p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/loans" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Loan</a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>School Lab System © ${new Date().getFullYear()}</p>
        </div>
      </div>
    `,
  }),

  scheduleReminder: (data) => ({
    subject: 'Schedule Reminder - School Lab System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📅 Schedule Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${data.userName}</strong>,</p>
          <p style="font-size: 16px; color: #333;">You have an upcoming lab schedule.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #333;">Schedule Details:</h3>
            <p style="margin: 5px 0;"><strong>Lab:</strong> ${data.labName}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${data.title}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/schedules" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Schedule</a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>School Lab System © ${new Date().getFullYear()}</p>
        </div>
      </div>
    `,
  }),

  welcome: (data) => ({
    subject: 'Welcome to School Lab System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🧪 Welcome!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${data.userName}</strong>,</p>
          <p style="font-size: 16px; color: #333;">Welcome to the School Lab System! Your account has been created successfully.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #333;">Your Account Details:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${data.role}</p>
          </div>
          
          <p style="font-size: 14px; color: #666;">You can now login to the system and start using all available features.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/login" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Now</a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>School Lab System © ${new Date().getFullYear()}</p>
        </div>
      </div>
    `,
  }),
};

// Send email function
exports.sendEmail = async (to, templateName, data) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email not configured. Skipping email send.');
      return { success: false, message: 'Email not configured' };
    }

    const transporter = createTransporter();
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(data);

    const mailOptions = {
      from: `"School Lab System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email
exports.sendNotificationEmail = async (userEmail, notification) => {
  const templateMap = {
    loan: notification.type === 'success' ? 'loanApproved' : 'loanRejected',
    schedule: 'scheduleReminder',
  };

  const templateName = templateMap[notification.category];
  
  if (templateName) {
    return await exports.sendEmail(userEmail, templateName, notification.data || {});
  }

  // Default notification email
  return await exports.sendEmail(userEmail, 'welcome', {
    userName: notification.title,
    message: notification.message,
  });
};

// Verify email configuration
exports.verifyEmailConfig = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { configured: false, message: 'SMTP credentials not set' };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { configured: true, message: 'Email service is ready' };
  } catch (error) {
    return { configured: false, message: error.message };
  }
};
