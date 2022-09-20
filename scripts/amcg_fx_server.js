//////////////////////////////////////////////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////////////////////////////////////////////
const { AirportsCurrent
    } = require('../models/sequelize_portal.js');
require("dotenv").config();  // load all ".env" variables into "process.env" for use
const nodemailer = require('nodemailer');  // allows SMPT push emails to be sent
const commonFx = require('./common_fx_server');


//////////////////////////////////////////////////////////////////////////////////////////
// Get the Current User's Airport permissions
//////////////////////////////////////////////////////////////////////////////////////////
async function getAISPermissionsForUser( currentUserID, airportIDRequested ) {

    // declare and set local variables
    let userCanReadAISMenu = false;
    let userCanReadAirports = false;
    let airportsAllowedToUser = '';
    let airportsAllowedToUserArray = [];
    let airportExists = false;
    let airportID = '';
    let airportDetails = [];
    let userCanReadAirport = false;
    let userCanUpdateAirport = false;

    // Get the generic AIS-related permissions for the current user
    userCanReadAISMenu = await commonFx.checkUserPermission( currentUserID, '923002', 'CanRead' );
    userCanReadAirports = await commonFx.checkUserPermission( currentUserID, '923003', 'CanRead' );
    airportsAllowedToUser = await commonFx.checkUserPermission( currentUserID, '923005', 'ObjectValues' );
    airportsAllowedToUserArray = airportsAllowedToUser.split('|').slice(1, -1);

    // If the user can read/use the AIS, continue checking
    if ( userCanReadAISMenu ) {

        // If a querystring request was made for a specific Aiport
        if ( airportIDRequested ) {
            console.log(`airportIDRequested: ${airportIDRequested}`);
            // Does the requested Airport exist?
            airportDetails = await AirportsCurrent.findAll({ where: { LFLocationID_FAA: airportIDRequested }});
            if ( typeof airportDetails[0] === 'undefined' ) {  // Airport ID does not exist
                airportExists = false;
            } else { // Airport ID does exist
                airportExists = true;
                console.log('Airport does exist.');
                // Can current user view requested Airport (or have permission to view all Airports)?
                if ( airportsAllowedToUserArray.indexOf(airportIDRequested) > -1 || airportsAllowedToUser === '*' ) {
                    userCanReadAirport = await commonFx.checkUserPermission( currentUserID, '923005', 'CanRead' );
                    userCanUpdateAirport = await commonFx.checkUserPermission( currentUserID, '923005', 'CanUpdate' );
                };
                airportID = airportIDRequested;
            };
        } else { // No specific Airport was requested, set AIS default values for "new search"
            airportExists = true;
            userCanReadAirport = true;
            airportID = '';
        };  // END: Was a specific airport requested?

    }; // END: Can Current User view the AIS?

    return { 
        userCanReadAISMenu, userCanReadAirports, airportsAllowedToUser, airportsAllowedToUserArray,
        airportID, airportExists, airportDetails, userCanReadAirport, userCanUpdateAirport
    };
};


module.exports = {
    getAISPermissionsForUser
};