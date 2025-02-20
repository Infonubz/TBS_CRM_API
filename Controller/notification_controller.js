const pool = require('../config/db');

// Get all product_owner notifications
const notificationGet = async (req, res) => {
    try {
        // Fetch notifications and unread count
        const notificationQuery = `
            SELECT tbs_pro_notif_id, tbs_user_id, user_name, user_type, subject_name, module_name, 
                   notification_message, read, created_at 
            FROM Product_Owner_Notification 
            ORDER BY created_at DESC
        `;

        const unreadCountQuery = `
            SELECT COUNT(*) AS unread_count 
            FROM Product_Owner_Notification 
            WHERE read = false
        `;

        const [notificationResult, unreadCountResult] = await Promise.all([
            pool.query(notificationQuery),
            pool.query(unreadCountQuery)
        ]);

        const notifications = notificationResult.rows;
        const unreadCount = unreadCountResult.rows[0].unread_count;

        // Fetch profile images in a single query
        const userIds = notifications.map(n => n.tbs_user_id);
        const userIdQuery = `
            SELECT 
                tbs_operator_id, 
                profileimg 
            FROM operators_tbl 
            WHERE tbs_operator_id IN (${userIds.map((_, idx) => `$${idx + 1}`).join(', ')})
            UNION
            SELECT 
                tbs_operator_id, 
                profile_img 
            FROM op_emp_personal_details 
            WHERE tbs_operator_id IN (${userIds.map((_, idx) => `$${idx + 1}`).join(', ')})
            UNION
            SELECT 
                owner_id, 
                profile_img 
            FROM pro_emp_personal_details 
            WHERE owner_id IN (${userIds.map((_, idx) => `$${idx + 1}`).join(', ')})
        `;

        const profileImgResults = await pool.query(userIdQuery, userIds);

        const enrichedNotifications = notifications.map(notification => {
            const profileImg = profileImgResults.rows.find(row => row.tbs_user_id === notification.tbs_user_id)?.profile_img || null;
            return {
                ...notification,
                profile_img: profileImg
            };
        });

        res.status(200).json({
            notifications: enrichedNotifications,
            unread_count: unreadCount
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// Get product_owner notification by ID
const notificationGetByid = async (req, res) => {
    const { tbs_operator_id } = req.params;
    try {
        const notificationQuery = `
            SELECT * 
            FROM operator_Notification 
            WHERE tbs_operator_id = $1`;

        const unreadCountQuery = `
            SELECT COUNT(*) AS unread_count 
            FROM operator_Notification 
            WHERE tbs_operator_id = $1 AND read = false `;

        const [notificationResult, unreadCountResult] = await Promise.all([
            pool.query(notificationQuery, [tbs_operator_id]),
            pool.query(unreadCountQuery, [tbs_operator_id])
        ]);

        if (notificationResult.rows.length === 0) {
            return res.status(201).json({ message: 'Notification not found' });
        }

        const unreadCount = unreadCountResult.rows[0].unread_count;

        res.status(200).json({
            notifications: notificationResult.rows,
            unread_count: unreadCount
        });
    } catch (err) {
        console.error(err);
        res.status(201).json({ error: 'Internal Server Error' });
    }
};


// Update product_owner notification status
const notificationPutStatus = async (req, res) => {
    const { tbs_pro_notif_id } = req.params;
    const { read } = req.body;
    try {
        const result = await pool.query('UPDATE Product_Owner_Notification SET read = $1 WHERE tbs_pro_notif_id = $2 RETURNING *', [read, tbs_pro_notif_id]);
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Notification not found' });
        }
        res.status(200).json({message: `User ${tbs_pro_notif_id} notification readed`})
    } catch (err) {
        console.error(err);
        res.status(201).json({ message: 'Internal Server Error' });
    }
}

// search product_owner notifications
const searchNotification = async (req, res) => {
    const keyword = req.params.keyword;

    if (!keyword) {
        return res.status(400).json({ message: 'Keyword is required' });
    }

    try {
        const query = `
            SELECT * 
            FROM public.product_owner_notification
            WHERE notification_message ILIKE '%' || $1 || '%' `;
        const result = await pool.query(query, [keyword]);

        const notifications = result.rows;

        const enrichedNotifications = await Promise.all(
            notifications.map(async (notification) => {
                const { tbs_user_id } = notification;

                let profileImg = null;
                if (tbs_user_id.startsWith('tbs-op')) {
                    const operatorResult = await pool.query(
                        `SELECT profileimg FROM operators_tbl WHERE tbs_operator_id = $1`,
                        [tbs_user_id]
                    );
                    if (operatorResult.rows.length > 0) {
                        profileImg = operatorResult.rows[0].profileimg;
                    }
                } else if (tbs_user_id.startsWith('tbs-op_emp')) {
                    const opEmpResult = await pool.query(
                        `SELECT profile_img FROM op_emp_personal_details WHERE tbs_op_emp_id = $1`,
                        [tbs_user_id]
                    );
                    if (opEmpResult.rows.length > 0) {
                        profileImg = opEmpResult.rows[0].profile_img;
                    }
                } else if (tbs_user_id.startsWith('tbs-pro_emp')) {
                    const proEmpResult = await pool.query(
                        `SELECT profile_img FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
                        [tbs_user_id]
                    );
                    if (proEmpResult.rows.length > 0) {
                        profileImg = proEmpResult.rows[0].profile_img;
                    }
                }

                return {
                    ...notification,
                    profile_img: profileImg
                };
            })
        );

        res.status(200).json(enrichedNotifications);
    } catch (error) {
        console.error('Error executing query:', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update operator notification status
const OpnotificationPutStatus = async (req, res) => {
    const { tbs_op_notif_id } = req.params; 
    const { read } = req.body; 

    try {
        const result = await pool.query(
            'UPDATE operator_notification SET read = $1 WHERE tbs_op_notif_id = $2 RETURNING *',
            [read, tbs_op_notif_id]
        )
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Notification not found' });
        }
        res.status(200).json({ message: `Notification ${tbs_op_notif_id} status updated successfully` });
    } catch (err) {
        console.error(err);
        res.status(201).json({ message: 'Internal Server Error' });
    }
}

// Search operator notifications
const searchOperatorNotification = async (req, res) => {
    const keyword = req.params.keyword;

    if (!keyword) {
        return res.status(200).json({ message: 'Keyword is required' });
    }

    try {
        const query = `
            SELECT * 
            FROM public.operator_notification
            WHERE notification_message ILIKE '%' || $1 || '%'
        `;
        const result = await pool.query(query, [keyword]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(201).json({ message: 'Internal server error' });
    }
}

// Get operator_employee notification by ID
const opEmpnotificationGetById = async (req, res) => {
    const { tbs_op_emp_id } = req.params
    try {
        const notificationQuery = `
            SELECT * 
            FROM op_emp_notification 
            WHERE tbs_op_emp_id = $1
        `;

        const unreadCountQuery = `
            SELECT COUNT(*) AS unread_count 
            FROM op_emp_notification 
            WHERE tbs_op_emp_id = $1 AND read = false
        `;

        const [notificationResult, unreadCountResult] = await Promise.all([
            pool.query(notificationQuery, [tbs_op_emp_id]),
            pool.query(unreadCountQuery, [tbs_op_emp_id])
        ]);

        if (notificationResult.rows.length === 0) {
            return res.status(201).json({ error: 'Notification not found' });
        }

        const unreadCount = unreadCountResult.rows[0].unread_count;

        res.status(200).json({
            notifications: notificationResult.rows,
            unread_count: unreadCount
        });
    } catch (err) {
        console.error(err);
        res.status(201).json({ message: 'Internal Server Error' });
    }
}

// Update operator_employee notification status
const OpEmpNotificationPutStatus = async (req, res) => {
    const { tbs_op_emp_notif_id } = req.params; 
    const { read } = req.body; 

    try {
        const result = await pool.query(
            'UPDATE op_emp_notification SET read = $1 WHERE tbs_op_emp_notif_id = $2 RETURNING *',
            [read, tbs_op_emp_notif_id]
        );
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Notification not found' });
        }
        res.status(200).json({ message: `Notification ${tbs_op_emp_notif_id} status updated successfully` });
    } catch (err) {
        console.error(err);
        res.status(201).json({ message: 'Internal Server Error' });
    }
}

// Search operator_employee notifications
const searchOpEmpNotification = async (req, res) => {
    const keyword = req.params.keyword;

    if (!keyword) {
        return res.status(200).json({ message: 'Keyword is required' });
    }

    try {
        const query = `
            SELECT * 
            FROM op_emp_notification
            WHERE notification_message ILIKE '%' || $1 || '%'
        `;
        const result = await pool.query(query, [keyword]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(201).json({ message: 'Internal server error' });
    }
}

// Get product_owner_employee notification by ID
const proEmpNotificationGetById = async (req, res) => {
    const { tbs_pro_emp_id } = req.params;
    try {
        const notificationQuery = `
            SELECT * 
            FROM pro_emp_notification 
            WHERE tbs_pro_emp_id = $1
        `;

        const unreadCountQuery = `
            SELECT COUNT(*) AS unread_count 
            FROM pro_emp_notification 
            WHERE tbs_pro_emp_id = $1 AND read = false
        `;

        const [notificationResult, unreadCountResult] = await Promise.all([
            pool.query(notificationQuery, [tbs_pro_emp_id]),
            pool.query(unreadCountQuery, [tbs_pro_emp_id])
        ]);

        if (notificationResult.rows.length === 0) {
            return res.status(201).json({ error: 'Notification not found' });
        }

        const unreadCount = unreadCountResult.rows[0].unread_count;

        res.status(200).json({
            notifications: notificationResult.rows,
            unread_count: unreadCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// Update product_owner_employee notification status
const proEmpNotificationPutStatus = async (req, res) => {
    const { tbs_pro_emp_notif_id } = req.params; 
    const { read } = req.body; 

    try {
        const result = await pool.query(
            'UPDATE pro_emp_notification SET read = $1 WHERE tbs_pro_emp_notif_id = $2 RETURNING *',
            [read, tbs_pro_emp_notif_id]
        );
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Notification not found' });
        }
        res.status(200).json({ message: `Notification ${tbs_pro_emp_notif_id} status updated successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// Search product_owner_employee notifications
const searchProEmpNotification = async (req, res) => {
    const keyword = req.params.keyword;

    if (!keyword) {
        return res.status(400).json({ message: 'Keyword is required' });
    }

    try {
        const query = `
            SELECT * 
            FROM pro_emp_notification
            WHERE notification_message ILIKE '%' || $1 || '%'
        `;
        const result = await pool.query(query, [keyword]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = { notificationGet, notificationGetByid, notificationPutStatus, searchNotification, OpnotificationPutStatus, searchOperatorNotification, opEmpnotificationGetById, OpEmpNotificationPutStatus, searchOpEmpNotification, proEmpNotificationGetById, proEmpNotificationPutStatus, searchProEmpNotification };
