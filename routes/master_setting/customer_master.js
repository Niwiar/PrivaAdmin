const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { dbconfig } = require('../../config');

router.get('/data/:CompanyId', async (req, res, next) => {
    try{
        let CompanyId = req.params.CompanyId;
        let SelectCustomer = `SELECT row_number() over(order by CustomerFname) as 'index',
            a.CustomerId, a.CustomerTitle, a.CustomerFname, a.CustomerLname, a.CustomerTitle + a.CustomerFname + ' ' + a.CustomerLname CustomerName,
            a.CustomerEmail, a.CustomerTel, a.CompanyId, b.CompanyName
            FROM MasterCustomer a
            LEFT JOIN MasterCompany b ON a.CompanyId = b.CompanyId
            WHERE a.CompanyId = N'${CompanyId}' and a.CustomerActive = 1
            ORDER BY CustomerFname`;
        let pool = await sql.connect(dbconfig);
        let Customer = await pool.request().query(SelectCustomer);
        res.status(200).send(JSON.stringify(Customer.recordset));
    } catch(err){
        res.status(500).send({message: `${err}`});
    }
})

router.post('/add', async (req, res, next) => {
    try{
        let { CustomerTitle, CustomerFname, CustomerLname, CustomerTel, CustomerEmail, CompanyId } = req.body
        if (CustomerFname == '') {
            res.status(400).send({message: "Please enter Customer's firstname"});
            return;
        }
        if(CompanyId == 'null'){
            res.status(400).send({message: 'Please select Company'});
            return;
        }
        let pool = await sql.connect(dbconfig);
        let CheckCustomer = await pool.request().query(`SELECT *
            FROM MasterCustomer
            WHERE CustomerEmail = N'${CustomerEmail}'`);
        if(!CheckCustomer.recordset.length){
            let InsertCustomer = `INSERT INTO MasterCustomer(CustomerTitle, CustomerFname, CustomerLname, CustomerTel, CustomerEmail, CompanyId)
                VALUES  (N'${CustomerTitle}', N'${CustomerFname}', N'${CustomerLname}', N'${CustomerTel}', N'${CustomerEmail}', ${CompanyId})`;
            await pool.request().query(InsertCustomer);
            res.status(201).send({message: 'Successfully add customer'});
        } else {
            if(CheckCustomer.recordset[0].CustomerActive){
                console.log('checked')
                res.status(400).send({message: 'Duplicate Customer'});
            } else{
                let ActivateCustomer = `UPDATE MasterCustomer
                    SET
                    CustomerTitle = N'${CustomerTitle}',
                    CustomerFname = N'${CustomerFname}',
                    CustomerLname = N'${CustomerLname}',
                    CustomerTel = N'${CustomerTel}',
                    CompanyId = ${CompanyId},
                    CustomerActive = 1
                    WHERE CustomerEmail = N'${CustomerEmail}'`;
                await pool.request().query(ActivateCustomer);
                res.status(201).send({message: 'Successfully add customer'});
            }
        }
    } catch(err){
        res.status(500).send({message: `${err}`});
    }
})

router.put('/edit/:CustomerId', async (req, res) => {
    try{
        let CustomerId = req.params.CustomerId;
        let { CustomerTitle, CustomerFname, CustomerLname, CustomerTel, CustomerEmail, CompanyId } = req.body
        if (CustomerFname == '') {
            res.status(400).send({message: "Please enter Customer's firstname"});
            return;
        }
        if(CompanyId == 'null'){
            res.status(400).send({message: 'Please select Company'});
            return;
        }
        let pool = await sql.connect(dbconfig);
        let CheckCustomer = await pool.request().query(`SELECT CASE
            WHEN EXISTS(
                SELECT *
                FROM MasterCustomer
                WHERE CustomerEmail = N'${CustomerEmail}  AND NOT CustomerId = ${CustomerId}'
            )
            THEN CAST (1 AS BIT)
            ELSE CAST (0 AS BIT) END AS 'check'`);
        if(CheckCustomer.recordset[0].check){
            res.status(400).send({message: 'Duplicate Customer Email'});
        } else{
            let UpdateCustomer = `UPDATE MasterCustomer
                SET
                CustomerTitle = N'${CustomerTitle}',
                CustomerFname = N'${CustomerFname}',
                CustomerLname = N'${CustomerLname}',
                CustomerTel = N'${CustomerTel}',
                CustomerEmail = N'${CustomerEmail}',
                CompanyId = ${CompanyId}
                WHERE CustomerId = ${CustomerId}`;
            await pool.request().query(UpdateCustomer);
            res.status(200).send({message: `Successfully edit customer`});
        }
    } catch(err){
        res.status(500).send({message: `${err}`});
    }
})

router.delete('/delete/:CustomerId', async (req, res) => {
    try{
        let CustomerId = req.params.CustomerId;
        let DeleteCustomer = `UPDATE MasterCustomer
            SET CustomerActive = 0
            WHERE CustomerId = ${CustomerId}`;
        let pool = await sql.connect(dbconfig);
        await pool.request().query(DeleteCustomer);
        res.status(200).send({message: `Successfully delete customer`});
    } catch(err){
        res.status(500).send({message: `${err}`});
    }
})

module.exports = router