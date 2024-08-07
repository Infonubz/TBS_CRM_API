const express = require('express')
const { notificationGet, notificationGetByid, notificationPutStatus } = require('../Controller/notification_controller')

const notrouter = express.Router()

notrouter.get('/notifications', notificationGet)
notrouter.get('/notifications/:tbs_user_id', notificationGetByid)
notrouter.put('/notifications/:tbs_pro_notif_id', notificationPutStatus)

module.exports = { notrouter }