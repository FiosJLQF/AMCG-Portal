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
const amcgFx = require('../scripts/amcg_fx_server');
const commonFx = require('../scripts/common_fx_server');
const { check, validationResult, body } = require('express-validator');
const htmlEntities = require('html-entities');







///////////////////////////////////////////////////////////////////////////////////
// Data Models
///////////////////////////////////////////////////////////////////////////////////
const { AirportsTable, AirportsCurrent, AISContentTypeCategories, LFOwnerTypeCategories,
        NationalRegions, FuelStorageConditionCategories, FuelStorageUnitsAll
    } = require('../models/sequelize_portal.js');
const { UsersTable, UsersAllView,
        UserPermissionsTable, UserPermissionsActive, UserPermissionsAllView, UserPermissionCategoriesAllDDL
    } = require('../models/sequelize_common.js');


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
//        const logResult = commonFx.createLogEntry(10001, req.oidc.user.email);
        console.log('New User!');
        return res.render('switchboard_newuser', {
            user: req.oidc.user,
            userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
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
        const actionRequestedValues = [
            'editairport', 'adduser', 'edituser', 'adduserpermission', 'edituserpermission'
        ];
        let statusMessage = '';
        let logEventResult = '';
        // Current User variables
        let currentUserProfile = [];
        let currentUserID = 0;
        let userIsDataAdmin = false;
        // Querystring parameters
        let actionRequested = '';
        let matchingAirports = []; // array of all matching airports
        // SELECT object options
        let nationalRegionsDDL = []; // list of all options for the State/Province/Territory/etc SELECT object
        let aisContentTypeCategoriesDDL = []; // list of all AIS Content Type Categories for the SELECT object
        let userPermissionsCategoriesAllDLL = []; // list of all User Permissions Categories for the SELECT object
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
        // Airport Data Mgmt DDLs
        let lfOwnerTypeCategoriesDDL = []; // Owner Types for DDL
        let fuelStorageUnits = [] // Fuel Storage Units list for listbox
        let fuelStorageConditionCategoriesDDL = []; // Fuel Storage Unit Conditions for DDL

// Test
console.log('Before sending test email.');
let emailResult = await commonFx.sendEmail('justjlqf@mail.com', 'Test Email - Switchboard Route',
   'This is a test email from the AMCG switchboard.', 'This is a test email from the AMCG switchboard.');
console.log(`emailResult: ${emailResult}`);
console.log('After sending test email.');
//Test
//let logEventResult = await commonFx.logEvent('Switchboard Test', 'Log Test Event', 0, 'Success', 'Test Event Logged',
//0, 0, 0, 'justjlqf@mail.com');

        ////////////////////////////////////////////////////
        // Get the current user's profile and permissions
        ////////////////////////////////////////////////////
        currentUserProfile = await UsersAllView.findAndCountAll( { where: { Username: req.oidc.user.email }});

        // Does the user profile exist?  If not, add the basic account information.
        if ( currentUserProfile.count == 0 ) {  // The new user has not yet been set up
            const { errorCode, newUserID } = await commonFx.checkForNewUser( req.oidc.user.email );
            if ( errorCode !== 0 ) { // If an error was raised during the New User configuration, redirect the user
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            } else { // New User was successfully created, so redirect to the New User Data Mgmt screen
                res.redirect(`/switchboard?userid=${newUserID}` +
                    `&status=usercreatesuccess` +
                    `&actionrequested=edituser`);
            };
        }; // END: Does the User Profile exist?

        // Current User exists and is configured; continue processing
        currentUserID = currentUserProfile.rows[0].UserID;
        // Log the access by the Current User
        logEventResult = await commonFx.logEvent('Page Access', 'Switchboard', 900, 'Informational', 'User Accessed Page',
            0, 0, currentUserID, '');






        // Get the list of active permissions for the user
// TODO: Replace with "commonFx.checkUserPermission()"" function calls
        const userPermissionsActive = await UserPermissionsActive.findAndCountAll( { where: { UserID: currentUserID }});




        // Check to see if the current User is a "Data Admin" (AMCG web manager)
        userIsDataAdmin = await commonFx.checkUserPermission(currentUserID, '923010', 'CanRead');


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
                    logEventResult = await commonFx.logEvent('Airport ID Validation', '', 908, 'Failure',
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
                    logEventResult = await commonFx.logEvent('Airport Name Validation', '', 909, 'Failure',
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
                    logEventResult = await commonFx.logEvent('Airport City Validation', '', 912, 'Failure',
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
                    logEventResult = await commonFx.logEvent('Airport National Region Validation', '', 913, 'Failure',
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
                    logEventResult = await commonFx.logEvent('Airport ID Validation', '', 914, 'Failure',
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
                    logEventResult = await commonFx.logEvent('AIS Content Type Validation', '', 915, 'Failure',
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
        
        // Validate the "action requested", if present
        if ( req.query['actionrequested'] != undefined ) {
            if ( actionRequestedValues.indexOf(req.query['actionrequested']) > -1 ) {
                actionRequested = req.query['actionrequested'];
            } else {
                errorCode = 948; // Invalid, missing or non-existant "action requested"
                // Log the event
                logEventResult = await commonFx.logEvent('Action Requested Validation', '', 0, 'Failure',
                    `Action Requested is not valid (${req.query['actionrequested']})`,
                    0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // redirect the user to the error screen
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            };
        };

        // Validate the "Requested Website User ID" parameter, if present
        if ( req.query['userid'] != undefined ) {
            userIDRequested = Number(req.query['userid']);
            if ( userIDRequested == 0 || userIDRequested === '' || Number.isNaN(userIDRequested)) {
                errorCode = 910; // Invalid, missing or non-existent UserID
                // Log the event
                logEventResult = await commonFx.logEvent('UserID Validation', '', 0, 'Failure',
                    `UserID is not a valid format (${req.query['userid']})`,
                    0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Redirect the user to the error screen
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            } else {  // Value is in a valid format; check to see if it exists in the database
                let doesUserIDExist = await UsersAllView.findAndCountAll( { where: { UserID: userIDRequested } } );
                if ( doesUserIDExist.count == 0 ) {
                    errorCode = 910; // Non-existant UserID
                    // Log the event
                    logEventResult = await commonFx.logEvent('UserID Validation', '', 0, 'Failure',
                        `UserID does not exist (${req.query['userid']})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Redirect the user to the error screen
                    return res.render( 'error', {
                        errorCode: errorCode,
                        userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                    });
                };
            };
        };
                
        // If a requested "userpermissionid" is blank, zero or not a number, redirect to the generic Switchboard page
        if ( req.query['userpermissionid'] != undefined ) {  // If the querystring variable exists, check its format
            userPermissionIDRequested = Number(req.query['userpermissionid']);
            if ( userPermissionIDRequested == 0 || userPermissionIDRequested === '' || Number.isNaN(userPermissionIDRequested)) {
                errorCode = 911; // Invalid, missing or non-existent UserPermissionID
                // Log the event
                logEventResult = await commonFx.logEvent('UserPermissionID Validation', '', 0, 'Failure',
                    `UserPermissionID is not a valid format (${req.query['userpermissionid']})`,
                    0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Redirect the user to the error screen
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            } else {  // Value is in a valid format; check to see if it exists in the database
                let doesUserPermissionIDExist = await UserPermissionsAllView.findAndCountAll( { where: { WebsiteUserPermissionID: userPermissionIDRequested } } );
                if ( doesUserPermissionIDExist.count == 0 ) {
                    errorCode = 911; // Non-existant UserPermissionID
                    // Log the event
                    logEventResult = await commonFx.logEvent('UserPermissionID Validation', '', 0, 'Failure',
                        `UserPermissionID does not exist (${req.query['userpermissionid']})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Redirect the user to the error screen
                    return res.render( 'error', {
                        errorCode: errorCode,
                        userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                    });
                };
            };
        };
                
        // Validate the "Status" parameter, if present
        if ( req.query['status'] != undefined ) {
            if ( req.query['status'] === 'airportupdatesuccess' ) {
                statusMessage = 'Airport was updated.';
            } else if ( req.query['status'] === 'usercreatesuccess' ) {
                statusMessage = 'User was created.';
            } else if ( req.query['status'] === 'userupdatesuccess' ) {
                statusMessage = 'User was updated.';
            } else if ( req.query['status'] === 'userdeletesuccess' ) {
                statusMessage = 'User was deleted.';
            } else {
                statusMessage = '';
                // Log the event
                logEventResult = await commonFx.logEvent('Status Message ID Validation', '', 916, 'Failure',
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
            logEventResult = await commonFx.logEvent('Content Access', `AIS Airport Data: ${ selectedAirportID }`, 921,
               'Failure', 'Requested airport does not exist.', 0, 0, currentUserID, '');
            // Redirect the user to the main switchboard
            res.redirect('/switchboard');
        }

        // If an Airport was requested, but the user does not have permission to view this Airport, trap and error
        if ( selectedAirportID && !userCanReadAirport ) {
            // Log the error
            logEventResult = await commonFx.logEvent('Content Access', `AIS Airport Data: ${ selectedAirportID }`, 922,
               'Failure', 'User not authorized to view airport data', 0, 0, currentUserID, '');
            // Redirect the user to the main switchboard
            res.redirect('/switchboard');
        } else {
            // User can see the requested Airport, log the access
            logEventResult = await commonFx.logEvent('Content Access', `AIS Airport Data: ${ selectedAirportID }`, 920,
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
        const { userCanReadUsersDDL, userCanCreateUsers, usersAllowedDDL,
                userDetails, doesUserExist,
                userCanReadUser, userCanUpdateUser, userCanDeleteUser
        } = await commonFx.getWebsiteUserPermissionsForCurrentUser( currentUserID, userIDRequested );

        // Does the Current User have access to the Users DDL?
        if ( userCanReadUsersDDL && userIDRequested.toString().length > 0 ) {

            // Does the requested User exist (if requested)?  If not, skip error processing
            console.log(`doesUserExist: (${doesUserExist})`);
            if ( !doesUserExist ) {  // User ID does not exist
                errorCode = 928;  // Unknown User
                // Log the event
                logEventResult = await commonFx.logEvent('User ID Validation', `Website User: ${ userIDRequested }`, errorCode,
                    'Failure', 'UserID does not exist', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            };

            // Does the Current User have permission to see/edit/delete this User?
            if ( !userCanReadUser ) { // Current User does not have permission to read User's data - trap and log error
                errorCode = 929;  // Unknown User
                // Log the error
                logEventResult = await commonFx.logEvent('Website User Access', `Website User: ${ userIDRequested }`, errorCode,
                   'Failure', 'User not authorized to view website user data', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            } else {
                // Log the access
                logEventResult = await commonFx.logEvent('Content Access', `Website User: ${ userIDRequested }`, 930,
                    'Success', '', 0, 0, currentUserID, '');
            };
        };


        ////////////////////////////////////////////////////
        //  Website User Permissions Permissions / Details (DDL, Add Permission, Default Permission, etc.)
        ////////////////////////////////////////////////////
        console.log(`Checking Website User Permission Permissions for Current User (${currentUserID})`);
        const { userCanReadUserPermissionsDDL, userCanCreateUserPermissions, userPermissionsAllowedDDL,
                userPermissionDetails, doesUserPermissionExist,
                userCanReadUserPermission, userCanUpdateUserPermission, userCanDeleteUserPermission
        } = await commonFx.getWebsiteUserPermissionPermissionsForCurrentUser( currentUserID, userPermissionIDRequested );

console.log(`userCanReadUserPermissionsDDL: ${userCanReadUserPermissionsDDL}`);
console.log(`userPermissionIDRequested: ${userPermissionIDRequested}`);

        // Does the User have access to the User Permissions DDL?
        if ( userCanReadUserPermissionsDDL  && userPermissionIDRequested.toString().length > 0 ) {

            // Does the requested User Permission exist (if requested)?  If not, skip error processing
            console.log(`doesUserPermissionExist: (${doesUserPermissionExist})`);
            if ( !doesUserPermissionExist ) {  // User ID does not exist
                errorCode = 938;  // Unknown User Permission
                // Log the event
                logEventResult = await commonFx.logEvent('User Permission Access', `Website User Permission: ${ userPermissionIDRequested }`,
                     errorCode, 'Failure', 'UserPermissionID does not exist', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            };

            // Does the User have permission to see/edit/delete this User Permission?
            if ( !userCanReadUserPermission ) { // Current User does not have permission to read Website User's Permission data - trap and log error
                errorCode = 939;  // Unknown User
                // Log the error
                logEventResult = await commonFx.logEvent('Website User Permission Access', `Website User Permission: ${ userPermissionIDRequested }`, errorCode,
                   'Failure', 'User not authorized to view website user permission data', 0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                // Raise an error
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                });
            } else {
                // Log the access
                logEventResult = await commonFx.logEvent('Content Access', `Website User Permission: ${ userPermissionIDRequested }`, 931,
                    'Success', '', 0, 0, currentUserID, '');
            };

            // Re-assign the "User ID Requested" to the user assigned to the user permission requested
            userIDRequested = userPermissionDetails[0].UserID;
            console.log(`User Permission User ID: ${userIDRequested}`);
        };


        ////////////////////////////////////////////////////
        // Retrieve options lists for data mgmt form DDLs
        ////////////////////////////////////////////////////

        // AIS Search Engine DDLs
        if ( userCanReadAISMenu ) {
            nationalRegionsDDL = await NationalRegions.findAndCountAll({});
            aisContentTypeCategoriesDDL = await AISContentTypeCategories.findAndCountAll({});
        };

        // CRUD Forms - AIS
        switch (selectedAISContentType) {
            case 'ais_giai': // General Information - Airport Information
                lfOwnerTypeCategoriesDDL = await LFOwnerTypeCategories.findAndCountAll({});
                break;
            case 'ais_infs': // Infrastructure - Fuel Storage Units
                fuelStorageUnits = await FuelStorageUnitsAll.findAndCountAll({
                    where: { LFLocationID: searchAirportID } });
                fuelStorageConditionCategoriesDDL = await FuelStorageConditionCategories.findAndCountAll({});
                console.log(`fuelStorageUnits for ${searchAirportID}: ${fuelStorageUnits.count}`);
                break;
        };

        // CRUD Forms - Data Management
        switch (actionRequested) {
            case 'adduserpermission': // "OR" the next condition
            case 'edituserpermission':
                userPermissionsCategoriesAllDLL = await UserPermissionCategoriesAllDDL.findAndCountAll({});
                break;
        }


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
            userName: ( req.oidc.user == null ? '' : req.oidc.user.email ),
            currentUserID,
            userIsDataAdmin,
            // Menu item permissions
            userCanReadAISMenu,
            userCanReadAirports,
            userCanReadUsersDDL,
            userCanCreateUsers,
            usersAllowedDDL,
            userCanReadUserPermissionsDDL,
            userCanCreateUserPermissions,
            userPermissionsAllowedDDL,
//            userPermissionID,
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
            fuelStorageUnits,
            fuelStorageConditionCategoriesDDL,
            // Airport CRUD Information
            airportID, // Used???
            // Website User CRUD Information
            userIDRequested,
            userDetails,
            userCanReadUser,
            userCanUpdateUser,
            userCanDeleteUser,
            // Website User Permission CRUD Information
            userPermissionsCategoriesAllDLL,
            userPermissionIDRequested,
            userPermissionDetails,
            userCanReadUserPermission,
            userCanUpdateUserPermission,
            userCanDeleteUserPermission
        });
    } catch(err) {
        console.log('Error:' + err);
    }
});


////////////////////////////////////////////////////////////
// "POST" Routes (Add new data records)
////////////////////////////////////////////////////////////

///////////////////////////////
// User (Insert)
///////////////////////////////
router.post('/useradd', requiresAuth(),
    [
        check('userLoginName')
            .isLength( { min: 3, max: 100 } ).withMessage('User Login Name should be 3 to 100 characters.')
    ],

    async (req, res) => {

    // Validate the input
    const validationErrors = validationResult(req);

    // If invalid data, return errors to client
    if ( !validationErrors.isEmpty() ) {

// ToDo:  Replicate the GET render code above, including parameters prep work

        return res.status(400).json(validationErrors.array());







    } else {
        // Add the new data to the database in a new record, and return the newly-generated [UserID] value
        const newUser = new UsersTable( {
            Username: req.body.userLoginName,
            UserFName: req.body.userFName,
            UserLName: req.body.userLName,
            UserTelephone: req.body.userTelephone
        });
        await newUser.save();

// ToDo:  If insert successful, add basic permissions for new User

        res.redirect(`/switchboard?userid=${newUser.UserID}` +
                     `&status=usercreatesuccess` +
                     `&actionrequested=edituser`);
    };
});

///////////////////////////////
// User Permission (Insert)
///////////////////////////////
router.post('/userpermissionadd', requiresAuth(),
[
    check('permissionValues')
        .isLength( { min: 1, max: 100 } ).withMessage('Limiting Values should be 1 to 100 characters.')
],

    async (req, res) => {

    // Reformat checkboxes to boolean values to be updated into Postgres
    let CanRead = (req.body.canRead === "CanRead") ? true : false;
    let CanUpdate = (req.body.canUpdate === "CanUpdate") ? true : false;
    let CanDelete = (req.body.canDelete === "CanDelete") ? true : false;
    let CanCreate = (req.body.canCreate === "CanCreate") ? true : false;

    // Reformat blank dates and numbers to NULL values to be updated into Postgres
    let EffectiveDate = (req.body.effectiveDate === "") ? null : req.body.effectiveDate;
    let ExpirationDate = (req.body.expirationDate === "") ? null : req.body.expirationDate;

    // Validate the input
    const validationErrors = validationResult(req);

    // If invalid data, return errors to client
    if ( !validationErrors.isEmpty() ) {

// ToDo:  Replicate the GET render code above, including parameters prep work


        return res.status(400).json(validationErrors.array());







    } else {
        // Add the new data to the database in a new record, and return the newly-generated [WebsiteUserPermissionID] value
        console.log(`userID to save user permission: ${req.body.userID}`);
        const newUserPermission = new UserPermissionsTable( {
            UserID: req.body.userID,
            PermissionCategoryID: req.body.permissionCategory,
            ObjectValues: req.body.permissionValues,
            CanCreate: CanCreate,
            CanRead: CanRead,
            CanUpdate: CanUpdate,
            CanDelete: CanDelete,
            EffectiveDate: EffectiveDate,
            ExpirationDate: ExpirationDate,
            });
        await newUserPermission.save();

// ToDo:  Error Checking
        res.redirect(`/switchboard?userpermissionid=${newUserPermission.WebsiteUserPermissionID}` +
                     `&status=userpermissioncreatesuccess` +
                     `&actionrequested=edituserpermission` +
                     `&userid=${req.body.userID}`);
    };
});


////////////////////////////////////////
// "PUT" Routes (Update data)
////////////////////////////////////////

/////////////////////////
// AIS - General Information - Airport/Sponsor Info
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
// AIS - General Information - Governing/Advisory Body Info
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
// AIS - General Information - Operator/Manager Info
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
// AIS - General Information - Location/Classification Information
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

/////////////////////////
// AIS - Infrastructure - Land/Security Information
/////////////////////////
router.put('/airportupdateinli', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
// ToDo:  Verify airport ID !
    const airportRecord = await AirportsTable.findOne( {
        where: { LFLocationID: req.body.airportIDToUpdate }
    }).catch(function (err) {
        console.log(`INLI findOne Error: ${err}`);
    });
    console.log(`INLI airportIDToUpdate: ${airportRecord.LFLocationID}`);
    console.log(`INLI landNotes (new): ${req.body.landNotes}`);

    // Update the database record with the new data
    await airportRecord.update( {
        LFLandNotes: req.body.landNotes,
        LFSecurityFence: req.body.perimeterFencing,
        LFSecurityControlledAccess: req.body.controlledAccess,
        LFSecurityCCTV: req.body.cctv,
        LFSecurityPersonnel: req.body.securityPersonnel,
        LFSecurityUserDefined: req.body.userDefined,
        LFSecurityNotes: req.body.securityNotes
    }).then( () => {
        res.redirect(`/switchboard?airportid=${airportRecord.LFLocationID}` +
                     `&status=airportupdatesuccess` +
                     `&aiscontenttype=801005`);
    });
});


///////////////////////////////
// User (Update)
///////////////////////////////
router.put('/userupdate', requiresAuth(), async (req, res) => {

    //ToDo: Add server-side verification
    
        // Get a pointer to the current record
        const userRecord = await UsersTable.findOne( {
            where: { UserID: req.body.userIDToUpdate }
        });
    
        // Update the database record with the new data
        await userRecord.update( {
            Username: req.body.userLoginName,
            UserFName: req.body.userFName,
            UserLName: req.body.userLName,
            UserTelephone: req.body.userTelephone
        }).then( () => {
            res.redirect(`/switchboard?userid=${userRecord.UserID}` +
                         `&status=userupdatesuccess` +
                         `&actionrequested=edituser`);
        });
    });

    ///////////////////////////////
// User Permission (Update)
///////////////////////////////
router.put('/userpermissionupdate', requiresAuth(), async (req, res) => {

//ToDo: Add server-side verification
    
    // Reformat checkboxes to boolean values to be updated into Postgres
    let CanRead = (req.body.canRead === "CanRead") ? true : false;
    let CanUpdate = (req.body.canUpdate === "CanUpdate") ? true : false;
    let CanDelete = (req.body.canDelete === "CanDelete") ? true : false;
    let CanCreate = (req.body.canCreate === "CanCreate") ? true : false;
    
    // Reformat blank dates and numbers to NULL values to be updated into Postgres
    let EffectiveDate = (req.body.effectiveDate === "") ? null : req.body.effectiveDate;
    let ExpirationDate = (req.body.expirationDate === "") ? null : req.body.expirationDate;
    
    // Validate the input
//    const validationErrors = validationResult(req);
    
    // If invalid data, return errors to client
//    if ( !validationErrors.isEmpty() ) {
    
// ToDo:  Replicate the GET render code above, including parameters prep work
    
    
//        return res.status(400).json(validationErrors.array());
    
    //    } else {
    
        // Get a pointer to the current record
        const userPermissionRecord = await UserPermissionsTable.findOne( {
            where: { WebsiteUserPermissionID: req.body.userPermissionIDToUpdate }
        });
    
        // Update the database record with the new data
        await userPermissionRecord.update( {
            ObjectValues: req.body.permissionValues,
            CanCreate: CanCreate,
            CanRead: CanRead,
            CanUpdate: CanUpdate,
            CanDelete: CanDelete,
            EffectiveDate: EffectiveDate,
            ExpirationDate: ExpirationDate,
        }).then( () => {
            res.redirect(`/switchboard?userpermissionid=${userPermissionRecord.WebsiteUserPermissionID}` +
                         `&userid=${userPermissionRecord.UserID}` +
                         `&status=userpermissionupdatesuccess` +
                         `&actionrequested=edituserpermission`);
        });
//    };
});
    
    
////////////////////////////////////////////////////////////
// "DELETE" Routes (Delete data)
////////////////////////////////////////////////////////////

///////////////////////////////
// User (Delete)
///////////////////////////////
router.delete('/userdelete', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
    const userRecord = await UsersTable.findOne( {
        where: { UserID: req.body.userIDToDelete }
    });

    // Delete the record, based on the User ID
    await userRecord.destroy().then( () => {
        res.redirect(`/switchboard?status=userdeletesuccess`);
    });
});

///////////////////////////////
// User Permission (Delete)
///////////////////////////////
router.delete('/userpermissiondelete', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
    console.log(`body.userPermissionIDToDelete: ${req.body.userPermissionIDToDelete}`);
    const userPermissionRecord = await UserPermissionsTable.findOne( {
        where: { WebsiteUserPermissionID: req.body.userPermissionIDToDelete }
    });
    console.log(`userPermissionRecord: ${userPermissionRecord.WebsiteUserPermissionID}`);

    // Delete the record
    console.log(`userID to redirect to after user permission deletion: ${req.body.userIDOfPermission}`)
    await userPermissionRecord.destroy().then( () => {
        res.redirect(`/switchboard?status=userpermissiondeletesuccess` +
                     `&userid=${req.body.userIDOfPermission}`);
    });
});

    
////////////////////////////////////////
// Return all routes
////////////////////////////////////////

module.exports = router;