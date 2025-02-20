const pool = require('../config/db');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Inquiry = async (req, res) => {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Fetch email addresses from config_email_information
        const configQuery = `
            SELECT 
                support->>'email' as support_email,
                no_reply->>'email' as no_reply_email
            FROM config_email_information
            LIMIT 1
        `;
        const configResult = await pool.query(configQuery);

        if (configResult.rows.length === 0) {
            return res.status(500).json({ error: 'Failed to retrieve email configuration' });
        }

        const { support_email, no_reply_email } = configResult.rows[0];

        // Create and configure the transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            auth: {
                user: no_reply_email,
                pass: process.env.INQUIRY_PASS, 
            },
        });

        const mailOptions = {
            from: no_reply_email,
            to: no_reply_email,
            subject: 'New Inquiry from ' + name,
            html: `
                <html>
                    <body>
                        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                                <div style="background-color: #003366; padding: 20px; color: #ffffff; text-align: center;">
                                    <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px;">TheBusStand</h1>
                                </div>
                                <div style="padding: 20px; background-color: #f9f9f9;">
                                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 20px; text-transform: capitalize; font-size: 22px;">New Inquiry from ${name}</h2>
                                    <div style="margin-bottom: 20px;">
                                        <p style="margin: 0 0 10px;"><strong>Name:</strong> ${name}</p>
                                        <p style="margin: 0 0 10px;"><strong>Phone:</strong> ${phone}</p>
                                        <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
                                        <p style="margin: 0 0 10px;"><strong>Message:</strong></p>
                                        <div style="border: 1px dashed #1F487C; padding: 15px; border-radius: 5px;">${message}</div>
                                    </div>
                                </div>
                                <div style="background-color: #003366; padding: 15px; text-align: center; color: #ffffff; border-top: 1px solid #e0e0e0;">
                                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} TheBusStand. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
            `,
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error:', error);
                res.status(500).send('There was an error sending your inquiry. Please try again later.');
            } else {
                res.send('Thank you for your inquiry! We will get back to you soon.');
            }
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('There was an error processing your inquiry. Please try again later.');
    }
};

module.exports = { Inquiry };
