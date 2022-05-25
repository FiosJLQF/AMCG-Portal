///////////////////////////////////////////////////////////////////////////////////
// Required External Modules
///////////////////////////////////////////////////////////////////////////////////
const express = require("express");
const router = express.Router();
const { auth, requiresAuth } = require('express-openid-connect');
require("dotenv").config();  // load all ".env" variables into "process.env" for use
const { sequelize, Op } = require('sequelize');  // Sequelize "Operators" functions for querying
const methodOverride = require('method-override');  // allows PUT and other non-standard methods
router.use(methodOverride('_method')); // allows use of the PUT/DELETE method extensions
const amcgFx = require('../scripts/amcg_node_fx');
const genericFx = require('../scripts/generic_node_fx');
const { check, validationResult, body } = require('express-validator');
const htmlEntities = require('html-entities');


///////////////////////////////////////////////////////////////////////////////////
// Data Models
///////////////////////////////////////////////////////////////////////////////////
const { UserProfiles, UserPermissionsActive, AirportsTable, AirportsCurrent,
        AISContentTypeCategories, LFOwnerTypeCategories, NationalRegions
} = require('../models/sequelize.js');


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
//        const logResult = genericFx.createLogEntry(10001, req.oidc.user.name);
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

        ////////////////////////////////////////////////////
        // Set local variables
        ////////////////////////////////////////////////////
        let errorCode = 0;
        let statusMessage = '';
        let logEventResult = '';
        // Current User variables
        let userProfiles = [];
        let currentUserID = 0;
        let userIsDataAdmin = false;
        // Querystring parameters
        let actionRequested = '';
        let matchingAirports = []; // array of all matching airports
        // SELECT object options
        let nationalRegionsDDL = []; // list of all options for the State/Province/Territory/etc SELECT object
        let aisContentTypeCategoriesDDL = []; // list of all AIS Content Type Categories for the SELECT object
        // Airport search criteria
        let searchAirportID = '';
        let searchAirportName = '';
        let searchAirportCity = '';
        let searchAirportNationalRegion = '';
        let matchingAirportsCount;
        // Specific options requested
        let airportIDRequested = '';
        let selectedAirportID = ''; // LFID for selected airport
        let selectedAirport = []; // details for selected airport
        let aisContentTypeRequested = '';
        let selectedAISContentType = ''; // AIS page to display
        let userIDRequested = '';
        let userPermissionIDRequested = '';

// Test
//let emailResult = genericFx.sendEmail('justjlqf@mail.com', `Test Email - Switchboard Route`,
//    `This is a test email from the AMCG switchboard.`);
// Test
//let logEventResult = await genericFx.logEvent('Switchboard Test', 'Log Test Event', 0, 'Success', 'Test Event Logged',
//0, 0, 0, 'justjlqf@mail.com');

        ////////////////////////////////////////////////////
        // Get the current user's profile and permissions
        ////////////////////////////////////////////////////
        userProfiles = await UserProfiles.findAndCountAll( { where: { Username: req.oidc.user.email }});
        console.log(`User Profiles count: ${userProfiles.count}`);

        if ( userProfiles.count == 0 ) {  // The new user has not yet been set up
            // Log the event
            logEventResult = await genericFx.logEvent('User Profiles', 'Get Current User', 903, 'Failure',
                'User not yet configured', 0, 0, 0, '');
            // Redirect the user to the "New User" screen
            res.redirect(`/switchboard/newuser`);
        };  // END: Does the User Profile exist?

        // Current User exists and is configured; continue processing
        currentUserID = userProfiles.rows[0].UserID;
        // Log the access by the Current User
        logEventResult = await genericFx.logEvent('Page Access', 'Switchboard', 900, 'Informational', 'User Accessed Page',
            0, 0, currentUserID, '');
        // Get the list of active permissions for the user
// TODO: Replace with "genericFx.checkUserPermission()"" function calls
        const userPermissionsActive = await UserPermissionsActive.findAndCountAll( { where: { UserID: currentUserID }});
        // Check to see if the current User is a "Data Admin" (AMCG web manager)
        userIsDataAdmin = await genericFx.checkUserPermission(currentUserID, '923010', 'CanRead');


        ////////////////////////////////////////////////////
        // Validate any query string parameters
        //   - client-side validation already occurred before form submittal
        //   - this step only validates value formats for changes post-submittal
        //   - authorization verification and domain checking will occur in a subsequent step
        ////////////////////////////////////////////////////

        /////////////////////////
        // Were any search criteria present?
        /////////////////////////
        
        // Validate the "Airport ID" search parameter, if present
        if ( req.query['searchairportid'] !== undefined ) {
            searchAirportID = req.query['searchairportid'].toUpperCase();
            console.log(`querystring['searchairportid']: ${searchAirportID}`);
            if ( searchAirportID !== '' ) {  // querystring is present
                if ( !/^[A-Za-z0-9]*$/.test(searchAirportID) ) {  // Airport ID contains invalid characters
                    // Log the event
                    logEventResult = await genericFx.logEvent('Airport ID Validation', '', 908, 'Failure',
                        `Airport ID contains invalid characters (${searchAirportID})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                };
            };
        };

        // Validate the "Airport Name" search parameter, if present
        if ( req.query['searchairportname'] !== undefined ) {
            searchAirportName = req.query['searchairportname'];
            console.log(`querystring['searchairportname']: ${searchAirportName}`);
            if ( searchAirportName !== '' ) {
                // validate the requested Airport Name
                if ( !/^[A-Za-z]*$/.test(searchAirportName) ) {  // Airport Name contains invalid characters
                    // Log the event
                    logEventResult = await genericFx.logEvent('Airport Name Validation', '', 909, 'Failure',
                        `Airport Name contains invalid characters (${searchAirportName})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                };
            };
        };

        // Validate the "Airport City" search parameter, if present
        if ( req.query['searchairportcity'] !== undefined ) {
            searchAirportCity = req.query['searchairportcity'];
            console.log(`querystring['searchairportcity']: ${searchAirportCity}`);
            if ( searchAirportCity !== '' ) {
                // validate the requested Airport City
                if ( !/^[A-Za-z]*$/.test(searchAirportCity) ) {  // Airport City contains invalid characters
                    // Log the event
                    logEventResult = await genericFx.logEvent('Airport City Validation', '', 912, 'Failure',
                        `Airport City contains invalid characters (${searchAirportCity})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                };
            };
        };

        // Validate the "Airport State/Province/Territory" (aka "National Region") search parameter, if present
        if ( req.query['searchairportnationalregion'] !== undefined ) {
            searchAirportNationalRegion = req.query['searchairportnationalregion'];
            console.log(`querystring['searchairportnationalregion']: ${searchAirportNationalRegion}`);
            if ( searchAirportNationalRegion !== '' ) {
                // validate the requested Airport National Region
                if ( !/^[A-Za-z]*$/.test(searchAirportNationalRegion) ) {  // Airport National Region contains invalid characters
                    // Log the event
                    logEventResult = await genericFx.logEvent('Airport National Region Validation', '', 913, 'Failure',
                        `Airport National Region contains invalid characters (${searchAirportNationalRegion})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                };
            };
        };

        // Validate the "Requested Airport ID" (for CRUD operations, not the Search Engine), if present
        if ( req.query['airportid'] != undefined ) {
            airportIDRequested = req.query['airportid'];
            console.log(`querystring['airportid']: ${airportIDRequested}`);
            if ( airportIDRequested !== '' ) {  // querystring is present
                if ( !/^[A-Za-z0-9]*$/.test(airportIDRequested) ) {  // Airport ID contains invalid characters
                    // Log the event
                    logEventResult = await genericFx.logEvent('Airport ID Validation', '', 914, 'Failure',
                        `Airport ID contains invalid characters (${airportIDRequested})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                } else {
                    // The requested airport has been validated
                    selectedAirportID = airportIDRequested;
                };
            };
        };

        // Validate the "AIS Content Type" search parameter, if present
        if ( req.query['aiscontenttype'] !== undefined ) {
            aisContentTypeRequested = req.query['aiscontenttype'].toUpperCase();
            console.log(`querystring['aiscontenttype']: ${aisContentTypeRequested}`);
            if ( aisContentTypeRequested !== '' ) {  // querystring is present
                if ( !/^[0-9]*$/.test(aisContentTypeRequested) ) {  // AIS Content Type contains invalid characters
                    // Log the event
                    logEventResult = await genericFx.logEvent('AIS Content Type Validation', '', 915, 'Failure',
                        `AIS Content Type contains invalid characters (${aisContentTypeRequested})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                } else {
                    // The requested AIS Content Type has been validated
                    selectedAISContentType = aisContentTypeRequested;
                };
            } else {
                // if the value is blank, reset to default value
                selectedAISContentType = '801001'; // default "General Information" page
            };
        };

        /////////////////////////
        // Were any other parameters present?
        /////////////////////////
        
        // Validate the "Requested Website User ID" parameter, if present
        if ( req.query['userid'] != undefined ) {
            userIDRequested = Number(req.query['userid']);
            console.log(`req.query['userid']: ${userIDRequested}`);
            if ( userIDRequested == 0 || userIDRequested === '' || Number.isNaN(userIDRequested)) {
                // Log the event
                logEventResult = await genericFx.logEvent('UserID Validation', '', 910, 'Failure',
                    `UserID is not valid (${req.query['userid']})`,
                    0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Redirect the user to the main switchboard
                res.redirect('/switchboard');
            };
        };
                
        // Validate the "Requested Website User Permission ID" parameter, if present
        if ( req.query['userpermissionid'] != undefined ) {
            userPermissionIDRequested = Number(req.query['userpermissionid']);
            console.log(`req.query['userpermissionid'] = ${userPermissionIDRequested}`);
            if ( userPermissionIDRequested == 0 || userPermissionIDRequested === '' || Number.isNaN(userPermissionIDRequested)) {
                // Log the event
                logEventResult = await genericFx.logEvent('UserPermissionID Validation', '', 911, 'Failure',
                    `UserPermissionID is not valid (${req.query['userpermissionid']})`,
                    0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Redirect the user to the main switchboard
                res.redirect('/switchboard');
            };
        };
                
        // Validate the "Status" parameter, if present
        if ( req.query['status'] != undefined ) {
            if ( req.query['status'] === 'airportupdatesuccess' ) {
                statusMessage = 'Airport was updated.';
            } else {
                statusMessage = '';
                // Log the event
                logEventResult = await genericFx.logEvent('Status Message ID Validation', '', 916, 'Failure',
                    `Status Message ID is not valid (${req.query['status']})`,
                    0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
            };
        };


        ////////////////////////////////////////////////////
        //  AIS/Airport Permissions and Details (DDLs, CRUD, etc.)
        ////////////////////////////////////////////////////
        const {
            userCanReadAISMenu, userCanReadAirports, airportsAllowedToUser, airportsAllowedToUserArray,
            airportID, airportExists, airportDetails, userCanReadAirport, userCanUpdateAirport
        } = await amcgFx.getAISPermissionsForUser( currentUserID, selectedAirportID );

        // If an Airport was requested, but it doesn't exist, trap the error
        if ( selectedAirportID && !airportExists ) {
            // Log the error
            logEventResult = await genericFx.logEvent('Content Access', `AIS Airport Data: ${ selectedAirportID }`, 921,
               'Failure', 'Requested airport does not exist.', 0, 0, currentUserID, '');
            // Redirect the user to the main switchboard
            res.redirect('/switchboard');
        }

        // If an Airport was requested, but the user does not have permission to view this Airport, trap and error
        if ( selectedAirportID && !userCanReadAirport ) {
            // Log the error
            logEventResult = await genericFx.logEvent('Content Access', `AIS Airport Data: ${ selectedAirportID }`, 922,
               'Failure', 'User not authorized to view airport data', 0, 0, currentUserID, '');
            // Redirect the user to the main switchboard
            res.redirect('/switchboard');
        } else {
            // User can see the requested Airport, log the access
            logEventResult = await genericFx.logEvent('Content Access', `AIS Airport Data: ${ selectedAirportID }`, 920,
                'Success', '', 0, 0, currentUserID, '');
        };

        // Get the matching airports for "Search Engine" DDL options
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
// TODO (Phase 2)     // Limit the matching Airports to those authorized for the Current User


            
            // Process all matching airports
            matchingAirportsCount = matchingAirports.count;
            if ( matchingAirports.count === 1 && selectedAirportID === "" ) { // if only one matching airport, and no specific airport requested, default to that airport
                res.redirect('/switchboard?airportid=' + matchingAirports.rows[0].LFLocationID_FAA +
                    '&aiscontenttype=801001' + 
                    '&searchairportid=' + searchAirportID +
                    '&searchairportname=' + searchAirportName);
            };
            console.log(`matching Airports: ${matchingAirports.count}`);
            console.log(`matchingAirportID: ${selectedAirportID}`);
        };
        
        // If a specific airport was requested, process it
        if ( selectedAirportID !== "" ) {  // a requested aiport was submitted (and validated)
//            matchingAirports = await AirportsCurrent.findAndCountAll({ 
//                where: { LFLocationID_FAA: selectedAirportID.toUpperCase() }
//            });
//            selectedAirport = matchingAirports.rows[0];
//            matchingAirportsCount = 1;
            selectedAirport = airportDetails[0];
            actionRequested = 'editairport';
        };
        console.log(`selectedAirportID: ${selectedAirportID}`);
        console.log(`selectedAirport: ${selectedAirport}`);


        ////////////////////////////////////////////////////
        //  Website User Data Permissions / Details (DDL, Add User, Default User, etc.)
        ////////////////////////////////////////////////////
        const { userCanReadUsers, userCanCreateUsers, usersAllowedDDL, userID, userDetails, doesUserExist,
            userCanReadUser, userCanUpdateUser, userCanDeleteUser
        } = await genericFx.getUserPermissionsForWebsiteUser( userPermissionsActive, userIDRequested );

        // Does the User have access to the Users DDL?
        if ( userCanReadUsers ) {

            // Does the requested User exist (if requested)?  If not, skip error processing
            console.log(`doesUserExist: (${doesUserExist})`);
            if ( !doesUserExist ) {  // User ID does not exist
                errorCode = 928;  // Unknown User
                // Log the event
                logEventResult = await genericFx.logEvent('User Access', `Website User: ${ userIDRequested }`, errorCode,
                    'Failure', 'UserID does not exist', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
                });
            };

            // Does the User have permission to see/edit/delete this User?
            if ( !userCanReadUser ) { // Current User does not have permission to read User's data - trap and log error
                errorCode = 929;  // Unknown User
                // Log the error
                logEventResult = await genericFx.logEvent('Website User Access', `Website User: ${ userIDRequested }`, errorCode,
                   'Failure', 'User not authorized to view website user data', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
                });
            } else {
                // Log the access
                logEventResult = await genericFx.logEvent('Content Access', `Website User: ${ userIDRequested }`, 930,
                    'Success', '', 0, 0, currentUserID, '');
            };
        };


        ////////////////////////////////////////////////////
        //  Website User Permissions Permissions / Details (DDL, Add Permission, Default Permission, etc.)
        ////////////////////////////////////////////////////
        const { userCanReadUserPermissions, userCanCreateUserPermissions, userPermissionsAllowedDDL,
            userPermissionID, userPermissionDetails, doesUserPermissionExist,
            userCanReadUserPermission, userCanUpdateUserPermission, userCanDeleteUserPermission
        } = await genericFx.getUserPermissionsForWebsiteUserPermission( userPermissionsActive, userID, userPermissionIDRequested );

        // Does the User have access to the User Permissions DDL?
        if ( userCanReadUserPermissions ) {

            // Does the requested User Permission exist (if requested)?  If not, skip error processing
            console.log(`doesUserPermissionExist: (${doesUserPermissionExist})`);
            if ( !doesUserPermissionExist ) {  // User ID does not exist
                errorCode = 938;  // Unknown User Permission
                // Log the event
                logEventResult = await genericFx.logEvent('User Permission Access', `Website User Permission: ${ userPermissionIDRequested }`, errorCode,
                    'Failure', 'UserPermissionID does not exist', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
                });
            };

            // Does the User have permission to see/edit/delete this User Permission?
            if ( !userCanReadUserPermission ) { // Current User does not have permission to read Website User's Permission data - trap and log error
                errorCode = 939;  // Unknown User
                // Log the error
                logEventResult = await genericFx.logEvent('Website User Permission Access', `Website User Permission: ${ userPermissionIDRequested }`, errorCode,
                   'Failure', 'User not authorized to view website user permission data', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
                });
            } else {
                // Log the access
                logEventResult = await genericFx.logEvent('Content Access', `Website User Permission: ${ userPermissionIDRequested }`, 931,
                    'Success', '', 0, 0, currentUserID, '');
            };
        };


        ////////////////////////////////////////////////////
        // Retrieve options for add/edit form DDLs
        ////////////////////////////////////////////////////

        // AIS Search Engine DDLs
        if ( userCanReadAISMenu ) {
            nationalRegionsDDL = await NationalRegions.findAndCountAll({});
            aisContentTypeCategoriesDDL = await AISContentTypeCategories.findAndCountAll({});
        };
        // General Information (GIAI CRUD Form)
        let lfOwnerTypeCategoriesDDL = await LFOwnerTypeCategories.findAndCountAll({});

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
//            userCanCreateAirports,
            userCanReadUsers,
            userCanCreateUsers,
            usersAllowedDDL,
            userID,
            userCanReadUserPermissions,
            userCanCreateUserPermissions,
            userPermissionsAllowedDDL,
            userPermissionID,
            // Search criteria
            searchAirportID,
            searchAirportName,
            searchAirportCity,
            searchAirportNationalRegion,
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
// "PUT" Routes (Update data)
////////////////////////////////////////

/////////////////////////
// AIS - GI - Airport/Sponsor Info
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
// AIS - GI - Governing/Advisory Body Info
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
// AIS - GI - Operator/Manager Info
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

/////////////////////////
// AIS - GI - Location/Classification Information
/////////////////////////
router.put('/airportupdategilc', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
// ToDo:  Verify airport ID !
    const airportRecord = await AirportsTable.findOne( {
        where: { LFLocationID: req.body.airportIDToUpdate }
    });
    console.log(`airportIDToUpdate: ${airportRecord.LFLocationID}`)

    // Update the database record with the new data
    await airportRecord.update( {
        LFLocationNotes: req.body.locationNotes,
        LFSystemAirport: req.body.systemAirport,
        LFSystemAirportIDs: req.body.systemAirportIDs,
        LFCompsEffectiveDate: req.body.compsEffectiveDate,
        LFComparablesIDs: req.body.comparables,
        LFCompetitivesIDs: req.body.competitives,
        LFClassificationNotes: req.body.classificationNotes
    }).then( () => {
        res.redirect(`/switchboard?airportid=${airportRecord.LFLocationID}` +
                     `&status=airportupdatesuccess` +
                     `&aiscontenttype=801004`);
    });
});


////////////////////////////////////////
// Return all routes
////////////////////////////////////////

module.exports = router;