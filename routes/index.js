///////////////////////////////////////////////////////
// Routes
///////////////////////////////////////////////////////

const routes = require('express').Router();
const { pool } = require('../db/dbstuff.js');
const { pool2 } = require('../db/dbstuff2.js');
const async = require('async');
const queries = require('../db/sql.js');

// Website "Home"
routes.get('/', (request, response) => {
    response.redirect('../scholarships');
});

// Get all scholarships, regardless of filters
routes.get('/scholarships', (request, response, next) => {

    async function queryResults() {
            let resSponsors = await pool2.query(queries.qrySponsorsAllDDL.text);
            const resSponsorsRows = resSponsors.rows;
            let resFieldOfStudyCategories = await pool2.query(queries.qryFieldOfStudyCategoriesAllDDL.text);
            const resFieldOfStudyCategoriesRows = resFieldOfStudyCategories.rows;
            let resCitizenships = await pool2.query(queries.qryCitizenshipCategoriesAllDDL.text);
            const resCitizenshipsRows = resCitizenships.rows;
            let resYearOfNeed = await pool2.query(queries.qryYearOfNeedCategoriesAllDDL.text);
            const resYearOfNeedRows = resYearOfNeed.rows;
            let resEnrollmentStatuses = await pool.query(queries.qryEnrollmentStatusesActiveDDL.text);
            const resEnrollmentStatusesRows = resEnrollmentStatuses.rows;
            let resMilitaryServiceCategories = await pool.query(queries.qryMilitaryServiceCategoriesActiveDDL.text);
            const resMilitaryServiceCategoriesRows = resMilitaryServiceCategories.rows;
            let resFAAPilotCertificateCategories = await pool.query(queries.qryFAAPilotCertificateCategoriesActiveDDL.text);
            const resFAAPilotCertificateCategoriesRows = resFAAPilotCertificateCategories.rows;
            let resFAAPilotRatingCategories = await pool.query(queries.qryFAAPilotRatingCategoriesActiveDDL.text);
            const resFAAPilotRatingCategoriesRows = resFAAPilotRatingCategories.rows;
            let resFAAMechanicCertificateCategories = await pool.query(queries.qryFAAMechanicCertificateCategoriesActiveDDL.text);
            const resFAAMechanicCertificateCategoriesRows = resFAAMechanicCertificateCategories.rows;
            // Load all scholarships
            let resScholarships = await pool2.query(queries.qryScholarships.text);
            const resScholarshipsRows = resScholarships.rows;
            // Return all data sets to the calling function
            return {
                     resSponsorsRows, 
                     resFieldOfStudyCategoriesRows, 
                     resCitizenshipsRows, 
                     resYearOfNeedRows,
                     resEnrollmentStatusesRows,
                     resMilitaryServiceCategoriesRows,
                     resFAAPilotCertificateCategoriesRows,
                     resFAAPilotRatingCategoriesRows,
                     resFAAMechanicCertificateCategoriesRows,
                     resScholarshipsRows
            };
    }

    // Collect all data sets and render the Scholarships Search page
    queryResults().then( (result) => {
        response.render('scholarshipsearch', { 
            sponsors:                         result.resSponsorsRows,
            fieldofstudycategories:           result.resFieldOfStudyCategoriesRows,
            citizenships:                     result.resCitizenshipsRows,
            yearofneed:                       result.resYearOfNeedRows,
            enrollmentstatuscategories:       result.resEnrollmentStatusesRows,
            militaryservicecategories:        result.resMilitaryServiceCategoriesRows,
            faapilotcertificatecategories:    result.resFAAPilotCertificateCategoriesRows,
            faapilotratingcategories:         result.resFAAPilotRatingCategoriesRows,
            faamechaniccertificatecategories: result.resFAAMechanicCertificateCategoriesRows,
            scholarships:                     result.resScholarshipsRows
        });
    })
});

 // Get a specific scholarship
 routes.get('/scholarships/:id', (request, response, next) => {
    const { id } = request.params;
    db.query('SELECT "ScholarshipName" FROM public."tblScholarships" WHERE "ScholarshipID" = $1', [id], (err, res) => {
        if (err) return next(err);
        console.log('test1');
//        console.log(res.rows[0]['ScholarshipName']);
        response.render('scholarshipsearch', { scholarshipName: res.rows[0]['ScholarshipName'] });
//        response.render('scholarshipsearch', { scholarships: res.rows });
        console.log('test2');
    })
});
/*
// Get all sponsors, regardless of filters
routes.get('/sponsors', (request, response, next) => {

    async function queryResults() {
        let resSponsorsList = await pool2.query(queries.qrySponsorsAllDDL.text);
        const resSponsorsListRows = resSponsorsList.rows;
        let resSponsorTypeCategories = await pool2.query(queries.qrySponsorTypeCategoriesAllDDL.text);
        const resSponsorTypeCategoriesRows = resSponsorTypeCategories.rows;
//        let resSponsorsAllWithScholarshipInfo = await pool2.query(queries.qrySponsorsAllWithScholarshipInfo.text);
//        const resSponsorsAllWithScholarshipInfoRows = resSponsorsAllWithScholarshipInfo.rows;
        let resScholarships = await pool2.query(queries.qryScholarships.text);
        const resScholarshipsRows = resScholarships.rows;
        let resSponsorsAll = await pool2.query(queries.qrySponsorsAll.text);
        const resSponsorsAllRows = resSponsorsAll.rows;
        // Return all data sets to the calling function
        return {
            resSponsorsListRows, 
            resSponsorTypeCategoriesRows,
//            resSponsorsAllWithScholarshipInfoRows,
            resScholarshipsRows,
            resSponsorsAllRows
        };
    }

    // Collect all data sets and render the Scholarships Search page
    queryResults().then( (result) => {
        response.render('sponsorsearch', { 
            sponsorslist:                   result.resSponsorsListRows,
            sponsortypecategories:          result.resSponsorTypeCategoriesRows,
//            sponsorsallwithscholarshipinfo: result.resSponsorsAllWithScholarshipInfoRows,
            scholarshipsactive:             result.resScholarshipsRows,
            sponsorsall:                    result.resSponsorsAllRows
        });
    })
});

// take the user to the "My Account / Login" page
routes.get('/myaccount', (request, response, next) => {

//    async function queryResults() {
//        let resSponsorsList = await pool2.query(queries.qrySponsorsAllDDL.text);
//        const resSponsorsListRows = resSponsorsList.rows;
//        let resSponsorTypeCategories = await pool2.query(queries.qrySponsorTypeCategoriesAllDDL.text);
//        const resSponsorTypeCategoriesRows = resSponsorTypeCategories.rows;
//        let resScholarships = await pool2.query(queries.qryScholarships.text);
//        const resScholarshipsRows = resScholarships.rows;
//        let resSponsorsAll = await pool2.query(queries.qrySponsorsAll.text);
//        const resSponsorsAllRows = resSponsorsAll.rows;
//        // Return all data sets to the calling function
//        return {
//            resSponsorsListRows, 
//            resSponsorTypeCategoriesRows,
//            resScholarshipsRows,
//            resSponsorsAllRows
//        };
//    }

//    // Collect all data sets and render the Scholarships Search page
//    queryResults().then( (result) => {
        response.render('myaccount', { 
//            sponsorslist:                   result.resSponsorsListRows,
//            sponsortypecategories:          result.resSponsorTypeCategoriesRows,
//            scholarshipsactive:             result.resScholarshipsRows,
//            sponsorsall:                    result.resSponsorsAllRows
        });
//    })
});
*/
module.exports = routes;