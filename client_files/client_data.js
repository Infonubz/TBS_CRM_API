const xlsx = require('xlsx');

const data = [
  {
    profile_img: 'img1.png',
    company_name: 'Example Corp',
    owner_name: 'John Doe',
    phone: 1234567890,
    emailid: 'john@example.com',
    type_of_constitution: 'Pvt Ltd',
    business_background: 'Tech Industry',
    web_url: 'www.example.com',
    type_name: 'Type A',
    type_id: 1,
    password: 'pass123',
    status: 'Active',
    status_id: 1,
    address: '123 Main St',
    state: 'State 1',
    state_id: 1,
    region: 'Region 1',
    region_id: 1,
    city: 'City 1',
    city_id: 1,
    country: 'Country1',
    country_id: 1,
    zip_code: 12345,
    has_gstin: true,
    aggregate_turnover_exceeded: true,
    state_name: 'State 1',
    state_code_number: 101,
    gstin: 'GSTIN12345',
    head_office: 'Head Office',
    upload_gst: 'gst_doc1.pdf'
  },
  {
    profile_img: 'img2.png',
    company_name: 'Another Corp',
    owner_name: 'Jane Smith',
    phone: 2345678901,
    emailid: 'jane@another.com',
    type_of_constitution: 'Partnership',
    business_background: 'Finance Industry',
    web_url: 'www.another.com',
    type_name: 'Type B',
    type_id: 2,
    password: 'pass456',
    status: 'Inactive',
    status_id: 2,
    address: '456 Elm St',
    state: 'State 2',
    state_id: 2,
    region: 'Region 2',
    region_id: 2,
    city: 'City 2',
    city_id: 2,
    country: 'Country2',
    country_id: 2,
    zip_code: 67890,
    has_gstin: false,
    aggregate_turnover_exceeded: false,
    state_name: 'State 2',
    state_code_number: 102,
    gstin: 'GSTIN67890',
    head_office: 'Branch',
    upload_gst: 'gst_doc2.pdf'
  }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Clients');

xlsx.writeFile(workbook, 'client_data.xlsx');
