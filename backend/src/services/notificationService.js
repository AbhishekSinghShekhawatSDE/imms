const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * IMMS Notification Service
 * Sends Email and SMS alerts
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

async function sendAlertNotification(alert, machine) {
    console.log(`--- [IMMS Notification] Routing Alert: ${alert.id} (${alert.severity}) ---`);

    // 1. Always log to console for demo visibility
    console.log(`[ALERT] ${alert.severity.toUpperCase()} | Machine: ${machine.name} | Metric: ${alert.metric} | Message: ${alert.message}`);

    // 2. Email for Warning & Critical
    if (process.env.SMTP_USER) {
        try {
            await transporter.sendMail({
                from: process.env.ALERT_EMAIL_FROM,
                to: process.env.SMTP_USER, // Send to self/admin for demo
                subject: `[IMMS ${alert.severity.toUpperCase()}] Alert for ${machine.name}`,
                text: `
          IMMS INDUSTRIAL MONITORING ALERT
          =================================
          Machine: ${machine.name} (${machine.location})
          Severity: ${alert.severity}
          Metric: ${alert.metric}
          Value: ${alert.value}
          Threshold: ${alert.threshold}
          Message: ${alert.message}
          Time: ${alert.created_at || new Date()}
        `,
            });
            console.log(`✅ Email sent for alert ${alert.id}`);
        } catch (err) {
            console.warn(`⚠️ Failed to send email: ${err.message}`);
        }
    }

    // 3. SMS for Critical Only
    if (alert.severity === 'critical' && twilioClient && process.env.TWILIO_FROM_NUMBER) {
        try {
            await twilioClient.messages.create({
                body: `IMMS CRITICAL: ${machine.name} - ${alert.message} (Value: ${alert.value})`,
                from: process.env.TWILIO_FROM_NUMBER,
                to: process.env.TWILIO_TO_NUMBER || process.env.TWILIO_FROM_NUMBER, // Fallback
            });
            console.log(`✅ SMS sent for alert ${alert.id}`);
        } catch (err) {
            console.warn(`⚠️ Failed to send SMS: ${err.message}`);
        }
    }
}

module.exports = { sendAlertNotification };
