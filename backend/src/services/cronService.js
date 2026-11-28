const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { query } = require('../config/database');

let transporter = null;

// Initialize mailer with Ethereal (for testing/demo)
async function initMailer() {
  try {
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✅ Nodemailer initialized with Ethereal Email');
  } catch (err) {
    console.error('Failed to initialize nodemailer:', err);
  }
}

const sendDailyReminders = async () => {
  if (!transporter) return;

  try {
    const usersResult = await query('SELECT id, username, email FROM Users');
    const users = usersResult.rows;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    for (const user of users) {
      if (!user.email) continue;

      const tasksResult = await query(
        `
          SELECT title, priority, due_date, status
          FROM Tasks
          WHERE user_id = $1
            AND status != 'COMPLETED'
            AND due_date::date = CURRENT_DATE
        `,
        [user.id]
      );

      const tasks = tasksResult.rows;

      if (tasks.length > 0) {
        const taskHtmlList = tasks
          .map((t) => {
            let badgeColor = '#64748b';
            if (t.priority === 'URGENT') badgeColor = '#ef4444';
            else if (t.priority === 'HIGH') badgeColor = '#f59e0b';
            else if (t.priority === 'MEDIUM') badgeColor = '#3b82f6';

            return `
            <li style="margin-bottom: 10px; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc;">
              <strong>${t.title}</strong>
              <span style="margin-left: 10px; font-size: 10px; background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${t.priority}</span>
            </li>
          `;
          })
          .join('');

        const displayName = user.username || 'bạn';
        const mailOptions = {
          from: '"TaskFlow AI" <noreply@taskflow.app>',
          to: user.email,
          subject: `☀️ Chào buổi sáng ${displayName}! Bạn có ${tasks.length} công việc hôm nay.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #4f46e5;">Chào ${displayName},</h2>
              <p>Chúc bạn một ngày làm việc hiệu quả! Dưới đây là các công việc cần hoàn thành trong hôm nay:</p>
              <ul style="list-style: none; padding: 0;">
                ${taskHtmlList}
              </ul>
              <p style="margin-top: 30px;">
                <a href="${frontendUrl}" style="background: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">Mở ứng dụng TaskFlow</a>
              </p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
              <p style="font-size: 12px; color: #999;">Bạn nhận được email này vì bạn đã đăng ký nhận thông báo từ TaskFlow.</p>
            </div>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Reminder sent to ${user.email}`);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    }
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
};

const startCron = () => {
  initMailer().then(() => {
    cron.schedule('0 8 * * *', () => {
      console.log('⏰ Running daily reminder cron job...');
      sendDailyReminders();
    });
    console.log('✅ Cron scheduler started (Daily at 8:00 AM)');
  });
};

module.exports = {
  startCron,
  sendDailyReminders,
};
