const pool = require('../config/db')

const getFaqByid = async (req, res) => {
    const  id  = req.params.tbs_faq_id;

    try {
        const result = await pool.query('SELECT * FROM FAQ_tbl WHERE tbs_faq_id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'FAQ not found' });
        }
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

//GET ALL FAQS LIKE DB STRUCTURE
const getAllFaq = async (req, res) => {

    try {
        const result = await pool.query('SELECT * FROM FAQ_tbl',);
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({ message: 'FAQ not found' });
        }
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

//GET FAQS
const getCategory = (categoryNum) => {
  switch (categoryNum) {
      case 1:
          return 'general';
      case 2:
          return 'ticket_related';
      case 3:
          return 'payment';
      case 4:
          return 'cancelation_refund';
      case 5:
          return 'insurance';
      default:
          return null;
  }
};
const getFaq = async (req, res) => {
  const categoryNum = parseInt(req.params.category, 10);
  const category = getCategory(categoryNum);

  if (!category) {
      return res.status(400).json({ message: 'Invalid category number' });
  }

  try {
      const { rows: faqs } = await pool.query('SELECT * FROM faq_tbl');

      const result = faqs
          .filter(faq => faq[category] && faq[category].length > 0)
          .flatMap(faq => 
              faq[category].map(item => ({
                  tbs_faq_id: faq.tbs_faq_id,
                  ...item 
              }))
          );
      const response = {
          [category]: result
      };

      res.json(response);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
}

// POST API OF FAQS
const createfaqs = async (req, res) => {
    const { general, ticket_related, payment, cancellation_refund, insurance } = req.body;
  
    try {
      const result = await pool.query(
        'INSERT INTO public.faq_tbl (general, ticket_related, payment, cancellation_refund, insurance) VALUES ($1, $2, $3, $4, $5) RETURNING tbs_faqs_id',
        [JSON.stringify(general), JSON.stringify(ticket_related), JSON.stringify(payment), JSON.stringify(cancellation_refund), JSON.stringify(insurance)]
      );
      res.status(201).json({ message: 'successfully created faqs' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  //PUT API FOR FAQS
  const updateFqs = async (req, res) => {
    const  id  = req.params.tbs_faqs_id;
    const { general, ticket_related, payment, cancellation_refund, insurance } = req.body;
  
    try {
      const result = await pool.query(
        'UPDATE public.faq_tbl SET general = $1, ticket_related = $2, payment = $3, cancellation_refund = $4, insurance = $5 WHERE tbs_faqs_id = $6',
        [JSON.stringify(general), JSON.stringify(ticket_related), JSON.stringify(payment), JSON.stringify(cancellation_refund), JSON.stringify(insurance), id]
      );
  
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'FAQ not found' });
      } else {
        res.status(200).json({ message: 'FAQ updated successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

//DELETE API FOR FAQS
const deleteApi = async (req, res) => {
    const questionId = req.params.question_id;
  
    const columnMapping = {
      g: 'general',
      p: 'payment',
      t: 'ticket_related',
      c: 'cancellation_refund',
      i: 'insurance'
    };
  
    const column = columnMapping[questionId.charAt(0)];
  
    if (!column) {
      return res.status(400).json({ error: 'Invalid question_id format' });
    }
  
    try {
      
      const fetchQuery = `
        SELECT ${column} 
        FROM public.faq_tbl
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements(${column}) elem
          WHERE elem->>'question_id' = $1
        )
      `;
      const fetchResult = await pool.query(fetchQuery, [questionId]);
      
      if (fetchResult.rows.length === 0) {
        return res.status(404).json({ error: 'FAQ not found' });
      }
  
      const existingData = fetchResult.rows[0][column];
      const updatedData = existingData.filter(q => q.question_id !== questionId);
  
      const updateQuery = `
        UPDATE public.faq_tbl 
        SET ${column} = $1
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements(${column}) elem
          WHERE elem->>'question_id' = $2
        )
      `;
      const updateResult = await pool.query(updateQuery, [JSON.stringify(updatedData), questionId]);
  
      if (updateResult.rowCount === 0) {
        return res.status(404).json({ error: 'FAQ not found' });
      }
  
      res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }  

module.exports = { getFaq, getFaqByid, createfaqs, updateFqs, deleteApi, getAllFaq }