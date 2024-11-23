const express = require('express');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const { permissionRouter } = require('./Routes/Active_permissions_routes');
const { rolesRouter } = require('./Routes/Active_roles_routes');
const { advertisementRouter } = require('./Routes/Advertisements_routes');
const { importDataRouter } = require('./Routes/ImportData_routes');
const { promotionsRouter } = require('./Routes/Promotions_routes');
const { router } = require('./Routes/company_settings_route')
const { offrouter } = require('./Routes/offers_deals_routes')
const { oprouter } = require('./Routes/operator_route');
const { reqrouter } = require('./Routes/requestManagement_route')
const { userouter } = require('./Routes/userManagement_route')
const { emprouter } = require('./Routes/op_emp_route')
const { patrouter } = require('./Routes/partner_route');
const { opRolesRouter } = require('./Routes/Op_roles_routes');
const { subscriptionsRouter } = require('./Routes/Subscriptions_routes');
const { ownerouter } = require('./Routes/product_owner_route');
const { cltrouter } = require('./Routes/client_route');
const { notrouter } = require('./Routes/notificationRoute');
const { proemprouter } = require('./Routes/pro_emp_route');
const { forgotPasswordRouter } = require('./Routes/Forgot_password_routes');
const { inquiry } = require('./Routes/inquiryRoute');
const { ProEmpforgotPasswordRouter } = require('./Routes/Proemp_ForgotPassword_routes');
const { OpEmpforgotPasswordRouter } = require('./Routes/Opemp_ForgotPassword_routes');
const { PartnerforgotPasswordRouter } = require('./Routes/Partner_ForgotPassword_routes');
const { OpforgotPasswordRouter } = require('./Routes/Op_ForgotPassword_routes');
const { ProforgotPasswordRouter } = require('./Routes/Pro_ForgotPassword_routes');
const { mailrouter } = require('./Routes/bulkmailRoute');
const { MobadvertisementRouter } = require('./Routes/Mobile_advertisements_routes');
const { configRouter } = require('./Routes/emailConfig_routes');
const { countrouter } = require('./Routes/countRoutes');

const app = express();

app.use(express.json());
app.use(cors())

app.use('/advertisement_files', express.static('advertisement_files'));
app.use('/operatorslogin_excels', express.static('operatorslogin_excels'));
app.use('/mobile_advertisement_files', express.static('mobile_advertisement_files'));
app.use('/promotion_files', express.static('promotion_files'));
app.use('/imp_files', express.static('imp_files'));

app.use('/offer_files', express.static('offer_files'))
app.use('/operator_files', express.static('operator_files'))
app.use('/emp_professional_documents', express.static('emp_professional_documents'))
app.use('/pro_employee_documents', express.static('pro_employee_documents'))
app.use('/partner_files', express.static('partner_files'))
app.use('/client_files', express.static('client_files'))
app.use('/uploads', express.static('uploads'))

app.use('/api', permissionRouter);
app.use('/api', rolesRouter);
app.use('/api', advertisementRouter);
app.use('/api', importDataRouter);
app.use('/api', promotionsRouter);
app.use('/api', opRolesRouter);
app.use('/api', subscriptionsRouter);
app.use('/api', forgotPasswordRouter);
app.use('/api', ProEmpforgotPasswordRouter);
app.use('/api', OpEmpforgotPasswordRouter);
app.use('/api', PartnerforgotPasswordRouter);
app.use('/api', OpforgotPasswordRouter);
app.use('/api', ProforgotPasswordRouter);
app.use('/api', MobadvertisementRouter);
app.use('/api', ownerouter)
app.use('/api', offrouter)
app.use('/api', router)
app.use('/api', oprouter)
app.use('/api', emprouter)
app.use('/api', proemprouter)
app.use('/api', patrouter)
app.use('/api', cltrouter)
app.use('/api', reqrouter)
app.use('/api', userouter)
app.use('/api', notrouter)
app.use('/api', inquiry)
app.use('/api', mailrouter)
app.use('/api', configRouter)
app.use('/api', countrouter)


app.listen(process.env.LOCALPORT, () => {
    console.log(`Server is up and running on port ${process.env.LOCALPORT}`)
})

