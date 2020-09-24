const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db/db_config.js');
const Sponsors = require(path.join(__dirname, '../models/', 'sponsorModels.js'));
const Scholarships = require(path.join(__dirname, '../models/', 'scholarshipModels.js'));

// All routes that start with "/scholarshipsearch"; since this is part of the definition in app.js
// the "/" implies "/scholarshipsearch".

///////////////////////////////////////////////////////////////////////////////////
// Scholarship Search page (no results) (i.e., https://.../scholarshipsearch/)
///////////////////////////////////////////////////////////////////////////////////
router.get('/', async (request, response) => {

    try {

        // get the options lists for the Search Criteria DDLs
        const fieldsofstudyDDL = await Scholarships.FieldOfStudyCategoriesDDL.findAll();
        const sponsorsDDL = await Sponsors.SponsorsDDL.findAll();
        const citizenshipsDDL = await Scholarships.CitizenshipCategoriesDDL.findAll();
        const yearsofneedDDL = await Scholarships.YearOfNeedCategoriesDDL.findAll();
        const enrollmentstatusesDDL = await Scholarships.EnrollmentStatusCategoriesDDL.findAll();
        const militaryservicetypesDDL = await Scholarships.MilitaryServiceCategoriesDDL.findAll();
        const faapilotcertificatesDDL = await Scholarships.FAAPilotCertificateCategoriesDDL.findAll();
        const faapilotratingsDDL = await Scholarships.FAAPilotRatingCategoriesDDL.findAll();
        const faamechaniccertificatesDDL = await Scholarships.FAAMechanicCertificateCategoriesDDL.findAll();

        // get a distinct list of active Scholarships, ordered by Sponsor Name, Scholarship Name
        const scholarshipsActive = await Scholarships.ScholarshipsActive.findAll();
        console.log(`Scholarships (Active) Count: ${scholarshipsActive.length}`);

        return response.render('scholarshipsearch', {
            fieldsofstudyddl:           fieldsofstudyDDL,
            sponsorsddl:                sponsorsDDL,
            citizenshipsddl:            citizenshipsDDL,
            yearsofneedddl:             yearsofneedDDL,
            enrollmentstatusesddl:      enrollmentstatusesDDL,
            militaryservicetypesddl:    militaryservicetypesDDL,
            faapilotcertificatesddl:    faapilotcertificatesDDL,
            faapilotratingsddl:         faapilotratingsDDL,
            faamechaniccertificatesddl: faamechaniccertificatesDDL,
            scholarships:               scholarshipsActive
        })
    } catch(err) {
        console.log('Error:' + err);
    }
});

///////////////////////////////////////////////////////////////////////////////////
// export all routes
///////////////////////////////////////////////////////////////////////////////////
module.exports = router;