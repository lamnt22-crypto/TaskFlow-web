const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { sql, poolPromise } = require('../config/database');

let transporter = null;

// Initialize mailer with Ethereal (for testing/demo)
async function initMailer() {
  try {
    let testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('✅ Nodemailer initialized with Ethereal Email');
  } catch (err) {
    console.error('Failed to initialize nodemailer:', err);
  }
}

// Format date to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN');
};

const sendDailyReminders = async () => {
  if (!transporter) return;
  
  try {
    const pool = await poolPromise;
    // Get all users
    const usersResult = await pool.request().query('SELECT id, name, email FROM Users');
    const users = usersResult.recordset;

    for (const user of users) {
      if (!user.email) continue;
      
      // Get today's tasks for user
      const tasksResult = await pool.request()
        .input('userId', sql.Int, user.id)
        .query(`
          SELECT title, priority, due_date, status 
          FROM Tasks 
          WHERE user_id = @userId 
            AND status != 'COMPLETED'
            AND CAST(due_date AS DATE) = CAST(GETDATE() AS DATE)
        `);
      
      const tasks = tasksResult.recordset;

      if (tasks.length > 0) {
        let taskHtmlList = tasks.map(t => {
          let badgeColor = '#64748b'; // default slate
          if (t.priority === 'URGENT') badgeColor = '#ef4444';
          else if (t.priority === 'HIGH') badgeColor = '#f59e0b';
          else if (t.priority === 'MEDIUM') badgeColor = '#3b82f6';

          return `
            <li style="margin-bottom: 10px; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc;">
              <strong>${t.title}</strong>
              <span style="margin-left: 10px; font-size: 10px; background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${t.priority}</span>
            </li>
          `;
        }).join('');

        const mailOptions = {
          from: '"TaskFlow AI" <noreply@taskflow.app>',
          to: user.email,
          subject: `☀️ Chào buổi sáng ${user.name}! Bạn có ${tasks.length} công việc hôm nay.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #4f46e5;">Chào ${user.name},</h2>
              <p>Chúc bạn một ngày làm việc hiệu quả! Dưới đây là các công việc cần hoàn thành trong hôm nay:</p>
              <ul style="list-style: none; padding: 0;">
                ${taskHtmlList}
              </ul>
              <p style="margin-top: 30px;">
                <a href="http://localhost:5173" style="background: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">Mở ứng dụng TaskFlow</a>
              </p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
              <p style="font-size: 12px; color: #999;">Bạn nhận được email này vì bạn đã đăng ký nhận thông báo từ TaskFlow.</p>
            </div>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Reminder sent to ${user.email}`);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
    }
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
};

const startCron = () => {
  initMailer().then(() => {
    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', () => {
      console.log('⏰ Running daily reminder cron job...');
      sendDailyReminders();
    });
    console.log('✅ Cron scheduler started (Daily at 8:00 AM)');
  });
};

module.exports = {
  startCron,
  sendDailyReminders // Expose for testing manually
};
