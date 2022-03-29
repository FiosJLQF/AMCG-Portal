//////////////////////////////////////////////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////////////////////////////////////////////
const { EventLogsTable, UserProfiles, UsersAllView, UsersAllDDL,
        UserPermissionsActive, UserPermissionsAllDDL, UserPermissionsAllView,
        AirportsCurrent, AISContentTypeCategories,
        LFOwnerTypeCategories, NationalRegions} = require('../models/sequelize.js');
require("dotenv").config();  // load all ".env" variables into "process.env" for use
const nodemailer = require('nodemailer');  // allows SMPT push emails to be sent


//////////////////////////////////////////////////////////////////////////////////////////
// Get the Current User's Airport permissions
//////////////////////////////////////////////////////////////////////////////////////////
async function getAISPermissionsForUser( userPermissionsActive, airportIDRequested ) {

    // declare and set local variables
    let userCanReadAISMenu = false;
    let userCanReadAirports = false;
    let userCanCreateAirports = false;
    let userPermissionsAIS = [];
    let userPermissionsAirportDDL = [];
    let userPermissionsAirports = [];
//    let airportsAllowedDDL = []; // user to filter search results to the airports allowed to user
//    let airportIDDefault = 0; // the user's "home" or "default" airport, if present
    let airportID = '';
    let airportDetails = [];
    let doesAirportExist = false;
    let userCanReadAirport = false;
    let userCanUpdateAirport = false;
    let userCanDeleteAirport = false;

    // Does the user have access to the AIS?
    userPermissionsAIS = userPermissionsActive.rows.filter( permission => permission.PermissionCategoryID == 923002);
    if ( userPermissionsAIS.length > 0 && userPermissionsAIS[0].CanRead ) {
        userCanReadAISMenu = true;
    };

    // Get the list of airport-related permissions for the current user
    userPermissionsAirportDDL = userPermissionsActive.rows.filter( permission => permission.PermissionCategoryID == 923003);

    // Can the current user view the Airports DDL?  What Airports can the current user see?
    if ( userPermissionsAirportDDL.length > 0 && userPermissionsAirportDDL[0].CanRead ) {
        userCanReadAirports = true;
        // What CRUD operations can the current user perform?
        userPermissionsAirports = userPermissionsActive.rows.filter( permission => permission.PermissionCategoryID == 923005);
//        console.log(`userPermissionsAirports.length = ${userPermissionsAirports.length}`);
//        console.log(`userPermissionsAirports[0].CanRead = ${userPermissionsAirports[0].CanRead}`);
//        // Find the list of Airports the current user can see (for filtering the "matching airports" list)
//// ToDo:  Add filtering (future functionality)
//        if ( userPermissionsAirports.length > 0 && userPermissionsAirports[0].CanRead ) {
//            if ( userPermissionsAirports[0].ObjectValues === '*' ) {
//                airportsAllowedDDL = await AirportsAllDDLTest.findAndCountAll({});
//                airportIDDefault = 999999;
//            } else {  // Current user can only see specific Airports(s)
//                airportsAllowedDDL = await AirportsAllDDL.findAndCountAll({ where: { optionid: userPermissionsAirports[0].ObjectValues } });
// ToDo: expand for specific Airports (future functionality)
//                // Assign the default AirportID to be the sole Airport allowed
//                airportIDDefault = userPermissionsAirports[0].ObjectValues; // Set the Airport ID to the only one Airport the User has permission to see
//            };
//        } else {  // The user can see the Airports DDL, but has no Airports assigned to them - hide the DDL
//            userCanReadAirports = false;
//        };
    };

    // Can the current user create new Sponsors?
    if ( userPermissionsAirportDDL.length > 0 && userPermissionsAirportDDL[0].CanCreate ) {
        userCanCreateAirports = true;
    };
    
    // If a querystring request was made for a specific Aiport
    if ( airportIDRequested ) {
        console.log(`airportIDRequested: ${airportIDRequested}`);
        // Does the requested Airport exist? Retrieve the Airport's details from the database.
        airportDetails = await AirportsCurrent.findAll({ where: { LFLocationID_FAA: airportIDRequested }});
        if ( typeof airportDetails[0] === 'undefined' ) {  // Airport ID does not exist
            doesAirportExist = false;
        } else { // Airport ID does exist
            doesAirportExist = true;
            console.log('airport does exist');
            // Can current user view requested Airport (or have permission to view all Airports)?
            if ( airportIDRequested === userPermissionsAirports[0].ObjectValues
                 || userPermissionsAirports[0].ObjectValues === '*' ) {
                userCanReadAirport = userPermissionsAirports[0].CanRead;
                userCanUpdateAirport = userPermissionsAirports[0].CanUpdate;
                userCanDeleteAirport = userPermissionsAirports[0].CanDelete;
            };
            airportID = airportIDRequested;
        };

//    } else if ( sponsorIDDefault !== 999999) { // Requested Sponsor ID does not exist - if there a default Sponsor ID
//        console.log(`sponsorIDRequested does not exist - process default Sponsor ID: ${sponsorIDDefault}`);
        // Does the default Sponsor exist? Retrieve the Sponsor's details from the database.
//        sponsorDetails = await SponsorsTableTest.findAll({ where: { SponsorID: sponsorIDDefault }});
//        if ( typeof sponsorDetails[0] === 'undefined' ) {  // Sponsor ID does not exist
//            doesSponsorExist = false;
//        } else {
//            doesSponsorExist = true;
//            // Can current user view requested sponsor (or permission to view all sponsors)?
//            if ( sponsorIDDefault === userPermissionsSponsors[0].ObjectValues
//                || userPermissionsSponsors[0].ObjectValues === '*' ) {
//               userCanReadSponsor = userPermissionsSponsors[0].CanRead;
//               console.log(`userCanReadSponsor: ${userCanReadSponsor}`);
//               userCanUpdateSponsor = userPermissionsSponsors[0].CanUpdate;
//               console.log(`userCanUpdateSponsor: ${userCanUpdateSponsor}`);
//               userCanDeleteSponsor = userPermissionsSponsors[0].CanDelete;
//               console.log(`userCanDeleteSponsor: ${userCanDeleteSponsor}`);
//           };
//           sponsorID = sponsorIDDefault;
//        };

    } else { // No specific Airport was requested, or user can read all Airports
        doesAirportExist = true;
        userCanReadAirport = true;
        airportID = '';
    };

    return { 
        userCanReadAISMenu, userCanReadAirports, userCanCreateAirports,
        airportID, airportDetails, doesAirportExist,
        userCanReadAirport, userCanUpdateAirport, userCanDeleteAirport
    };
};


module.exports = {
    getAISPermissionsForUser
};