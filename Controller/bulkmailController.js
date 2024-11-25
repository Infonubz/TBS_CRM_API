const nodemailer = require('nodemailer')
const pool = require('../config/db')
require('dotenv').config()

const BulkMail = async (req, res) => {
    const { user_name, tbs_user_id, to_email, subject, body } = req.body

    try {
        // Fetch the `from_email` from `config_email_information`
        const configQuery = `
            SELECT bulk_mail->>'email' as from_email 
            FROM config_email_information
            LIMIT 1
        `
        const configResult = await pool.query(configQuery)

        if (configResult.rows.length === 0) {
            return res.status(500).json({ error: 'Failed to retrieve email configuration' })
        }

        const fromEmail = configResult.rows[0].from_email
        const toEmailString = Array.isArray(to_email) ? to_email.join(', ') : to_email

        // Insert record into `bulk_mail`
        const insertQuery = `
            INSERT INTO public.bulk_mail (user_name, tbs_user_id, to_email, subject)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `
        const values = [user_name, tbs_user_id, toEmailString, subject]
        await pool.query(insertQuery, values)

        // Create and configure the transporter
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: fromEmail,
                pass: process.env.EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: fromEmail,
            to: toEmailString,
            subject: subject,
            html: `
                <html>
                    <body>
                        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); padding:10px">
                                ${body}
                            </div>
                        </div>
                    </body>
                </html>
            ` 
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

const getFromEmail = async(req, res) => {
    try {
        const configQuery = `
            SELECT bulk_mail->>'email' as from_email 
            FROM config_email_information
            LIMIT 1
        `;
        const configResult = await pool.query(configQuery);

        if (configResult.rows.length === 0) {
            return res.status(500).json({ error: 'Failed to retrieve email configuration' });
        }

        res.status(200).json({ from_email: configResult.rows[0].from_email });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', details: error.message });
    }
}

module.exports = { BulkMail, getFromEmail };
