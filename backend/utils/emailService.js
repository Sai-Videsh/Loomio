const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: String(process.env.EMAIL_PORT) === '465',
    auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    } : undefined
  });
};

// Email templates
const emailTemplates = {
  taskAssigned: (userName, taskTitle, taskDescription, deadline) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Task Assigned</h2>
        <p>Hello ${userName},</p>
        <p>You have been assigned a new task:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${taskTitle}</h3>
          <p>${taskDescription}</p>
          ${deadline ? `<p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>` : ''}
        </div>
        <p>Please log in to your Loomio dashboard to view the full details and update your progress.</p>
        <p>Best regards,<br>The Loomio Team</p>
      </div>
    `
  }),

  leaveApproved: (userName, startDate, endDate) => ({
    subject: 'Leave Request Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Leave Request Approved</h2>
        <p>Hello ${userName},</p>
        <p>Your leave request has been approved:</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p><strong>To:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        </div>
        <p>Enjoy your time off!</p>
        <p>Best regards,<br>The Loomio Team</p>
      </div>
    `
  }),

  leaveRejected: (userName, startDate, endDate, reason) => ({
    subject: 'Leave Request Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Leave Request Update</h2>
        <p>Hello ${userName},</p>
        <p>Your leave request could not be approved:</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p><strong>To:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        <p>Please contact your team leader for more information.</p>
        <p>Best regards,<br>The Loomio Team</p>
      </div>
    `
  }),

  deadlineReminder: (userName, taskTitle, deadline) => ({
    subject: `Deadline Reminder: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Deadline Reminder</h2>
        <p>Hello ${userName},</p>
        <p>This is a friendly reminder about your upcoming deadline:</p>
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${taskTitle}</h3>
          <p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>
        </div>
        <p>Please ensure you complete this task on time.</p>
        <p>Best regards,<br>The Loomio Team</p>
      </div>
    `
  }),

  eventReminder: (userName, eventTitle, eventDate, location) => ({
    subject: `Event Reminder: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Event Reminder</h2>
        <p>Hello ${userName},</p>
        <p>This is a reminder about an upcoming event:</p>
        <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${eventTitle}</h3>
          <p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
        </div>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>The Loomio Team</p>
      </div>
    `
  }),

  pointsAwarded: (userName, points, reason) => ({
    subject: 'Points Awarded!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Congratulations!</h2>
        <p>Hello ${userName},</p>
        <p>You have been awarded points for your contribution:</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #059669;">+${points} Points</h3>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Keep up the great work!</p>
        <p>Best regards,<br>The Loomio Team</p>
      </div>
    `
  }),

  welcomeEmail: (userName) => ({
    subject: 'Welcome to Loomio!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Loomio!</h2>
        <p>Hello ${userName},</p>
        <p>Welcome to Loomio - your community task management platform!</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>View and manage your assigned tasks</li>
          <li>Track your attendance and request leaves</li>
          <li>Earn points for your contributions</li>
          <li>Participate in community events</li>
          <li>View your performance dashboard</li>
        </ul>
        <p>Get started by logging into your dashboard!</p>
        <p>Best regards,<br>The Loomio Team</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    
    if (!emailTemplates[template]) {
      throw new Error(`Email template '${template}' not found`);
    }

    const emailContent = emailTemplates[template](...Object.values(data));
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}: ${template}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send multiple emails
const sendBulkEmail = async (recipients, template, data = {}) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient.email, template, { ...data, userName: recipient.name });
    results.push({ recipient, result });
  }
  
  return results;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  testEmailConfig,
  emailTemplates
};
