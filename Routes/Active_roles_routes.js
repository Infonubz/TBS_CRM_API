const express = require('express');
const { postRole, putRole, roleTypeValidation, searchRoles, getRole, getRolebyId, deleteRole, getRoleCount, getRoleMemberCountOpEmp, getRoleMemberCountProEmp, searchOpEmpRoles } = require('../Controller/Active_roles_controller.js');


const rolesRouter = express.Router();

rolesRouter.get('/role', getRole);
rolesRouter.get('/role/:role_id', getRolebyId);
rolesRouter.delete('/role/:role_id', deleteRole);
rolesRouter.post('/role', postRole);
rolesRouter.put('/role/:role_id', putRole);
rolesRouter.post('/role_validation', roleTypeValidation);
rolesRouter.get('/role/search/:searchTerm', searchRoles);
rolesRouter.get('/role/roleCount', getRoleCount);
// rolesRouter.get('/roleMemberCount-opemp', getRoleMemberCountOpEmp);
// rolesRouter.get('/roleMemberCount-proemp', getRoleMemberCountProEmp);
rolesRouter.get('/search/:searchTerm', searchOpEmpRoles);
rolesRouter.get('/roleMemberCount-proemp/:role?', getRoleMemberCountProEmp);
rolesRouter.get('/roleMemberCount-opemp/:role?', getRoleMemberCountOpEmp);

module.exports = { rolesRouter };