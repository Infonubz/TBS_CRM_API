const xlsx = require('xlsx');

// Define the data with the required modifications
const data = [
  {
    company_name: 'ABC Enterprises',
    owner_name: 'Rajesh Nair',
    phone: 9876543210,
    alternate_phone: 9876543211,
    emailid: 'rajesh@abc.com',
    alternate_emailid: 'rajesh.nair@abc.com',
    aadharcard_number: '123456789101',
    pancard_number: 'ABCD1234',
    created_date: '2024-07-25',
    user_status: 'active',  // Updated status
    req_status: 'approved', // Updated status
    user_status_id: 1,      // Corresponding ID
    req_status_id: 1,       // Corresponding ID
    type_of_constitution: 'Constitution A',
    business_background: 'Background A',
    msme_type: 'MSME',
    msme_number: 'MSME1234',
    type_of_service: 'Service A',
    currency_code: 'INR',
    address: '1234, MG Road, Kochi',
    state: 'Kerala',
    region: 'South',
    city: 'Kochi',
    country: 'India',
    zip_code: 682001,
    has_gstin: true,
    aggregate_turnover_exceeded: false,
    state_name: 'Kerala',
    state_code_number: 'KL01',
    gstin: '12ABCDE3456F1Z1',
    head_office: 'Yes',
    state_id: 1,
    country_id: 101,
    city_id: 201
  },
  {
    company_name: 'XYZ Ltd.',
    owner_name: 'Sreelatha R',
    phone: 9876543212,
    alternate_phone: 9876543213,
    emailid: 'sreelatha@xyz.com',
    alternate_emailid: 'sreelatha.r@xyz.com',
    aadharcard_number: '234567890123',
    pancard_number: 'XYZD1234',
    created_date: '2024-07-26',
    user_status: 'inactive',  // Updated status
    req_status: 'pending',    // Updated status
    user_status_id: 2,       // Corresponding ID
    req_status_id: 0,        // Corresponding ID
    type_of_constitution: 'Constitution B',
    business_background: 'Background B',
    msme_type: 'MSME',
    msme_number: 'MSME5678',
    type_of_service: 'Service B',
    currency_code: 'USD',
    address: '5678, SRM Road, Thiruvananthapuram',
    state: 'Kerala',
    region: 'Central',
    city: 'Thiruvananthapuram',
    country: 'India',
    zip_code: 695001,
    has_gstin: false,
    aggregate_turnover_exceeded: true,
    state_name: 'Kerala',
    state_code_number: 'KL02',
    gstin: '23BCDE4567G2Y2',
    head_office: 'No',
    state_id: 2,
    country_id: 102,
    city_id: 202
  },
  {
    company_name: 'Kerala Traders',
    owner_name: 'Anil Kumar',
    phone: 9876543214,
    alternate_phone: 9876543215,
    emailid: 'anil@keralatraders.com',
    alternate_emailid: 'anil.kumar@keralatraders.com',
    aadharcard_number: '345678901234',
    pancard_number: 'KERD1234',
    created_date: '2024-07-27',
    user_status: 'active',  // Updated status
    req_status: 'verified', // Updated status
    user_status_id: 1,      // Corresponding ID
    req_status_id: 1,       // Corresponding ID
    type_of_constitution: 'Constitution C',
    business_background: 'Background C',
    msme_type: 'MSME',
    msme_number: 'MSME9101',
    type_of_service: 'Service C',
    currency_code: 'EUR',
    address: '9101, Beach Road, Kozhikode',
    state: 'Kerala',
    region: 'North',
    city: 'Kozhikode',
    country: 'India',
    zip_code: 673001,
    has_gstin: true,
    aggregate_turnover_exceeded: true,
    state_name: 'Kerala',
    state_code_number: 'KL03',
    gstin: '34CDEF5678H3Z3',
    head_office: 'Yes',
    state_id: 3,
    country_id: 103,
    city_id: 203
  },
  {
    company_name: 'Green Solutions',
    owner_name: 'Meera Menon',
    phone: 9876543216,
    alternate_phone: 9876543217,
    emailid: 'meera@greensol.com',
    alternate_emailid: 'meera.menon@greensol.com',
    aadharcard_number: '456789012345',
    pancard_number: 'GREEN1234',
    created_date: '2024-07-28',
    user_status: 'active',  // Updated status
    req_status: 'under review', // Updated status
    user_status_id: 1,       // Corresponding ID
    req_status_id: 2,        // Corresponding ID
    type_of_constitution: 'Constitution D',
    business_background: 'Background D',
    msme_type: 'MSME',
    msme_number: 'MSME1122',
    type_of_service: 'Service D',
    currency_code: 'GBP',
    address: '1122, Park Avenue, Alappuzha',
    state: 'Kerala',
    region: 'South',
    city: 'Alappuzha',
    country: 'India',
    zip_code: 688001,
    has_gstin: true,
    aggregate_turnover_exceeded: false,
    state_name: 'Kerala',
    state_code_number: 'KL04',
    gstin: '45DEFG6789J4Y4',
    head_office: 'Yes',
    state_id: 4,
    country_id: 104,
    city_id: 204
  }
];

// Create worksheet from processed JSON data
const worksheet = xlsx.utils.json_to_sheet(data);

const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'OperatorData');

// Write the workbook to a file
xlsx.writeFile(workbook, 'operator_data.xlsx');
