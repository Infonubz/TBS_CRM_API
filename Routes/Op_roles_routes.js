const express = require('express');
const { getOpRoles, getOpRolesById, postOpRoles, putOpRoles, deleteOpRoles, getOpIdName } = require('../Controller/Op_roles_controller');

const opRolesRouter = express.Router();

opRolesRouter.get("/opRoles", getOpRoles);
opRolesRouter.get("/opRolesName", getOpIdName);
opRolesRouter.get("/opRoles/:op_id", getOpRolesById);
opRolesRouter.post("/opRoles", postOpRoles);
opRolesRouter.put("/opRoles/:op_id", putOpRoles);
opRolesRouter.delete("/opRoles/:op_id", deleteOpRoles);
//opRolesRouter.get("/opRoles/search/:searchTerm", searchopRoles);


module.exports = { opRolesRouter };