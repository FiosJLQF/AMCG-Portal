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


///////////////////////////////////////////////////////////////////////////////////
// Data Models
///////////////////////////////////////////////////////////////////////////////////
const { AirportsTable, AirportsCurrent, AirportsHx, AISContentTypeCategories, LFOwnerTypeCategories,
        NationalRegions, FuelStorageConditionCategories, FuelStorageTypeCategories, FuelStorageFuelGradeCategories,
        FuelStorageUnitsAll, FuelStorageUnitsTable, RunwaysCurrent
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
    let currentUserProfile = '';

    try {

        // Retrieve the user's ID
        currentUserProfile = await UsersAllView.findAndCountAll( { where: { Username: req.oidc.user.email }});

        // Log the request (10001 = "New User Page Redirect")
        console.log('New User!');
        console.log(`UserID: ${currentUserProfile.rows[0].UserID}`);
        return res.render('switchboard_newuser', {
            user: req.oidc.user,
            userID: currentUserProfile.rows[0].UserID,
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
            'adduser', 'edituser', 'adduserpermission', 'edituserpermission', 'addfuelstorageunit', 'editfuelstorageunit'
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
        let fuelStorageUnitIDRequested = '';
//        let fuelStorageUnitIDExists = false;
        let fuelStorageUnitSelected = [];
        let runwayIDRequested = '';
        let runwaySelected = [];
        // Airport Data Mgmt DDLs and ExtHx Listboxs
        let lfOwnerTypeCategoriesDDL = [];
        let fuelStorageUnits = [];
        let fuelStorageConditionCategoriesDDL = [];
        let fuelStorageTypeCategoriesDDL = [];
        let fuelStorageFuelGradeCategoriesDDL = [];
        let runways = [];
        // Airport Data Mgmt ExtHx Listboxs
        let lfAirportNameHx = [];
        let lfAirportAddressHx = [];
        let lfAirportAddressCSZHx = [];
        let lfOwnerNameHx = [];
        let lfOwnerAddressHx = [];
        let lfOwnerAddressCSZHx = [];
        let lfOwnerPhoneHx = [];
        let lfMgrNameHx = [];
        let lfMgrAddressHx = [];
        let lfMgrAddressCSZHx = [];
        let lfMgrPhoneHx = [];
        let lfLatitudeHx = [];
        let lfLongitudeHx = [];
        let lfElevationHx = [];
        let lfAeroSectionalChartHx = [];
        let lfFAARegionCodeDescHx = [];
        let lfFAADistrictCodeHx = [];
        let lfOwnershipTypeDescHx = [];
        let lfFacilityUseDescHx = [];
        let lfLongestRunwayCategoryHx = [];
        let lfAirportServiceLevelDescHx = [];
        let lfHubClassificationDescHx = [];
        let lfGACategoryHx = [];
        let lfAcreageHx = [];
        let lfLandSFHx = [];

/*
    // Email Test Block - only needed if email carrier or configuration/library changes
    console.log('Before sending test email.');
    let emailResult = await commonFx.sendEmail(process.env.EMAIL_WEBMASTER_LIST, 'Test Email - Switchboard Route',
       'This is a test email from the AMCG switchboard.', 'This is a test email from the AMCG switchboard.');
    console.log(`emailResult: ${emailResult}`);
    console.log('After sending test email.');
    //Test
    logEventResult = await commonFx.logEvent('Switchboard Test', 'Log Test Event', 0, 'Success', 'Test Event Logged',
        0, 0, 0, process.env.EMAIL_WEBMASTER_LIST);
*/

        console.log(`URL requested: ${req.originalUrl}`);
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
        // Check to see if the current User is a "Data Admin" (AMCG web manager)
        userIsDataAdmin = await commonFx.checkUserPermission(currentUserID, '923010', 'CanRead');


        ////////////////////////////////////////////////////
        // Validate any query string parameters
        //   - client-side validation already occurred before form submittal
        //   - this step only validates value formats for changes post-submittal (e.g., interception)
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
// TODO: How to restore data and show error to user?
                    res.redirect('/switchboard');
                };
            };
        };

        // Validate the "Airport Name" search parameter, if present
        if ( req.query['searchairportname'] !== undefined ) {
            searchAirportName = decodeURI(req.query['searchairportname']);
            console.log(`querystring['searchairportname']: ${searchAirportName}`);
            if ( searchAirportName !== '' ) {
                // validate the requested Airport Name
                if ( !/^[A-Za-z.'-\s]*$/.test(searchAirportName) ) {  // Airport Name contains invalid characters
                    // Log the event
                    logEventResult = await commonFx.logEvent('Airport Name Validation', '', 909, 'Failure',
                        `Airport Name contains invalid characters (${searchAirportName})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
// TODO: How to restore data and show error to user?
                    res.redirect('/switchboard');
                };
            };
        };

        // Validate the "Airport City" search parameter, if present
        if ( req.query['searchairportcity'] !== undefined ) {
            searchAirportCity = decodeURI(req.query['searchairportcity']);
            console.log(`querystring['searchairportcity']: ${searchAirportCity}`);
            if ( searchAirportCity !== '' ) {
                // validate the requested Airport City
                if ( !/^[A-Za-z.'-\s]*$/.test(searchAirportCity) ) {  // Airport City contains invalid characters
                    // Log the event
                    logEventResult = await commonFx.logEvent('Airport City Validation', '', 912, 'Failure',
                        `Airport City contains invalid characters (${searchAirportCity})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
// TODO: How to restore data and show error to user?
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
                if ( !/^[0-9]*$/.test(searchAirportNationalRegion) ) {  // Airport National Region contains invalid characters
                    // Log the event
                    logEventResult = await commonFx.logEvent('Airport National Region Validation', '', 913, 'Failure',
                        `Airport National Region contains invalid characters (${searchAirportNationalRegion})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
// TODO: How to restore data and show error to user?
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
// TODO: How to restore data and show error to user?
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
// TODO: How to restore data and show error to user?
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

        // Validate the "Fuel Storage Unit ID" search parameter, if present
        if ( req.query['fuelstorageunitid'] !== undefined ) {
            fuelStorageUnitIDRequested = req.query['fuelstorageunitid'].toUpperCase();
            console.log(`querystring['fuelstorageunitid']: ${fuelStorageUnitIDRequested}`);
            if ( fuelStorageUnitIDRequested !== '' ) {  // querystring is present
                if ( !/^[0-9]*$/.test(fuelStorageUnitIDRequested) ) {  // Airport ID contains invalid characters
                    // Log the event
                    logEventResult = await commonFx.logEvent('Fuel Storage Unit ID Validation', '', 908, 'Failure',
                        `Fuel Storage Unit ID contains invalid characters (${fuelStorageUnitIDRequested})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                } else {  // Value is in a valid format; check to see if it exists in the database
                    fuelStorageUnitSelected = await FuelStorageUnitsAll.findAndCountAll( { where: { RecordID: fuelStorageUnitIDRequested } } );
                    if ( fuelStorageUnitSelected.count == 0 ) {
                        errorCode = 941; // Non-existant ID
                        // Log the event
                        logEventResult = await commonFx.logEvent('FuelStorageUnitID Validation', '', 0, 'Failure',
                            `FuelStorageUnitID does not exist (${FuelStorageUnitID})`,
                            0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                        // Redirect the user to the error screen
                        return res.render( 'error', {
                            errorCode: errorCode,
                            userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                        });
                    };
                };
            };
        };

        // Validate the "Runway ID" search parameter, if present
//        console.log(`req.query['runwayid']: ${req.query['runwayid']}`);
        if ( req.query['runwayid'] !== undefined ) {
            runwayIDRequested = req.query['runwayid'].toUpperCase();
//            console.log(`querystring['runwayid']: ${runwayIDRequested}`);
            if ( runwayIDRequested !== '' ) {  // querystring is present
//                console.log(`runwaySelected.count (2-pre)`);
                if ( !/^[0-9]*$/.test(runwayIDRequested) ) {  // Runway ID contains invalid characters
                    // Log the event
                    logEventResult = await commonFx.logEvent('Runway ID Validation', '', 916, 'Failure',
                        `Runway ID contains invalid characters (${runwayIDRequested})`,
                        0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                    // Intercept this request to the generic switchboard page
                    res.redirect('/switchboard');
                } else {  // Value is in a valid format; check to see if it exists in the database
//                    console.log(`runwaySelected.count (1-pre)`);
                    runwaySelected = await RunwaysCurrent.findAndCountAll( { where: { RecordID: runwayIDRequested } } );
//                    console.log(`runwaySelected.count (1): ${runwaySelected.count}`);
                    if ( runwaySelected.count == 0 ) {
                        errorCode = 942; // Non-existant ID
                        // Log the event
                        logEventResult = await commonFx.logEvent('Runway ID Validation', '', 0, 'Failure',
                            `RunwayID does not exist (${runwayIDRequested})`,
                            0, 0, currentUserID, process.env.EMAIL_WEBMASTER_LIST);
                        // Redirect the user to the error screen
                        return res.render( 'error', {
                            errorCode: errorCode,
                            userName: ( req.oidc.user == null ? '' : req.oidc.user.email )
                        });
                    };
                };
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
            } else if ( req.query['status'] === 'fuelstorageunitupdatesuccess' ) {
                statusMessage = 'Fuel Storage Unit was updated.';
            } else if ( req.query['status'] === 'fuelstorageunitdeletesuccess' ) {
                statusMessage = 'Fuel Storage Unit was deleted.';
            } else if ( req.query['status'] === 'fuelstorageunitcreatesuccess' ) {
                statusMessage = 'Fuel Storage Unit was created.';
            } else if ( req.query['status'] === 'usercreatesuccess' ) {
                statusMessage = 'User was created.';
            } else if ( req.query['status'] === 'userupdatesuccess' ) {
                statusMessage = 'User was updated.';
            } else if ( req.query['status'] === 'userdeletesuccess' ) {
                statusMessage = 'User was deleted.';
            } else if ( req.query['status'] === 'userpermissioncreatesuccess' ) {
                statusMessage = 'User Permission was created.';
            } else if ( req.query['status'] === 'userpermissionupdatesuccess' ) {
                statusMessage = 'User Permission was updated.';
            } else if ( req.query['status'] === 'userpermissiondeletesuccess' ) {
                statusMessage = 'User Permission was deleted.';
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
        } = await amcgFx.getAISPermissionsForCurrentUser( currentUserID, selectedAirportID );

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
                    where: { LFNationalRegion_FAA: searchAirportNationalRegion }
                });
            } else if ( searchAirportNationalRegion !== '' && searchAirportCity !== '') {
                matchingAirports = await AirportsCurrent.findAndCountAll({
                    where: { LFCityName_FAA: { [Op.like]: '%' + searchAirportCity.toUpperCase() + '%' },
                             LFNationalRegion_FAA: searchAirportNationalRegion }
                });
            };


// TODO (Phase 2)     // Limit the matching Airports to those authorized for the Current User

            
            // Process all matching airports
            matchingAirportsCount = matchingAirports.count;
            if ( matchingAirports.count === 1 && selectedAirportID === "" ) { // if only one matching airport, and no specific airport requested, default to that airport
                res.redirect('/switchboard?airportid=' + matchingAirports.rows[0].LFLocationID_FAA +
                    '&aiscontenttype=801001' + 
                    '&searchairportid=' + searchAirportID +
                    '&searchairportname=' + req.query['searchairportname'] +
                    '&searchairportcity=' + req.query['searchairportcity'] +
                    '&searchairportnationalregion=' + searchAirportNationalRegion);
            };
        };
        
        // If a specific airport was requested, process it
        if ( selectedAirportID !== "" ) {  // a requested aiport was submitted (and validated)
            selectedAirport = airportDetails[0];
            if ( actionRequested == "" ) { // if no other action is requested, default to "edit airport"
                actionRequested = 'editairport';
            };
        };


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
        }; // END: Can the Current User see the Website Users' DDL?


        ////////////////////////////////////////////////////
        //  Website User Permissions Permissions / Details (DDL, Add Permission, Default Permission, etc.)
        ////////////////////////////////////////////////////
        const { userCanReadUserPermissionsDDL, userCanCreateUserPermissions, userPermissionsAllowedDDL,
                userPermissionDetails, doesUserPermissionExist,
                userCanReadUserPermission, userCanUpdateUserPermission, userCanDeleteUserPermission
        } = await commonFx.getWebsiteUserPermissionPermissionsForCurrentUser( currentUserID, userIDRequested, userPermissionIDRequested );

        // Does the User have access to the User Permissions DDL?
        if ( userCanReadUserPermissionsDDL && userIDRequested.length > 0 && userPermissionIDRequested.toString().length > 0 ) {

            // Does the requested User Permission exist (if requested)?  If not, skip error processing
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

        }; // END: Can the Current User see the User Permissions' DDL?


        ////////////////////////////////////////////////////
        // Retrieve options lists for data mgmt form DDLs and ExtHx lists
        ////////////////////////////////////////////////////

        // AIS Search Engine DDLs
        if ( userCanReadAISMenu ) {
            nationalRegionsDDL = await NationalRegions.findAndCountAll({});
            aisContentTypeCategoriesDDL = await AISContentTypeCategories.findAndCountAll({});
        };

        // CRUD Forms - AIS
        switch ( selectedAISContentType ) {

            case '801001': // General Information - Airport Information
                lfOwnerTypeCategoriesDDL = await LFOwnerTypeCategories.findAndCountAll({});
                lfAirportNameHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFName_FAA', 'optiontext'], ['LFName_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFName_FAA', 'DESC']]});
                lfAirportAddressHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFAddress_FAA', 'optiontext'], ['LFAddress_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFAddress_FAA', 'DESC']]});
                lfAirportAddressCSZHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFAddressCSZ_FAA', 'optiontext'], ['LFAddressCSZ_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFAddressCSZ_FAA', 'DESC']]});
                lfOwnerNameHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFOwnerName_FAA', 'optiontext'], ['LFOwnerName_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFOwnerName_FAA', 'DESC']]});
                lfOwnerAddressHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFOwnerAddress_FAA', 'optiontext'], ['LFOwnerAddress_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFOwnerAddress_FAA', 'DESC']]});
                lfOwnerAddressCSZHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFOwnerAddressCSZ_FAA', 'optiontext'], ['LFOwnerAddressCSZ_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFOwnerAddressCSZ_FAA', 'DESC']]});
                lfOwnerPhoneHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFOwnerPhone_FAA', 'optiontext'], ['LFOwnerPhone_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFOwnerPhone_FAA', 'DESC']]});
                break;

            case '801003': // Operator Information / Manager Information
                lfOwnerTypeCategoriesDDL = await LFOwnerTypeCategories.findAndCountAll({});
                lfMgrNameHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFMgrName_FAA', 'optiontext'], ['LFMgrName_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFMgrName_FAA', 'DESC']]});
                lfMgrAddressHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFMgrAddress_FAA', 'optiontext'], ['LFMgrAddress_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFMgrAddress_FAA', 'DESC']]});
                lfMgrAddressCSZHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFMgrAddressCSZ_FAA', 'optiontext'], ['LFMgrAddressCSZ_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFMgrAddressCSZ_FAA', 'DESC']]});
                lfMgrPhoneHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFMgrPhone_FAA', 'optiontext'], ['LFMgrPhone_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFMgrPhone_FAA', 'DESC']]});
                break;

            case '801004': // General - Location / Classification Information
                lfLatitudeHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFLatitude_FAA', 'optiontext'], ['LFLatitude_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFLatitude_FAA', 'DESC']]});
                lfLongitudeHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFLongitude_FAA', 'optiontext'], ['LFLongitude_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFLongitude_FAA', 'DESC']]});
                lfElevationHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFElevation_FAA', 'optiontext'], ['LFElevation_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFElevation_FAA', 'DESC']]});
                lfAeroSectionalChartHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFAeroSectionalChart_FAA', 'optiontext'], ['LFAeroSectionalChart_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFAeroSectionalChart_FAA', 'DESC']]});
                lfFAARegionCodeDescHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFFAARegionCodeDesc_FAA', 'optiontext'], ['LFFAARegionCodeDesc_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFFAARegionCodeDesc_FAA', 'DESC']]});
                lfFAADistrictCodeHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFFAADistrictCode_FAA', 'optiontext'], ['LFFAADistrictCode_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFFAADistrictCode_FAA', 'DESC']]});
                lfOwnershipTypeDescHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFOwnershipTypeDesc_FAA', 'optiontext'], ['LFOwnershipTypeDesc_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFOwnershipTypeDesc_FAA', 'DESC']]});
                lfFacilityUseDescHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFFacilityUseDesc_FAA', 'optiontext'], ['LFFacilityUseDesc_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFFacilityUseDesc_FAA', 'DESC']]});
                lfLongestRunwayCategoryHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFLongestRunwayCategory_FAA', 'optiontext'], ['LFLongestRunwayCategory_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFLongestRunwayCategory_FAA', 'DESC']]});
                lfAirportServiceLevelDescHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFServiceLevelDesc_NPIAS', 'optiontext'], ['LFServiceLevelDesc_NPIAS', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFServiceLevelDesc_NPIAS', 'DESC']]});
                lfHubClassificationDescHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFHubClassificationDesc_NPIAS', 'optiontext'], ['LFHubClassificationDesc_NPIAS', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFHubClassificationDesc_NPIAS', 'DESC']]});
                lfGACategoryHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFGACategory_NPIAS', 'optiontext'], ['LFGACategory_NPIAS', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFGACategory_NPIAS', 'DESC']]});
                break;

            case '801005': // Infrastructure - Land / Security Information
                lfAcreageHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFAcreage_FAA', 'optiontext'], ['LFAcreage_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFAcreage_FAA', 'DESC']]});
                lfLandSFHx = await AirportsHx.findAndCountAll({
                    attributes: [ ['LFLandSF_FAA', 'optiontext'], ['LFLandSF_FAA', 'optionid'] ],
                    where: { LFLocationID_FAA: searchAirportID },
                    order: [['LFLandSF_FAA', 'DESC']]});
                break;

            case '801006': // Infrastructure - Fuel Storage Units
                fuelStorageUnits = await FuelStorageUnitsAll.findAndCountAll({
                    where: { LFLocationID: searchAirportID },
                    order: [['optiontext', 'ASC']]});
                fuelStorageConditionCategoriesDDL = await FuelStorageConditionCategories.findAndCountAll({});
                fuelStorageTypeCategoriesDDL = await FuelStorageTypeCategories.findAndCountAll({});
                fuelStorageFuelGradeCategoriesDDL = await FuelStorageFuelGradeCategories.findAndCountAll({});
                console.log(`FSU actionrequested: ${actionRequested}; and FSU ID: ${req.query['fuelstorageunitid']}`);
                if ( req.query['fuelstorageunitid'] == undefined && actionRequested !== 'addfuelstorageunit') {
                    console.log('processing default FSU');
                    // no Fuel Storage Unit ID requested and a new Fuel Storage unit is not being added, default to the first
                    fuelStorageUnitSelected = fuelStorageUnits; // default to the first runway listed for the airport
                    fuelStorageUnitIDRequested = fuelStorageUnits.rows[0].RecordID;
                }
                console.log(`fuelStorageUnitSelected.count: ${fuelStorageUnitSelected.count}`);
                console.log(`fuelStorageUnitIDRequested: ${fuelStorageUnitIDRequested}`);
                break;

            case '801008': // Infrastructure - Runways
                runways = await RunwaysCurrent.findAndCountAll({
                    where: { LFLocationID: searchAirportID },
                    order: [['optiontext', 'ASC']]});
                if ( req.query['runwayid'] == undefined ) { // no Runway ID requested
                    runwaySelected = runways; // default to the first runway listed for the airport
                }
                console.log(`runwaySelected.count: ${runwaySelected.count}`);
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
            // QueryString Parameters Requested
            fuelStorageUnitIDRequested,
            // Data Mgmt DDLs
            lfOwnerTypeCategoriesDDL,
            fuelStorageUnits,
            fuelStorageUnitSelected,
            fuelStorageConditionCategoriesDDL,
            fuelStorageTypeCategoriesDDL,
            fuelStorageFuelGradeCategoriesDDL,
            runways,
            runwaySelected,
            // Data Mgmt Hx
            lfAirportNameHx,
            lfAirportAddressHx,
            lfAirportAddressCSZHx,
            lfOwnerNameHx,
            lfOwnerAddressHx,
            lfOwnerAddressCSZHx,
            lfOwnerPhoneHx,
            lfMgrNameHx,
            lfMgrAddressHx,
            lfMgrAddressCSZHx,
            lfMgrPhoneHx,
            lfLatitudeHx,
            lfLongitudeHx,
            lfElevationHx,
            lfAeroSectionalChartHx,
            lfFAARegionCodeDescHx,
            lfFAADistrictCodeHx,
            lfOwnershipTypeDescHx,
            lfFacilityUseDescHx,
            lfLongestRunwayCategoryHx,
            lfAirportServiceLevelDescHx,
            lfHubClassificationDescHx,
            lfGACategoryHx,
            lfAcreageHx,
            lfLandSFHx,
            // Airport CRUD Information
            airportID,
            // Website User CRUD Information
            userID: userIDRequested.toString(),
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
// Fuel Storage Unit (Insert)
///////////////////////////////
router.post('/fuelstorageunitadd', requiresAuth(),
    [
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
        const newFuelStorageUnit = new FuelStorageUnitsTable( {
            LFLocationID: req.body.airportIDForUpdate,
            FuelStorageConstructionDate: req.body.constructionDate,
            FuelStorageCondition: req.body.storageCondition,
            FuelStorageType: req.body.storageType,
            FuelStorageFuelGrade: req.body.fuelGrade,
            FuelStorageCapacity: req.body.storageCapacity,
            FuelStorageConstructionCost: req.body.constructionCost
        });
        await newFuelStorageUnit.save();

// TODO: Trap "save" errors

        res.redirect(`/switchboard?fuelstorageunitid=${newFuelStorageUnit.RecordID}` +
                     `&status=fuelstorageunitcreatesuccess` +
                     `&actionrequested=editfuelstorageunit` +
                     `&airportid=` + req.body.airportIDForUpdate +
                     `&aiscontenttype=801006` +
                     `&searchairportid=` + req.body.airportIDForUpdate +
                     `&searchairportname=`);
    };
});

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
// Fuel Storage Unit (Update)
///////////////////////////////
router.put('/airportupdateinfs', requiresAuth(), async (req, res) => {

    //ToDo: Add server-side verification
    
        // Get a pointer to the current record
        const fuelStorageUnitsTableRecord = await FuelStorageUnitsTable.findOne( {
            where: { RecordID: req.body.fuelStorageUnitIDToUpdate }
        });
    
        // Update the database record with the new data
        await fuelStorageUnitsTableRecord.update( {
            FuelStorageConstructionDate: req.body.constructionDate,
            FuelStorageConstructionCost: req.body.constructionCost,
            FuelStorageCondition: req.body.storageCondition,
            FuelStorageType: req.body.storageType,
            FuelStorageFuelGrade: req.body.fuelGrade,
            FuelStorageCapacity: req.body.storageCapacity,

        }).then( () => {
            res.redirect(`/switchboard?fuelstorageunitid=${fuelStorageUnitsTableRecord.RecordID}` +
                         `&status=fuelstorageunitupdatesuccess` +
//                         `&actionrequested=editfuelstorageunit` +
                         `&searchairportid=` + req.body.airportIDForUpdate +
                         `&airportid=` + req.body.airportIDForUpdate +
                         `&aiscontenttype=801006`);
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
// Fuel Storage Unit (Delete)
///////////////////////////////
router.delete('/fuelstorageunitdelete', requiresAuth(), async (req, res) => {

    // Get a pointer to the current record
    const fuelStorageUnitRecord = await FuelStorageUnitsTable.findOne( {
        where: { RecordID: req.body.fuelStorageUnitIDToDelete }
    });

    // Delete the record, based on the Record ID
    await fuelStorageUnitRecord.destroy().then( () => {
//        console.log(`deleting fsu: ${req.body.fuelStorageUnitIDToDelete} for airport: ${req.body.airportIDForConfirmation}`);
        res.redirect(`/switchboard?status=fuelstorageunitdeletesuccess` +
            `&searchairportid=` + req.body.airportIDForConfirmation +
            `&airportid=` + req.body.airportIDForConfirmation +
            `&aiscontenttype=801006`);
    });
});

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
    const userPermissionRecord = await UserPermissionsTable.findOne( {
        where: { WebsiteUserPermissionID: req.body.userPermissionIDToDelete }
    });

    // Delete the record
    await userPermissionRecord.destroy().then( () => {
        res.redirect(`/switchboard?status=userpermissiondeletesuccess` +
                     `&userid=${req.body.userIDOfPermission}`);
    });
});


////////////////////////////////////////////////////////////
// Invalid Routes
////////////////////////////////////////////////////////////
router.get('*', async (req, res) => {
    return res.render('error', {
        userName: '',
        errorCode: 901  // invalid route
    });
});

    
////////////////////////////////////////
// Return all routes
////////////////////////////////////////

module.exports = router;