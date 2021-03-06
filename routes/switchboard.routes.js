///////////////////////////////////////////////////////////////////////////////////
// Required External Modules
///////////////////////////////////////////////////////////////////////////////////
const express = require("express");
const router = express.Router();
const { auth, requiresAuth } = require('express-openid-connect');
require("dotenv").config();  // load all ".env" variables into "process.env" for use
const { sequelize, Op } = require('sequelize');
const { UserProfiles, UserPermissionsActive, AirportsTable, AirportsCurrent,
        AISContentTypeCategories, LFOwnerTypeCategories, NationalRegions
    } = require('../models/sequelize.js');
const methodOverride = require('method-override');  // allows PUT and other non-standard methods
router.use(methodOverride('_method')); // allows use of the PUT/DELETE method extensions
const jsFx = require('../scripts/foa_node_fx');
const { check, validationResult, body } = require('express-validator');


///////////////////////////////////////////////////////////////////////////////////
// Auth0 Configuration
///////////////////////////////////////////////////////////////////////////////////

// Configuration for the express-openid-connect route
router.use(
    auth({
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
      baseURL: process.env.BASE_URL,
      clientID: process.env.AUTH0_CLIENT_ID,
      secret: process.env.SESSION_SECRET,
      authRequired: false,  // set to false by default as some pages are public
      auth0Logout: true,
    })
);


///////////////////////////////////////////////////////////////////////////////////
// Routes Definitions
///////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
// "GET" Routes (Read data)
////////////////////////////////////////////////////////////

////////////////////////////////////////
// If the user has not yet been granted any permissions
////////////////////////////////////////
router.get('/newuser', requiresAuth(), async (req, res) => {
    try {

        // Log the request (10001 = "New User Page Redirect")
//        const logResult = jsFx.createLogEntry(10001, req.oidc.user.name);
        console.log('New User!');
        return res.render('switchboard_newuser', {
            user: req.oidc.user,
            userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
        } )
    } catch(err) {
        console.log('Error:' + err);
    }
});

////////////////////////////////////////
// The main switchboard
////////////////////////////////////////
router.get('/', requiresAuth(), async (req, res) => {
    try {

        // general variables
        let errorCode = 0;
        let actionRequested = '';
        let statusMessage = '';
        // SELECT object options
        let nationalRegionsDDL = []; // list of all options for the State/Province/Territory/etc SELECT object
        let aisContentTypeCategoriesDDL = []; // list of all AIS Content Type Categories for the SELECT object
        let matchingAirports = ''; // array of all matching airports
        // airport search criteria
        let searchAirportID = '';
        let searchAirportName = '';
        let searchAirportCity = '';
        let searchAirportNationalRegion = '';
        let matchingAirportsCount;
        // specific options requested
        let airportIDRequested = '';
        let selectedAirportID = ''; // LFID for selected airport
        let selectedAirport = []; // details for selected airport
        let aisContentTypeRequested = '';
        let selectedAISContentType = ''; // AIS page to display

// Test
//let emailResult = jsFx.sendEmail('justjlqf@mail.com', `Test Email - Switchboard Route`,
//    `This is a test email from the AMCG switchboard.`);
// Test
//let logEventResult = await jsFx.logEvent('Switchboard Test', 'Log Test Event', 0, 'Success', 'Test Event Logged',
//0, 0, 0, 'justjlqf@mail.com');

        ////////////////////////////////////////////////////
        // Validate any query string parameters
        ////////////////////////////////////////////////////

        // Were any search criteria present?
        if ( req.query['searchairportid'] !== undefined ) {
            searchAirportID = req.query['searchairportid'];
            console.log(`querystring['searchairportid']: ${searchAirportID}`);
            if ( searchAirportID !== '' ) {
              // validate the requested Airport ID
// ToDo:  Validate the Airport ID exists
            };
        };
        if ( req.query['searchairportname'] !== undefined ) {
            searchAirportName = req.query['searchairportname'];
            console.log(`querystring['searchairportname']: ${searchAirportName}`);
            if ( searchAirportName !== '' ) {
              // validate the requested Airport Name
// ToDo:  Validate the Airport Name contains only valid characters
            };
        };
        if ( req.query['searchairportcity'] !== undefined ) {
            searchAirportCity = req.query['searchairportcity'];
            console.log(`querystring['searchairportcity']: ${searchAirportCity}`);
            if ( searchAirportCity !== '' ) {
              // validate the requested Airport City
// ToDo:  Validate the Airport City contains only valid characters
            };
        };
        if ( req.query['searchairportnationalregion'] !== undefined ) {
            searchAirportNationalRegion = req.query['searchairportnationalregion'];
            console.log(`querystring['searchairportnationalregion']: ${searchAirportNationalRegion}`);
            if ( searchAirportNationalRegion !== '' ) {
              // validate the requested Airport National Region
// ToDo:  Validate the Airport National Region exists
            };
        };

        // If a requested "airportid" is blank, redirect to the generic Switchboard page
        if ( req.query['airportid'] != undefined ) {
            airportIDRequested = req.query['airportid'];
            console.log(`querystring['airportid']: ${airportIDRequested}`);
            if ( airportIDRequested === '' ) { // if the querystring is blank, redirect to the main switchboard
// ToDo:  Log the error
                res.redirect('/switchboard');
            } else {  // validate the requested Airport ID
// ToDo:  Validate the Airport ID
               // The requested airport has been validated
               selectedAirportID = airportIDRequested;
            };
        };

        // If a requested "aiscontenttype" is blank, redirect to the default "General Information" page
        if ( req.query['aiscontenttype'] != undefined ) {
            aisContentTypeRequested = req.query['aiscontenttype'];
            console.log(`querystring['aiscontenttype']: ${aisContentTypeRequested}`);
            if ( aisContentTypeRequested === '' ) { // if the value is blank, reset to default value
                selectedAISContentType = '801001'; // default "General Information" page
            } else {  // validate the requested Airport ID
// ToDo:  Validate the AIS Content Type Requested, and log errors

                selectedAISContentType = aisContentTypeRequested;
            };
        };
        console.log(`aisContentTypeRequested: ${aisContentTypeRequested}`);
        console.log(`selected AIS Content Type: ${selectedAISContentType}`);

        ////////////////////////////////////////////////////
        // Retrieve options for add/edit form DDLs
        ////////////////////////////////////////////////////

        // Airport Search Objects
        // -- National Regions DDL
        nationalRegionsDDL = await NationalRegions.findAndCountAll({});
        console.log(`nationalRegions Count: ${nationalRegionsDDL.count}`);
        // -- AIS Content Types (data mgmt forms)
        aisContentTypeCategoriesDDL = await AISContentTypeCategories.findAndCountAll({});
        console.log(`aisContentTypeCategories Count: ${aisContentTypeCategoriesDDL.count}`);

        // Data Mgmt Forms
        // -- General Information (GIAI)
        let lfOwnerTypeCategoriesDDL = await LFOwnerTypeCategories.findAndCountAll({});
        console.log(`lfOwnerTypeCategories Count: ${lfOwnerTypeCategoriesDDL.count}`);


        ////////////////////////////////////////////////////
        // Get the current user's profile and permissions
        ////////////////////////////////////////////////////
        const userProfiles = await UserProfiles.findAll( { where: { Username: req.oidc.user.email }});
        console.log(`userProfile: ${userProfiles.length}`);
        if ( userProfiles.length === 0 ) {
            res.redirect(`/switchboard/newuser`);
        };

        // Get the list of active permissions for the user
        const userPermissionsActive = await UserPermissionsActive.findAndCountAll( { where: { UserID: userProfiles[0].UserID }});

        ////////////////////////////////////////////////////
        //  AIS/Airport Permissions and Details (DDLs, CRUD, etc.)
        ////////////////////////////////////////////////////
        const {
            userCanReadAISMenu, userCanReadAirports, userCanCreateAirports,
            airportID, airportDetails, doesAirportExist,
            userCanReadAirport, userCanUpdateAirport, userCanDeleteAirport
        } = await jsFx.getAISPermissionsForUser( userPermissionsActive, selectedAirportID );
    //    console.log(`user can use AIS: ${userCanReadAISMenu}`);
    //    console.log(`user can read airports: ${userCanReadAirports}`);
    //    console.log(`user can create airports: ${userCanCreateAirports}`);
    //    console.log(`airportID returned: ${airportID}`);
    //    console.log(`userCanReadAirport: ${userCanReadAirport}`);
    //    console.log(`userCanUpdateAirport: ${userCanUpdateAirport}`);
    //    console.log(`userCanDeleteAirport: ${userCanDeleteAirport}`);

        // Does the requested Airport exist (if requested)?
        console.log(`doesAirportExist: (${doesAirportExist})`);
        if ( !doesAirportExist ) {  // Airport ID does not exist
// ToDo:  Log the error
            errorCode = 908;  // Unknown Airport
            return res.render( 'error', {
                errorCode: errorCode,
                userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
            });
        };

//        // Does the User have permission to see/edit/delete this Sponsor?
//        if ( !userCanReadAirport ) { // User does not have permission to read Airport's data - trap and log error
//    // ToDo:  Log the error
//            errorCode = 909;  // Unknown Airport
//            return res.render( 'error', {
//                errorCode: errorCode,
//                userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
//            });
//        };

//         ////////////////////////////////////////////////////
//         //  Users Information (DDL, Add User, etc.)
//         ////////////////////////////////////////////////////

//         // Can the user see the users select object?  If so, load the Users available to the current user
//         const userPermissionsUserDDL = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'switchboard-users');
//         let userCanReadUsers = false;
//         let usersAllDDL = [];
//         if ( userPermissionsUserDDL.length > 0 && userPermissionsUserDDL[0].CanRead ) {
//             userCanReadUsers = true;
//             usersAllDDL = await UsersAllDDL.findAndCountAll({});
//             console.log(`usersAllDDL: ${usersAllDDL.count}`);
//         };
//         console.log(`userCanReadUsers: ${userCanReadUsers}`);

//         // Can the user create new users?
//         let userCanCreateUsers = false;
//         if ( userCanReadUsers && userPermissionsUserDDL[0].CanCreate ) {
//             userCanCreateUsers = true;
//         };

//         // If a ScholarshipID was provided in the querystring, find the Scholarship's details
//         let scholarshipDetails = [];
//         let scholarshipID = '';
//         if ( req.query['scholarshipid'] ) {
//             scholarshipID = req.query['scholarshipid'];
// //            scholarshipDetails = await ScholarshipsTable.findAll({ where: { ScholarshipID: scholarshipID }});
//         };

//         ////////////////////////////////////////////////////
//         //  Process any querystring "actions requested"
//         ////////////////////////////////////////////////////

//         if ( req.query['actionRequested'] === 'addsponsor' ) {
//             if ( userCanCreateSponsors ) {
//                 actionRequested = 'addsponsor';
//             };
//         } else if ( req.query['actionRequested'] === 'addscholarships' ) {
//             if ( userCanCreateScholarships ) {
//                 actionRequested = 'addscholarship';
//             };
//         };

         ////////////////////////////////////////////////////
         // Process any querystring "status message"
         ////////////////////////////////////////////////////
         if ( req.query['status'] === 'airportupdatesuccess' ) {
             statusMessage = 'Airport was updated.';
//         } else if ( req.query['status'] === 'sponsordeletesuccess' ) {
//             statusMessage = 'Sponsor was deleted.';
//         } else if ( req.query['status'] === 'sponsorcreatesuccess' ) {
//             statusMessage = 'Sponsor was added.';
         } else {
             statusMessage = '';
         };

        ////////////////////////////////////////////////////
        // Get the matching airports (if requested)
// ToDo:  Abstract this into a function
        ////////////////////////////////////////////////////
        if ( searchAirportID !== '' || searchAirportName !== '' || searchAirportCity !== '' || searchAirportNationalRegion !== '' ) {
            if ( searchAirportID !== '' ) {
                matchingAirports = await AirportsCurrent.findAndCountAll({ 
                    where: { LFLocationID_FAA: searchAirportID.toUpperCase() }
                });
            } else if ( searchAirportName !== '' ) {
                matchingAirports = await AirportsCurrent.findAndCountAll({
                    where: { LFName_FAA: { [Op.like]: '%' + searchAirportName.toUpperCase() + '%' }}
                });
            } else if ( searchAirportCity !== '' && searchAirportNationalRegion === '' ) {
                matchingAirports = await AirportsCurrent.findAndCountAll({
                    where: { LFCityName_FAA: { [Op.like]: '%' + searchAirportCity.toUpperCase() + '%' }}
                });
            } else if ( searchAirportNationalRegion !== '' && searchAirportCity === '') {
                matchingAirports = await AirportsCurrent.findAndCountAll({
                    where: { LFStateName_FAA: searchAirportNationalRegion.toUpperCase() }
                });
            } else if ( searchAirportNationalRegion !== '' && searchAirportCity !== '') {
                matchingAirports = await AirportsCurrent.findAndCountAll({
                    where: { LFCityName_FAA: { [Op.like]: '%' + searchAirportCity.toUpperCase() + '%' },
                             LFStateName_FAA: searchAirportNationalRegion.toUpperCase() }
                });
            };
            matchingAirportsCount = matchingAirports.count;
            if ( matchingAirports.count === 1 ) { // if only one matching airport, default to that airport
                res.redirect('/switchboard?airportid=' + matchingAirports.rows[0].LFLocationID_FAA +
                    '&aiscontenttype=801001');
            };
            console.log(`matching Airports: ${matchingAirports.count}`);
            console.log(`matchingAirportID: ${selectedAirportID}`);
        } else if ( selectedAirportID !== "" ) {  // a requested aiport was submitted (and validated)
            matchingAirports = await AirportsCurrent.findAndCountAll({ 
                where: { LFLocationID_FAA: selectedAirportID.toUpperCase() }
            });
            selectedAirport = matchingAirports.rows[0];
            matchingAirportsCount = 1;
            actionRequested = 'editairport';
            };
        console.log(`selectedAirportID: ${selectedAirportID}`);
        console.log(`selectedAirport: ${selectedAirport}`);

        ////////////////////////////////////////////////////
        // Render the page
        ////////////////////////////////////////////////////
        console.log('Rendering Switchboard');
        return res.render('switchboard', {
            // Admin data
//             errorCode,
            actionRequested,
            statusMessage,
            // User data
            user: req.oidc.user,
            userName: ( req.oidc.user == null ? '' : req.oidc.user.name ),
            // Menu item permissions
            userCanReadAISMenu,
            userCanReadAirports,
            userCanCreateAirports,
            // Search results
            nationalRegionsDDL,
            matchingAirports,
            matchingAirportsCount,
            aisContentTypeCategoriesDDL,
            selectedAirport,
            selectedAirportID,
            userCanUpdateAirport,
            selectedAISContentType,
            // Data Mgmt DDLs
            lfOwnerTypeCategoriesDDL,
            // Airport CRUD Information
            airportID // Used???
        });
    } catch(err) {
        console.log('Error:' + err);
    }
});


////////////////////////////////////////
// "POST" Routes (Add new data records; search for data)
////////////////////////////////////////

router.post('/searchAIS', requiresAuth(),
    [
//        check('sponsorName')
//            .isLength( { min: 3, max: 100 } ).withMessage('Sponsor Name should be 3 to 100 characters.')
    ],

    async (req, res) => {

    console.log('searchAIS route entered');

    ////////////////////////////////////////////////////
    // Environmental Variables
    ////////////////////////////////////////////////////
        let errorCode = '';
    let actionRequested = '';
    let statusMessage = '';
    let selectedAirportID = ''; // LFID for selected airport
    let selectedAirport = []; // details for selected airport
    let selectedAISContentType = ''; // AIS page to display

    ////////////////////////////////////////////////////
    // Validate the input
    ////////////////////////////////////////////////////
    const validationErrors = validationResult(req);

    ////////////////////////////////////////////////////
    // If invalid data, log errors and return generic error to client
    ////////////////////////////////////////////////////
    if ( !validationErrors.isEmpty() ) {

// ToDo:  Replicate the GET render code above, including parameters prep work

        return res.status(400).json(validationErrors.array());

    } else {

        ////////////////////////////////////////////////////
        // Get the matching airports
        ////////////////////////////////////////////////////
        let matchingAirports = await AirportsCurrent.findAndCountAll({ where: { LFLocationID_FAA: req.body.searchAISLFID.toUpperCase() } });
        console.log(`matching Airports: ${matchingAirports.count}`);
        if ( matchingAirports.count === 1 ) { // if only one matching airport, default to that airport
            selectedAirport = matchingAirports.rows[0];
            selectedAirportID = matchingAirports.rows[0].LFLocationID_FAA;
            actionRequested = 'editairport';

        };
        console.log(`selectedAirportID: ${selectedAirportID}`);

        ////////////////////////////////////////////////////
        // Retrieve options for add/edit form DDLs
        ////////////////////////////////////////////////////
        let lfOwnerTypeCategoriesDDL = await LFOwnerTypeCategories.findAndCountAll({});
        console.log(`lfOwnerTypeCategories Count: ${lfOwnerTypeCategoriesDDL.count}`);
        let aisContentTypeCategoriesDDL = await AISContentTypeCategories.findAndCountAll({});
        console.log(`aisContentTypeCategories Count: ${aisContentTypeCategoriesDDL.count}`);
        if ( req.body.searchAISContentTypeCategories === undefined ) {
            selectedAISContentType = '801001'; // default to the General Airport Information page
        } else {
// ToDo: VALIDATE THE DATA UPON SUBMITTAL!!
            selectedAISContentType = req.body.searchAISContentTypeCategories;
        };
        console.log(`selected AIS Content Type: ${selectedAISContentType}`);

        ////////////////////////////////////////////////////
        // Render the switchboard with matching airports listed
        ////////////////////////////////////////////////////
        console.log(`rendering AIS Search results`);
        return res.render('switchboard', {
            // Admin data
            actionRequested,
            statusMessage,
            // User data
            user: req.oidc.user,
            userName: ( req.oidc.user == null ? '' : req.oidc.user.name ),
            // Search results
            matchingAirports,
            aisContentTypeCategoriesDDL,
            selectedAirport,
            selectedAirportID,
            userCanUpdateAirport: true,
            selectedAISContentType,
            // Data Mgmt DDLs
            lfOwnerTypeCategoriesDDL
        });
    };
});


////////////////////////////////////////
// "PUT" Routes (Update data)
////////////////////////////////////////

/////////////////////////
// AIS - General/Airport Info
/////////////////////////
router.put('/airportupdategiai', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
// ToDo:  Verify airport ID !
    const airportRecord = await AirportsTable.findOne( {
        where: { LFLocationID: req.body.airportIDToUpdate }
    });
    console.log(`airportIDToUpdate: ${airportRecord.LFLocationID}`)

    // Update the database record with the new data
    await airportRecord.update( {
        LFWebsite: req.body.airportWebsite,
        LFEmail: req.body.airportEmail,
        LFNotes: req.body.airportNotes,
        LFOwnerFax: req.body.sponsorFax,
        LFOwnerEmail: req.body.sponsorEmail,
        LFOwnerType: req.body.sponsorType,
        LFOwnerLogoFilename: req.body.sponsorLogoFilename,
        LFOwnerNotes: req.body.sponsorNotes
    }).then( () => {
        res.redirect(`/switchboard?airportid=${airportRecord.LFLocationID}` +
                     `&status=airportupdatesuccess` +
                     `&aiscontenttype=801001`);
    });
});

/////////////////////////
// AIS - Governing/Advisory Body
/////////////////////////
router.put('/airportupdategigb', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
// ToDo:  Verify airport ID !
    const airportRecord = await AirportsTable.findOne( {
        where: { LFLocationID: req.body.airportIDToUpdate }
    });
    console.log(`airportIDToUpdate: ${airportRecord.LFLocationID}`)

    // Reformat blank dates and numbers to NULL values to be updated into Postgres
    let govBodyMemberCount = (req.body.governingBodyMemberCount === "") ? null : req.body.governingBodyMemberCount;
    let govBodyTerm = (req.body.governingBodyTerm === "") ? null : req.body.governingBodyTerm;
    let govBodyTermMax = (req.body.governingBodyTermMax === "") ? null : req.body.governingBodyTermMax;
    let advBodyMemberCount = (req.body.advisoryBodyMemberCount === "") ? null : req.body.advisoryBodyMemberCount;
    let advBodyTerm = (req.body.advisoryBodyTerm === "") ? null : req.body.advisoryBodyTerm;
    let advBodyTermMax = (req.body.advisoryBodyTermMax === "") ? null : req.body.advisoryBodyTermMax;

    // Update the database record with the new data
    await airportRecord.update( {
        LFGovBodyName:        req.body.governingBodyName,
        LFGovBodyMemberCount: govBodyMemberCount,
        LFGovBodyTerm:        govBodyTerm,
        LFGovBodyTermMax:     govBodyTermMax,
        LFGovBodyNotes:       req.body.governingBodyNotes,
        LFAdvBodyName:        req.body.advisoryBodyName,
        LFAdvBodyMemberCount: advBodyMemberCount,
        LFAdvBodyTerm:        advBodyTerm,
        LFAdvBodyTermMax:     advBodyTermMax,
        LFAdvBodyNotes:       req.body.advisoryBodyNotes
    }).then( () => {
        res.redirect(`/switchboard?airportid=${airportRecord.LFLocationID}` +
                     `&status=airportupdatesuccess` +
                     `&aiscontenttype=801002`);
    });
});

/////////////////////////
// AIS - Operator / Manager Info
/////////////////////////
router.put('/airportupdategioa', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
// ToDo:  Verify airport ID !
    const airportRecord = await AirportsTable.findOne( {
        where: { LFLocationID: req.body.airportIDToUpdate }
    });
    console.log(`airportIDToUpdate: ${airportRecord.LFLocationID}`)

    // Update the database record with the new data
    await airportRecord.update( {
        LFOpName:                  req.body.operatorName,
        LFOpAddress:               req.body.operatorAddress,
        LFOpCity:                  req.body.operatorCity,
        LFOpState:                 req.body.operatorState,
        LFOpZip:                   req.body.operatorZip,
        LFOpPhone:                 req.body.operatorTelephone,
        LFOpFax:                   req.body.operatorFax,
        LFOpEmail:                 req.body.operatorEmail,
        LFOpType:                  req.body.operatorType,
        LFOpNotes:                 req.body.operatorNotes,
        LFMgrFax:                  req.body.managerFax,
        LFMgrEmail:                req.body.managerEmail,
        LFMgrNotes:                req.body.managerNotes,
        LFMgrOrgChartFilename:     req.body.managerOrgChartFilename
    }).then( () => {
        res.redirect(`/switchboard?airportid=${airportRecord.LFLocationID}` +
                     `&status=airportupdatesuccess` +
                     `&aiscontenttype=801003`);
    });
});


////////////////////////////////////////
// "DELETE" Routes (Delete data)
////////////////////////////////////////

// router.delete('/sponsordelete', requiresAuth(), async (req, res) => {

//     // Get a pointer to the current record
// //    console.log(`body.SponsorID: ${req.body.sponsorIDToDelete}`);
//     const sponsorRecord = await SponsorsTableTest.findOne( {
//         where: { SponsorID: req.body.sponsorIDToDelete }
//     });
// //    console.log(`sponsorRecord: ${sponsorRecord.SponsorID}`);

//     // Delete the record, based on the Sponsor ID
//     await sponsorRecord.destroy().then( () => {
//         res.redirect(`/switchboard?status=sponsordeletesuccess`);
//     });
// });


////////////////////////////////////////
// Return all routes
////////////////////////////////////////

module.exports = router;