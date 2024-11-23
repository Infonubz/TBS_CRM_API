const express = require('express')
const { notificationGet, notificationGetByid, notificationPutStatus, searchNotification, OpnotificationPutStatus, searchOperatorNotification, opEmpnotificationGetById, OpEmpNotificationPutStatus, searchOpEmpNotification, proEmpNotificationGetById, proEmpNotificationPutStatus, searchProEmpNotification } = require('../Controller/notification_controller')

const notrouter = express.Router()

notrouter.get('/notifications', notificationGet)
notrouter.get('/notifications/:tbs_operator_id', notificationGetByid)
notrouter.put('/notifications/:tbs_pro_notif_id', notificationPutStatus)
notrouter.get('/search-notifications/:keyword', searchNotification)

notrouter.put('/op-notifications/:tbs_op_notif_id', OpnotificationPutStatus)
notrouter.get('/search-op-notifications/:keyword', searchOperatorNotification)

notrouter.get('/opEmpnotifications/:tbs_op_emp_id', opEmpnotificationGetById)
notrouter.put('/op-emp-notifications/:tbs_op_emp_notif_id', OpEmpNotificationPutStatus)
notrouter.get('/search-op-emp-notifications/:keyword', searchOpEmpNotification)


notrouter.get('/proEmpNotifications/:tbs_pro_emp_id', proEmpNotificationGetById)
notrouter.put('/pro-emp-notifications/:tbs_pro_emp_notif_id', proEmpNotificationPutStatus)
notrouter.get('/search-pro-emp-notifications/:keyword', searchProEmpNotification)

module.exports = { notrouter }