const nodemailer = require('nodemailer');
const pool = require('../config/db');
require('dotenv').config();

const BulkMail = async (req, res) => {
    const { user_name, tbs_user_id, to_email, subject, body } = req.body;
  
    try {
        const toEmailString = Array.isArray(to_email) ? to_email.join(', ') : to_email;

        const insertQuery = `
            INSERT INTO public.bulk_mail (user_name, tbs_user_id, to_email, subject)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [user_name, tbs_user_id, toEmailString, subject];
        const result = await pool.query(insertQuery, values);

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmailString, 
            subject: subject,
            html: `
                <html>
                    <body>
                        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                                <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
                                    <tr>
                                        <td style="text-align: center; padding: 20px;">
                                            ${body}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </body>
                </html>
            `, 
        }
  
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Failed to send email', details: error });
            }
            console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Email sent' });
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
}

module.exports = { BulkMail };
