const pool = require('../config/db')
const cron = require('node-cron')

//RESTORE FOR OFFERS & DEALS
const restoreOffer = async (req, res) => {
    const client = await pool.connect();
    try {
        const { tbs_recycle_id } = req.params;

        const recycleQuery = 'SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1';
        const recycleResult = await client.query(recycleQuery, [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(404).json({ message: `Recycle bin entry with ID ${tbs_recycle_id} not found` });
        }

        const deletedData = recycleResult.rows[0].deleted_data;

        const restoreQuery = `
            INSERT INTO discount_offers (
                tbs_offer_id, tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, 
                offer_desc, offer_img, created_date, updated_date, image_size, image_type, image_file, theme, 
                occupation, req_status, req_status_id, occupation_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            )
        `;

        await client.query(restoreQuery, [
            deletedData.tbs_offer_id,
            deletedData.tbs_user_id, deletedData.offer_name, deletedData.code, deletedData.start_date, 
            deletedData.expiry_date, deletedData.usage, deletedData.status, deletedData.status_id, 
            deletedData.offer_desc, deletedData.offer_img, deletedData.created_date, deletedData.updated_date, 
            deletedData.image_size, deletedData.image_type, deletedData.image_file, deletedData.theme, 
            deletedData.occupation, deletedData.req_status, deletedData.req_status_id, deletedData.occupation_id
        ]);

        const deleteRecycleQuery = 'DELETE FROM recycle_bin WHERE tbs_recycle_id = $1';
        await client.query(deleteRecycleQuery, [tbs_recycle_id]);

        res.status(200).json({ message: `Offer restored successfully with ID: ${deletedData.tbs_offer_id}` });
    } catch (error) {
        console.error('Error restoring offer:', error);
        res.status(500).json({ error: 'Error restoring offer' });
    } finally {
        client.release();
    }
}

//PERMANENT DELETE FOR OFFERS & DEALS
const permanentlyDeleteOffer = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const deleteQuery = 'DELETE FROM recycle_bin WHERE tbs_recycle_id = $1';
        const result = await client.query(deleteQuery, [tbs_recycle_id]);

        if (result.rowCount === 1) {
            res.status(200).json({message: `Recycle bin entry with ID ${tbs_recycle_id} permanently deleted`});
        } else {
            res.status(201).json({message: `Recycle bin entry with ID ${tbs_recycle_id} not found`});
        }
    } catch (error) {
        console.error('Error permanently deleting offer:', error);
        res.status(500).json('Error permanently deleting offer');
    } finally {
        client.release();
    }
}

//RESTORE FOR PROMOTIONS 
const restorePromo = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleQuery = 'SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1';
        const recycleResult = await client.query(recycleQuery, [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;

        const restoreQuery = `INSERT INTO promotions_tbl (promo_id, promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, promo_image, created_date, background_image, tbs_user_id, updated_date, promo_img_details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING promo_id`;
        
        const restoredPromo = await client.query(restoreQuery, [ deletedData.promo_id, 
            deletedData.promo_name,
            deletedData.operator_details,
            deletedData.start_date,
            deletedData.expiry_date,
            deletedData.usage,
            deletedData.promo_status_id,
            deletedData.promo_status,
            deletedData.user_id,
            deletedData.user_status,
            deletedData.promo_description,
            deletedData.promo_image,
            deletedData.created_date,
            deletedData.background_image,
            deletedData.tbs_user_id,
            deletedData.updated_date,
            deletedData.promo_img_details
        ]);

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Promotion restored successfully with new ID: ${restoredPromo.rows[0].promo_id}`);
    } catch (error) {
        console.error('Error restoring promotion:', error);
        res.status(500).send('Error restoring promotion');
    } finally {
        client.release();
    }
}

//PERMENANT DELETE FOR PROMOTIONS
const permanentlyDeletePromo = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const deleteQuery = 'DELETE FROM recycle_bin WHERE tbs_recycle_id = $1';
        const result = await client.query(deleteQuery, [tbs_recycle_id]);

        if (result.rowCount === 1) {
            res.status(200).send(`Recycle bin entry with ID ${tbs_recycle_id} permanently deleted`);
        } else {
            res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }
    } catch (error) {
        console.error('Error permanently deleting promotion:', error);
        res.status(500).send('Error permanently deleting promotion');
    } finally {
        client.release();
    }
}

//RESTORE FOR WEB ADVERTISMENTS
const restoreAd = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleResult = await client.query('SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;

        const restoredAd = await client.query(
            `INSERT INTO advertisements_tbl (tbs_ad_id, client_details, ad_title, start_date, end_date, ad_description, usage_per_day, status, ad_video, ad_file_size, ad_file_type, created_date, status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, duration, ads_plan_id, req_status, req_status_id, updated_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) 
             RETURNING tbs_ad_id`, [ deletedData.tbs_ad_id, 
                deletedData.client_details, deletedData.ad_title, deletedData.start_date, deletedData.end_date,
                deletedData.ad_description, deletedData.usage_per_day, deletedData.status, deletedData.ad_video, deletedData.ad_file_size,
                deletedData.ad_file_type, deletedData.created_date, deletedData.status_id, deletedData.tbs_client_id, deletedData.page_id,
                deletedData.page_name, deletedData.tbs_user_id, deletedData.hours, deletedData.duration, deletedData.ads_plan_id,
                deletedData.req_status, deletedData.req_status_id, deletedData.updated_date])

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send({message: `Advertisement restored successfully with ID: ${restoredAd.rows[0].tbs_ad_id}`});
    } catch (error) {
        console.error('Error restoring advertisement:', error);
        res.status(500).send('Error restoring advertisement');
    } finally {
        client.release();
    }
}

//PERMENANT DELETE FOR ADVERTISEMENTS
const permanentDeleteAd = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const deleteResult = await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (deleteResult.rowCount === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`)
        }

        res.status(200).send(`Advertisement permanently deleted from recycle bin with ID: ${tbs_recycle_id}`)
    } catch (error) {
        console.error('Error permanently deleting advertisement:', error);
        res.status(500).send('Error permanently deleting advertisement');
    } finally {
        client.release();
    }
}

//RESTORE FOR MOBILE ADVERTISEMENT 
const restoreMobAd = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleResult = await client.query('SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;

        const restoredAd = await client.query(
            `INSERT INTO mobile_advertisements_tbl (tbs_mobad_id, client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, mobad_vdo, mobad_file_size, mobad_file_type, created_date, status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, duration, ads_plan_id, req_status, req_status_id, updated_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING tbs_mobad_id`,
            [ deletedData.tbs_mobad_id, 
                deletedData.client_details, deletedData.ad_title, deletedData.start_date, deletedData.end_date,
                deletedData.ad_description, deletedData.usage_per_day, deletedData.status, deletedData.ad_video, deletedData.ad_file_size,
                deletedData.ad_file_type, deletedData.created_date, deletedData.status_id, deletedData.tbs_client_id, deletedData.page_id,
                deletedData.page_name, deletedData.tbs_user_id, deletedData.hours, deletedData.duration, deletedData.ads_plan_id,
                deletedData.req_status, deletedData.req_status_id, deletedData.updated_date
            ]
        );

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Mobile advertisement restored successfully with ID: ${deletedData.tbs_mobad_id}`);
    } catch (error) {
        console.error('Error restoring mobile advertisement:', error);
        res.status(500).send('Error restoring mobile advertisement');
    } finally {
        client.release();
    }
}

//PERMENANAT DELETE FOR MOBILE ADVERISEMENTS
const permanentDeleteMobAd = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const deleteResult = await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (deleteResult.rowCount === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        res.status(200).send(`Mobile advertisement permanently deleted from recycle bin with ID: ${tbs_recycle_id}`)
    } catch (error) {
        console.error('Error permanently deleting mobile advertisement:', error);
        res.status(500).send('Error permanently deleting mobile advertisement');
    } finally {
        client.release();
    }
}

//RESTORE OPERATOR DETAILS 
const restoreOperator = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleResult = await client.query('SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;
        const operator = deletedData.operator;
        const operatorDetails = deletedData.operatorDetails;

        await client.query(
            `INSERT INTO operators_tbl (tbs_operator_id, company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid, aadharcard_number, pancard_number, user_status, req_status, user_status_id, req_status_id, type_name, type_id, password, profileimg, generate_key) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
                operator.tbs_operator_id, operator.company_name, operator.owner_name, operator.phone, operator.alternate_phone, operator.emailid, operator.alternate_emailid, operator.aadharcard_number,
                operator.pancard_number, operator.user_status, operator.req_status, operator.user_status_id, operator.req_status_id, operator.type_name, operator.type_id,
                operator.password, operator.profileimg, operator.generate_key
            ]
        );

        await client.query(
            `UPDATE operator_details SET 
                type_of_constitution = $1, business_background = $2, msme_type = $3, msme_number = $4, type_of_service = $5, currency_code = $6, address = $7, state = $8, 
                region = $9, city = $10, country = $11, zip_code = $12, has_gstin = $13, aggregate_turnover_exceeded = $14, state_name = $15, state_code_number = $16, 
                gstin = $17, head_office = $18, upload_gst = $19, aadar_front_doc = $20, aadar_back_doc = $21, pancard_front_doc = $22, pancard_back_doc = $23, msme_doc = $24, 
                state_id = $25, country_id = $26, city_id = $27, aadar_front_file = $28, aadar_back_file = $29, pancard_front_file = $30, pancard_back_file = $31, msme_doc_file = $32
             WHERE tbs_operator_id = $33`,
            [
                operatorDetails.type_of_constitution, operatorDetails.business_background, operatorDetails.msme_type, operatorDetails.msme_number, operatorDetails.type_of_service,
                operatorDetails.currency_code, operatorDetails.address, operatorDetails.state, operatorDetails.region, operatorDetails.city, operatorDetails.country, operatorDetails.zip_code,
                operatorDetails.has_gstin, operatorDetails.aggregate_turnover_exceeded, operatorDetails.state_name, operatorDetails.state_code_number, operatorDetails.gstin,
                operatorDetails.head_office, operatorDetails.upload_gst, operatorDetails.aadar_front_doc, operatorDetails.aadar_back_doc, operatorDetails.pancard_front_doc,
                operatorDetails.pancard_back_doc, operatorDetails.msme_doc, operatorDetails.state_id, operatorDetails.country_id, operatorDetails.city_id,
                operatorDetails.aadar_front_file, operatorDetails.aadar_back_file, operatorDetails.pancard_front_file, operatorDetails.pancard_back_file, operatorDetails.msme_doc_file,
                operator.tbs_operator_id
            ]
        );

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Operator restored successfully with ID: ${operator.tbs_operator_id}`);
    } catch (error) {
        console.error('Error restoring operator:', error);
        res.status(500).send('Error restoring operator');
    } finally {
        client.release();
    }
}

//PERMENANT DELETE API FOR OPERATORS
const permanentDeleteOperator = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const deleteResult = await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (deleteResult.rowCount === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        res.status(200).send(`Operator permanently deleted from recycle bin with ID: ${tbs_recycle_id}`);
    } catch (error) {
        console.error('Error permanently deleting operator:', error);
        res.status(500).send('Error permanently deleting operator');
    } finally {
        client.release();
    }
}

//RESTORE API FOR OPERATOR EMPLOYEE
const restoreOPEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleResult = await client.query('SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;
        const empPersonal = deletedData.empPersonal;
        const empProfessional = deletedData.empProfessional;

        const personalInsertResult = await client.query(
            `INSERT INTO op_emp_personal_details (tbs_op_emp_id, emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, temp_add, temp_country, 
                temp_state, temp_city, temp_zip_code, perm_add, perm_country, perm_state, perm_city, perm_zip_code, type_name, type_id, password, emp_status, emp_status_id, 
                profile_img, role_type, role_type_id, tbs_operator_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) 
             RETURNING tbs_op_emp_id`,
            [ empPersonal.tbs_op_emp_id, 
                empPersonal.emp_first_name, empPersonal.emp_last_name, empPersonal.phone, empPersonal.email_id, empPersonal.alternate_phone, empPersonal.date_of_birth, 
                empPersonal.gender, empPersonal.blood_group, empPersonal.temp_add, empPersonal.temp_country, empPersonal.temp_state, empPersonal.temp_city, 
                empPersonal.temp_zip_code, empPersonal.perm_add, empPersonal.perm_country, empPersonal.perm_state, empPersonal.perm_city, empPersonal.perm_zip_code, 
                empPersonal.type_name, empPersonal.type_id, empPersonal.password, empPersonal.emp_status, empPersonal.emp_status_id, empPersonal.profile_img, 
                empPersonal.role_type, empPersonal.role_type_id, empPersonal.tbs_operator_id
            ]
        );

        const newTbsOpEmpId = personalInsertResult.rows[0].tbs_op_emp_id; 

        await client.query(
            `UPDATE op_emp_professional_details 
             SET joining_date = $1, designation = $2, branch = $3, official_email_id = $4, years_of_experience = $5, department = $6, reporting_manager = $7, 
                 aadhar_card_number = $8, aadhar_card_doc = $9, pan_card_number = $10, pan_card_doc = $11, work_experience_certificate = $12, 
                 educational_certificate = $13, other_documents = $14, role_type = $15, aadhar_card_file = $16, pancard_file = $17, 
                 work_experience_file = $18, education_certificate_file = $19, other_certificate_file = $20 
             WHERE tbs_op_emp_id = $21`,
            [
                empProfessional.joining_date, empProfessional.designation, empProfessional.branch, empProfessional.official_email_id, empProfessional.years_of_experience, 
                empProfessional.department, empProfessional.reporting_manager, empProfessional.aadhar_card_number, empProfessional.aadhar_card_doc, empProfessional.pan_card_number, 
                empProfessional.pan_card_doc, empProfessional.work_experience_certificate, empProfessional.educational_certificate, empProfessional.other_documents, 
                empProfessional.role_type, empProfessional.aadhar_card_file, empProfessional.pancard_file, empProfessional.work_experience_file, empProfessional.education_certificate_file, 
                empProfessional.other_certificate_file, newTbsOpEmpId 
            ]
        )

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Employee restored successfully with ID: ${newTbsOpEmpId}`);
    } catch (error) {
        console.error('Error restoring employee:', error);
        res.status(500).send('Error restoring employee');
    } finally {
        client.release();
    }
}

//PERMENANT DELETE API FOR OPERATOR EMPLOYEE
const permanentDeleteOPEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const deleteResult = await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (deleteResult.rowCount === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        res.status(200).send(`Employee permanently deleted from recycle bin with ID: ${tbs_recycle_id}`);
    } catch (error) {
        console.error('Error permanently deleting employee:', error);
        res.status(500).send('Error permanently deleting employee');
    } finally {
        client.release();
    }
}

//RESTORE API FOR PRODUCT OWNER EMPLOYEES
const restoreProEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleResult = await client.query('SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;
        const empPersonal = deletedData.empPersonal;
        const empProfessional = deletedData.empProfessional;

        await client.query(
            `INSERT INTO pro_emp_personal_details (tbs_pro_emp_id, emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, temp_add, temp_country, 
                temp_state, temp_city, temp_zip_code, perm_add, perm_country, perm_state, perm_city, perm_zip_code, type_name, type_id, password, emp_status, emp_status_id, 
                profile_img, tbs_pro_emp_id, role_type, role_type_id, owner_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)`,
            [  empPersonal.tbs_pro_emp_id, 
                empPersonal.emp_first_name, empPersonal.emp_last_name, empPersonal.phone, empPersonal.email_id, empPersonal.alternate_phone, empPersonal.date_of_birth,
                empPersonal.gender, empPersonal.blood_group, empPersonal.temp_add, empPersonal.temp_country, empPersonal.temp_state, empPersonal.temp_city,
                empPersonal.temp_zip_code, empPersonal.perm_add, empPersonal.perm_country, empPersonal.perm_state, empPersonal.perm_city, empPersonal.perm_zip_code,
                empPersonal.type_name, empPersonal.type_id, empPersonal.password, empPersonal.emp_status, empPersonal.emp_status_id, empPersonal.profile_img,
                empPersonal.tbs_pro_emp_id, empPersonal.role_type, empPersonal.role_type_id, empPersonal.owner_id
            ]
        );

        await client.query(
            `UPDATE pro_emp_professional_details SET joining_date = $1, designation = $2, branch = $3, official_email_id = $4, years_of_experience = $5, 
                department = $6, reporting_manager = $7, aadhar_card_number = $8, aadhar_card_doc = $9, pan_card_number = $10, pan_card_doc = $11, 
                work_experience_certificate = $12, educational_certificate = $13, other_documents = $14, role_type = $15, 
                aadhar_card_file = $16, pancard_file = $17, work_experience_file = $18, education_certificate_file = $19, other_certificate_file = $20 
             WHERE tbs_pro_emp_id = $21`,
            [
                empProfessional.joining_date, empProfessional.designation, empProfessional.branch, empProfessional.official_email_id, empProfessional.years_of_experience,
                empProfessional.department, empProfessional.reporting_manager, empProfessional.aadhar_card_number, empProfessional.aadhar_card_doc,
                empProfessional.pan_card_number, empProfessional.pan_card_doc, empProfessional.work_experience_certificate, empProfessional.educational_certificate,
                empProfessional.other_documents, empProfessional.role_type, empProfessional.aadhar_card_file, empProfessional.pancard_file,
                empProfessional.work_experience_file, empProfessional.education_certificate_file, empProfessional.other_certificate_file,
                empProfessional.tbs_pro_emp_id
            ]
        );

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Employee restored successfully with ID: ${empPersonal.tbs_pro_emp_id}`);
    } catch (error) {
        console.error('Error restoring employee:', error);
        res.status(500).send('Error restoring employee');
    } finally {
        client.release();
    }
}

//PERMENANT DELETE API FOR PRODUCT OWNER EMPLOYEES
const permanentDeleteProEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Employee permanently deleted from recycle bin with ID: ${tbs_recycle_id}`);
    } catch (error) {
        console.error('Error permanently deleting employee:', error);
        res.status(500).send('Error permanently deleting employee');
    } finally {
        client.release();
    }
}

//RESTORE API FOR PARTNER
const restorePartner = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleResult = await client.query('SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;
        const partnerDetails = deletedData.partnerDetails;
        const partnerDocuments = deletedData.partnerDocuments; 

        const insertPartnerResult = await client.query(
            `INSERT INTO partner_details (tbs_partner_id, partner_first_name, partner_last_name, phone, emailid, alternate_phone, date_of_birth, gender, joining_date, 
                type_name, type_id, temp_add, temp_country, temp_state, temp_city, temp_zip_code, perm_add, perm_country, 
                perm_state, perm_city, perm_zip_code, password, profile_img, partner_status, partner_status_id, req_status, req_status_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
             RETURNING tbs_partner_id`,
            [   partnerDetails.tbs_partner_id, 
                partnerDetails.partner_first_name, partnerDetails.partner_last_name, partnerDetails.phone, partnerDetails.emailid, partnerDetails.alternate_phone,
                partnerDetails.date_of_birth, partnerDetails.gender, partnerDetails.joining_date, partnerDetails.type_name, partnerDetails.type_id,
                partnerDetails.temp_add, partnerDetails.temp_country, partnerDetails.temp_state, partnerDetails.temp_city, partnerDetails.temp_zip_code,
                partnerDetails.perm_add, partnerDetails.perm_country, partnerDetails.perm_state, partnerDetails.perm_city, partnerDetails.perm_zip_code,
                partnerDetails.password, partnerDetails.profile_img, partnerDetails.partner_status, partnerDetails.partner_status_id,
                partnerDetails.req_status, partnerDetails.req_status_id
            ]
        );

        const newPartnerId = insertPartnerResult.rows[0].tbs_partner_id;

        await client.query(
            `UPDATE partner_documents SET 
                aadhar_card_number = $1, 
                aadhar_card_front = $2, 
                pan_card_number = $3, 
                pan_card_front = $4, 
                aadhar_card_back = $5, 
                pan_card_back = $6, 
                updated_date = $7,
                aadhar_front_file = $8, 
                pancard_front_file = $9, 
                aadhar_back_file = $10, 
                pancard_back_file = $11 
             WHERE tbs_partner_id = $12`,
            [
                partnerDocuments.aadhar_card_number, partnerDocuments.aadhar_card_front, partnerDocuments.pan_card_number, partnerDocuments.pan_card_front,
                partnerDocuments.aadhar_card_back, partnerDocuments.pan_card_back, new Date(), 
                partnerDocuments.aadhar_front_file, partnerDocuments.pancard_front_file, partnerDocuments.aadhar_back_file, partnerDocuments.pancard_back_file,
                newPartnerId 
            ]
        );

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Partner restored successfully with ID: ${newPartnerId}`);
    } catch (error) {
        console.error('Error restoring partner:', error);
        res.status(500).send('Error restoring partner');
    } finally {
        client.release();
    }
}

//PERMENANT DELETE API FOR PARTNER
const permanentDeletePartner = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Partner permanently deleted from recycle bin with ID: ${tbs_recycle_id}`);
    } catch (error) {
        console.error('Error permanently deleting partner:', error);
        res.status(500).send('Error permanently deleting partner');
    } finally {
        client.release();
    }
}

//RESTORE API FOR CLIENTS
const restoreClient = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        const recycleResult = await client.query('SELECT deleted_data FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        if (recycleResult.rows.length === 0) {
            return res.status(201).send(`Recycle bin entry with ID ${tbs_recycle_id} not found`);
        }

        const deletedData = recycleResult.rows[0].deleted_data;
        const clientCompanyDetails = deletedData.clientCompanyDetails;
        const clientAddressDetails = deletedData.clientAddressDetails;
        const clientGstDetails = deletedData.clientGstDetails;
        
        await client.query(
            `INSERT INTO client_company_details (tbs_client_id, company_logo, company_name, owner_name, phone, emailid, type_of_constitution, 
                business_background, web_url, type_name, type_id, password, status, status_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
                clientCompanyDetails.tbs_client_id, clientCompanyDetails.company_logo, clientCompanyDetails.company_name, clientCompanyDetails.owner_name,
                clientCompanyDetails.phone, clientCompanyDetails.emailid, clientCompanyDetails.type_of_constitution, clientCompanyDetails.business_background,
                clientCompanyDetails.web_url, clientCompanyDetails.type_name, clientCompanyDetails.type_id, clientCompanyDetails.password,
                clientCompanyDetails.status, clientCompanyDetails.status_id
            ]
        );

        await client.query(
            `UPDATE client_address_details SET 
                address = COALESCE($1, address), 
                state = COALESCE($2, state), 
                state_id = COALESCE($3, state_id), 
                region = COALESCE($4, region), 
                region_id = COALESCE($5, region_id), 
                city = COALESCE($6, city), 
                city_id = COALESCE($7, city_id), 
                country = COALESCE($8, country), 
                country_id = COALESCE($9, country_id), 
                zip_code = COALESCE($10, zip_code) 
             WHERE tbs_client_id = $11`,
            [
                clientAddressDetails[0]?.address || null, clientAddressDetails[0]?.state || null, clientAddressDetails[0]?.state_id || null,
                clientAddressDetails[0]?.region || null, clientAddressDetails[0]?.region_id || null, clientAddressDetails[0]?.city || null,
                clientAddressDetails[0]?.city_id || null, clientAddressDetails[0]?.country || null, clientAddressDetails[0]?.country_id || null,
                clientAddressDetails[0]?.zip_code || null, clientCompanyDetails.tbs_client_id
            ]
        );
        
        await client.query(
            `UPDATE client_gst_details SET 
                has_gstin = COALESCE($1, has_gstin), 
                aggregate_turnover_exceeded = COALESCE($2, aggregate_turnover_exceeded), 
                state_name = COALESCE($3, state_name), 
                state_code_number = COALESCE($4, state_code_number), 
                gstin = COALESCE($5, gstin), 
                head_office = COALESCE($6, head_office), 
                upload_gst = COALESCE($7, upload_gst) 
             WHERE tbs_client_id = $8`,
            [
                clientGstDetails[0]?.has_gstin || null, clientGstDetails[0]?.aggregate_turnover_exceeded || null, clientGstDetails[0]?.state_name || null,
                clientGstDetails[0]?.state_code_number || null, clientGstDetails[0]?.gstin || null, clientGstDetails[0]?.head_office || null,
                clientGstDetails[0]?.upload_gst || null, clientCompanyDetails.tbs_client_id
            ]
        )        

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Client restored successfully with ID: ${clientCompanyDetails.tbs_client_id}`);
    } catch (error) {
        console.error('Error restoring client:', error);
        res.status(500).send('Error restoring client');
    } finally {
        client.release();
    }
};


//PERMENANT DELETE API FOR CLIENTS
const permanentDeleteClient = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_recycle_id = req.params.tbs_recycle_id;

        await client.query('DELETE FROM recycle_bin WHERE tbs_recycle_id = $1', [tbs_recycle_id]);

        res.status(200).send(`Recycle bin entry deleted permanently with ID: ${tbs_recycle_id}`);
    } catch (error) {
        console.error('Error permanently deleting client from recycle bin:', error);
        res.status(500).send('Error permanently deleting client from recycle bin');
    } finally {
        client.release();
    }
}

//GET API FOR RECYCLE BIN
const getRecycleBinEntries = async (req, res) => {
    const moduleGetId = req.params.module_get_id;

    try {
        let query;
        let params = [];

        if (moduleGetId == 10) {
            query = `
                SELECT *
                FROM recycle_bin;`;
        } 
        else if (moduleGetId == 3 || moduleGetId == 4) {
            query = `
                SELECT rb.*, ccd.emailid, ccd.phone
                FROM recycle_bin rb
                LEFT JOIN client_company_details ccd
                ON (rb.deleted_data->>'tbs_client_id') = ccd.tbs_client_id
                WHERE rb.module_get_id = $1;`;
            params = [moduleGetId];
        } 
        else {
            query = `
                SELECT *
                FROM recycle_bin
                WHERE module_get_id = $1;`;
            params = [moduleGetId];
        }

        const result = await pool.query(query, params);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteExpiredEntries = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            DELETE FROM recycle_bin
            WHERE expiry_date < NOW()
        `);
    } catch (error) {
        console.error('Error deleting expired entries:', error);
    } finally {
        client.release();
    }
}

// Schedule the job to run every minute
cron.schedule('*/1 * * * *', deleteExpiredEntries);

//SEARCH API FOR RECYCLE BIN
const SearchRecycleBinEntries = async (req, res) => {
    const moduleGetId = req.params.module_get_id;
    const { searchTerm } = req.body;

    try {
        let query;
        let params = [];

        if (moduleGetId == 10) {
            query = `
                SELECT *
                FROM recycle_bin
                WHERE deleted_data::text ILIKE $1;`;
            params = [`%${searchTerm}%`];
        } 
        else if (moduleGetId == 3 || moduleGetId == 4) {
            query = `
                SELECT rb.*, ccd.emailid, ccd.phone
                FROM recycle_bin rb
                LEFT JOIN client_company_details ccd
                ON (rb.deleted_data->>'tbs_client_id') = ccd.tbs_client_id
                WHERE rb.module_get_id = $1
                AND rb.deleted_data::text ILIKE $2;`;
            params = [moduleGetId, `%${searchTerm}%`];
        } 
        else {
            query = `
                SELECT *
                FROM recycle_bin
                WHERE module_get_id = $1
                AND deleted_data::text ILIKE $2;`;
            params = [moduleGetId, `%${searchTerm}%`];
        }

        const result = await pool.query(query, params);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { restoreOffer, permanentlyDeleteOffer, restorePromo, permanentlyDeletePromo, restoreAd, permanentDeleteAd, restoreMobAd, permanentDeleteMobAd, restoreOperator, permanentDeleteOperator, restoreOPEmployee, permanentDeleteOPEmployee, restoreProEmployee, permanentDeleteProEmployee, restorePartner, permanentDeletePartner, restoreClient, permanentDeleteClient, getRecycleBinEntries, SearchRecycleBinEntries }