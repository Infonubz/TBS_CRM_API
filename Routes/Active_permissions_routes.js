const express = require('express');
const { getPermission, getPermissionbyId, putPermission, deletePermission, searchPermissions, roleValidation, fetchUserRoles, getCrudPermissionCounts, postPermission, postCrudPermissions, getCrudpermissionsbyPro } = require('../Controller/Active_permissions_controller');

const permissionRouter = express.Router();

permissionRouter.post("/permissions", postPermission);
permissionRouter.post("/permission/:tbs_user_id/:type",getPermission);
permissionRouter.post("/permissions/:tbs_user_id", getPermissionbyId);
permissionRouter.delete('/permissions/:tbs_user_id/:crud_permission_id?/:permission_id?', deletePermission);
permissionRouter.put("/permissions/:permission_id", putPermission);
permissionRouter.get("/permissions/search/:tbs_user_id/:searchTerm", searchPermissions);
permissionRouter.post('/permissions_validation', roleValidation);
permissionRouter.post('/permissions/userRoles/:tbs_user_id', fetchUserRoles);
permissionRouter.post('/crud-permission-count/:tbs_user_id', getCrudPermissionCounts);
permissionRouter.put('/crud-permissions/:crud_permission_id', postCrudPermissions);
permissionRouter.get('/crud-permissions', getCrudpermissionsbyPro);

module.exports = { permissionRouter };