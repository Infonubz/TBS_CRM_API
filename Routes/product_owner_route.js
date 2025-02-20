const express = require('express')
const { Prdct_Owner_Login, putProductOwner, getProductOwner, getProductOwnerByID } = require('../Controller/product_owner_controller')

const ownerouter = express.Router()

ownerouter.post('/product_owner_login', Prdct_Owner_Login)
ownerouter.put('/product_owner/:owner_id', putProductOwner)
ownerouter.get('/product_owners', getProductOwner)
ownerouter.get('/product_owner/:owner_id', getProductOwnerByID)

module.exports = { ownerouter }