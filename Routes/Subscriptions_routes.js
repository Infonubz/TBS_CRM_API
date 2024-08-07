const express = require('express');
const { getSubscriptions, getSubscriptionbyId, deleteSubscription, postSubscription, putSubscription, searchSubscription, getAllDetails, getAllRecords } = require('../Controller/Subscriptions_controller');

const subscriptionsRouter = express.Router();

subscriptionsRouter.get('/subscription', getSubscriptions);
subscriptionsRouter.get('/subscription/:operator_id', getSubscriptionbyId);
subscriptionsRouter.delete('/subscription/:operator_id', deleteSubscription);
subscriptionsRouter.post('/subscription', postSubscription);
subscriptionsRouter.put('/subscription/:operator_id', putSubscription);
subscriptionsRouter.get('/subscription/search/:searchTerm', searchSubscription);
subscriptionsRouter.get('/all-sub-operators', getAllRecords)

module.exports = { subscriptionsRouter };