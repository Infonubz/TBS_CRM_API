const express = require('express');
const { getPermission, getPermissionbyId, putPermission, deletePermission, searchPermissions, roleValidation, fetchUserRoles, getCrudPermissionCount, getCrudPermissionCounts } = require('../Controller/Active_permissions_controller');

const permissionRouter = express.Router();

permissionRouter.get("/permissions",getPermission);
permissionRouter.get("/permissions/:role_id", getPermissionbyId);
permissionRouter.delete("/permissions/:permission_id", deletePermission);
permissionRouter.put("/permissions/:role_id", putPermission);
permissionRouter.get("/permissions/search/:searchTerm", searchPermissions);
permissionRouter.post('/permissions_validation', roleValidation);
permissionRouter.post('/permissions/userRoles', fetchUserRoles);
permissionRouter.get('/crud-permission-count', getCrudPermissionCounts);

module.exports = { permissionRouter };