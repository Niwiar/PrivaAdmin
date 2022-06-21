const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { dbconfig } = require('../../../config');

router.get('/list', async (req, res, next) => {
    try{
        getQuotationList = `SELECT
        row_number() over(order by a.QuotationId desc) as 'index',
        a.QuotationId,
        a.QuotationNo,
        a.QuotationSubject Subject,
        b.CustomerTitle + b.CustomerFname + b.CustomerLname Customer,
        a.QuotationDate,
        a.QuotationStatus Status
        FROM [Quotation] a
        LEFT JOIN [Customer] b ON a.CustomerId = b.CustomerId`;
        let pool = await sql.connect(dbconfig);
        let quotations = await pool.request().query(getQuotationList);
        res.status(200).send(JSON.stringify(quotations.recordset));
    } catch(err){
        res.status(500).send({message: err});
    }
})

module.exports = router