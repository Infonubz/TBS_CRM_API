const express = require('express');
const { getSubscriptions, getSubscriptionbyId, deleteSubscription, postSubscription, putSubscription, searchSubscription, getAllDetails, getAllRecords, filterByStartDate } = require('../Controller/Subscriptions_controller');

const subscriptionsRouter = express.Router();

subscriptionsRouter.get('/subscription', getSubscriptions);
subscriptionsRouter.get('/subscription/:tbs_operator_id', getSubscriptionbyId);
subscriptionsRouter.delete('/subscription/:tbs_operator_id', deleteSubscription);
subscriptionsRouter.post('/subscription', postSubscription);
subscriptionsRouter.put('/subscription/:tbs_operator_id', putSubscription);
subscriptionsRouter.get('/subscription/search/:searchTerm', searchSubscription);
subscriptionsRouter.post('/subscription-filter-by-date', filterByStartDate);
subscriptionsRouter.get('/all-sub-operators', getAllRecords)

module.exports = { subscriptionsRouter };