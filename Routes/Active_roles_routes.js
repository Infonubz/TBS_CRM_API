const express = require('express');
const { postRole, putRole, roleTypeValidation, getRoleMemberCountOpEmpSearch, getRoles, getRolebyId, deleteRole, getRoleMemberCountOpEmp, getRoleMemberCountProEmp, searchRoleMemberCountProEmp, getCrudPermissions } = require('../Controller/Active_roles_controller.js');


const rolesRouter = express.Router();

rolesRouter.get('/roles/:type', getRoles);
rolesRouter.get('/role/:role_id', getRolebyId);
rolesRouter.delete('/role/:role_id', deleteRole);
rolesRouter.post('/role', postRole);
rolesRouter.put('/role/:role_id', putRole);
rolesRouter.post('/role_validation', roleTypeValidation);
rolesRouter.get('/search-op-emp-roles/:tbs_user_id/:searchTerm', getRoleMemberCountOpEmpSearch);
rolesRouter.post('/search-pro-emp-roles/:searchTerm', searchRoleMemberCountProEmp);
rolesRouter.post('/roleMemberCount-proemp/:role?', getRoleMemberCountProEmp);
rolesRouter.get('/roleMemberCount-opemp/:tbs_user_id/:role?', getRoleMemberCountOpEmp);
rolesRouter.get('/crud-permissions/:role_id', getCrudPermissions)

module.exports = { rolesRouter };