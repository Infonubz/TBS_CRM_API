const xlsx = require('xlsx');
const fs = require('fs');

const createExcelFile = () => {
    // Sample data with 10 example entries
    const data = [
        { offer_name: 'Summer Special Offer', code: 'SUMMER2024', start_date: 44204, expiry_date: 44264, usage: 100, status: 'active', status_id: 1, offer_desc: 'Enjoy our special summer discounts on all items!', category: 'Food', occupation: 'General' },
        { offer_name: 'Winter Sale', code: 'WINTER2024', start_date: 44365, expiry_date: 44425, usage: 50, status: 'inactive', status_id: 0, offer_desc: 'Get ready for winter with our exclusive discounts!', category: 'Clothing', occupation: 'General' },
        { offer_name: 'Back to School', code: 'SCHOOL2024', start_date: 44275, expiry_date: 44335, usage: 200, status: 'active', status_id: 1, offer_desc: 'Special discounts for students and teachers!', category: 'Education', occupation: 'Student' },
        { offer_name: 'Black Friday Deal', code: 'BLACKFRIDAY', start_date: 44395, expiry_date: 44455, usage: 300, status: 'active', status_id: 1, offer_desc: 'Huge savings on all products!', category: 'Electronics', occupation: 'General' },
        { offer_name: 'Cyber Monday', code: 'CYBERMONDAY', start_date: 44396, expiry_date: 44456, usage: 250, status: 'active', status_id: 1, offer_desc: 'Online exclusive deals!', category: 'Electronics', occupation: 'General' },
        { offer_name: 'Valentine’s Day Special', code: 'VALENTINE2025', start_date: 44420, expiry_date: 44480, usage: 150, status: 'active', status_id: 1, offer_desc: 'Celebrate love with our special offers!', category: 'Gifts', occupation: 'General' },
        { offer_name: 'Easter Sale', code: 'EASTER2025', start_date: 44440, expiry_date: 44500, usage: 120, status: 'active', status_id: 1, offer_desc: 'Easter eggs and more on discount!', category: 'Seasonal', occupation: 'General' },
        { offer_name: 'Summer Clearance', code: 'SUMMERCLEAR', start_date: 44204, expiry_date: 44264, usage: 80, status: 'inactive', status_id: 0, offer_desc: 'Clearance sale for summer items!', category: 'Clothing', occupation: 'General' },
        { offer_name: 'Halloween Special', code: 'HALLOWEEN', start_date: 44335, expiry_date: 44395, usage: 170, status: 'active', status_id: 1, offer_desc: 'Spooky deals on all Halloween items!', category: 'Costumes', occupation: 'General' },
        { offer_name: 'Christmas Sale', code: 'CHRISTMAS', start_date: 44375, expiry_date: 44435, usage: 220, status: 'active', status_id: 1, offer_desc: 'Merry discounts on all Christmas decorations!', category: 'Decorations', occupation: 'General' }
    ];

    // Create a new workbook and add a new sheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Offers');

    // Write the workbook to a file
    xlsx.writeFile(workbook, 'offers.xlsx');

    console.log('Excel file created successfully.');
};

// Run the function to create the Excel file
createExcelFile();
