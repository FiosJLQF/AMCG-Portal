//////////////////////////////////////////////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////////////////////////////////////////////
const pageScholarshipVolume = 15; // number of scholarships to be displayed on a page
const pageSponsorVolume = 15; // number of sponsors to be displayed on a page
const { EventLogsTable, UserProfiles, UserPermissionsActive, AirportsCurrent, AISContentTypeCategories,
    LFOwnerTypeCategories, NationalRegions } = require('../models/sequelize.js');
require("dotenv").config();  // load all ".env" variables into "process.env" for use
const nodemailer = require('nodemailer');  // allows SMPT push emails to be sent
    

//////////////////////////////////////////////////////////////////////////////////////////
// Does the user have permission to access the page?
//////////////////////////////////////////////////////////////////////////////////////////
function userPermissions(permissionsList, userID, objectName, objectValue = '') {

// ToDo:  database call here with specifics to return T/F instead of this???

    // for each Permission in the Permissions List, is there a match to the current request?
    for (let permission of permissionsList) {
        console.log(permission.userid);
        console.log(permission.objectName);
        console.log(permission.objectValue);
        console.log(permission.canCreate);
        console.log(permission.canRead);
        console.log(permission.canUpdate);
        console.log(permission.canDelete);
    };

}


//////////////////////////////////////////////////////////////////////////////////////////
// Create a log entry
//////////////////////////////////////////////////////////////////////////////////////////
async function logEvent(processName, eventObject, eventCode, eventStatus, eventDescription, eventDuration,
    eventRows, eventUserID, sendEmailTo) {

    let logEventResult = false;
    console.log('Logging event now...');

    //    async (req, res) => {
    try {
        console.log('Writing event to log...');
        const newEventLog = new EventLogsTable( {
            EventDate: Date().toString(),
            ProcessName: processName,
            EventObject: eventObject,
            EventStatus: eventStatus,
            EventDescription: eventDescription,
            EventDuration: eventDuration,
            EventRows: eventRows,
            EventUserID: eventUserID,
            EventCode: eventCode
        });
        await newEventLog.save();
        console.log('Event written to log...');
        logEventResult = true;
        console.log('Event logged.');
        if ( sendEmailTo.length !== 0 ) {
            let emailResultLogSuccess = sendEmail(sendEmailTo, `Event Logged (${eventStatus})`,
                `An event was logged for ${processName}:  ${eventDescription}`);
        };
    } catch (error) {
        let emailResultError = sendEmail(process.env.EMAIL_WEBMASTER_LIST, 'Event Log Error',
        `An error occurred logging an event: ${error}`);
        console.log(`Event not logged (${error})`);
        };

    return logEventResult;

};


//////////////////////////////////////////////////////////////////////////////////////////
// Format selected options in a SELECT control into a delimited string for database storage
//////////////////////////////////////////////////////////////////////////////////////////
function convertOptionsToDelimitedString(optionsToConvert, delimiterToUse = "|", notSelectedValue) {

    let optionsOrig = optionsToConvert;
    let optionsFormatted = '';

    // If the SELECT control has a "Not Selected" option, and it should be removed
    if ( Array.isArray(optionsOrig) ) { // More than one options was selected
        if ( optionsOrig.indexOf(notSelectedValue) >= 0 ) { // Remove 'Not Selected'
            optionsOrig.splice(optionsOrig.indexOf(notSelectedValue), 1);
        };
    } else { // One or no options were selected
        if ( optionsOrig === notSelectedValue ) {  // 'Not Selected' was the only option selected
            optionsOrig = '';
        };
    };

    // Reformat the input Options list to a delimited string
    if ( Array.isArray(optionsOrig) ) { // More than one options was selected
        optionsFormatted = delimiterToUse + optionsOrig.join(delimiterToUse) + delimiterToUse;
    } else { // One or no options were selected
        if ( optionsOrig === '' ) {  // 'Not Selected' was the only option selected, or no options were selected
            optionsFormatted = '';    
        } else {
            optionsFormatted = delimiterToUse + optionsOrig + delimiterToUse;
        };
    };

    return optionsFormatted;
    
}


//////////////////////////////////////////////////////////////////////////////////////////
// Create a log entry
//////////////////////////////////////////////////////////////////////////////////////////
function createLogEntry(activityCode, activityUser, activityPage, sendEmail) {

    let createLogEntryResult = false;

    return createLogEntryResult;
    
}


//////////////////////////////////////////////////////////////////////////////////////////
// Get the Current User's Airport permissions
//////////////////////////////////////////////////////////////////////////////////////////
async function getAISPermissionsForUser( userPermissionsActive, airportIDRequested ) {

    // declare and set local variables
    let userCanReadAISMenu = false;
    let userCanReadAirports = false;
    let userCanCreateAirports = false;
    let userPermissionsAIS = [];
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
    userPermissionsAIS = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'menu-ais');
    if ( userPermissionsAIS.length > 0 && userPermissionsAIS[0].CanRead ) {
        userCanReadAISMenu = true;
    };

    // Get the list of airport-related permissions for the current user
    userPermissionsAirports = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'switchboard-airports');
    if ( userPermissionsAirports.length > 0 && userPermissionsAirports[0].CanRead ) {
        userCanReadAirports = userPermissionsAIS[0].CanRead;
        // What CRUD operations can the current user perform?
        userPermissionsAirports = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'airports');
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
    if ( userPermissionsAirports.length > 0 && userPermissionsAirports[0].CanCreate ) {
        userCanCreateAirports = true;
    };
    
    // If a querystring request was made for a specific Aiport
    if ( airportIDRequested ) {
//        console.log(`airportIDRequested: ${airportIDRequested}`);
        // Does the requested Airport exist? Retrieve the Airport's details from the database.
        airportDetails = await AirportsCurrent.findAll({ where: { LFLocationID_FAA: airportIDRequested }});
        if ( typeof airportDetails[0] === 'undefined' ) {  // Airport ID does not exist
            doesAirportExist = false;
        } else { // Airport ID does exist
            doesAirportExist = true;
//            console.log('airport does exist');
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


//////////////////////////////////////////////////////////////////////////////////////////
// Send email
//////////////////////////////////////////////////////////////////////////////////////////
function sendEmail(emailRecipient, emailSubject, emailBody) {

    // create message
    var msg = {
        to: emailRecipient,
        from: process.env.EMAIL_SENDER,
        subject: emailSubject,
        text: emailBody // change to HTML once content is pre-checked
    };

    // send the message
    // nodemailer example
    var transporter = nodemailer.createTransport( {  // the email account to send SMTP emails
//        service: 'smtp.fatcow.com',
        host: 'smtp.gmail.com',
        port: 465, // 587 without SSL
        secure: true,
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_SENDER,
            clientId: process.env.EMAIL_OAUTH_CLIENTID,
            clientSecret: process.env.EMAIL_OAUTH_CLIENTSECRET,
            refreshToken: process.env.EMAIL_OAUTH_REFRESHTOKEN
        },
    });
    transporter.sendMail( msg, function (error, info) {
        if (error) {
            console.log(error);
            // ToDo: log error in "events" table
        } else {
            console.log('Email sent: ' + info.response);
            // ToDo: log event in "events" table
        }
    });
/*
    // sendGrid example
    sendgrid
      .send(msg)
      .then((resp) => {
        console.log('Email sent\n', resp)
        // ToDo: log event in "events" table
        })
      .catch((error) => {
        console.error(error)
        // ToDo: log error in "events" table
        });
*/

}; // end "sendEmail"


module.exports = {
    convertOptionsToDelimitedString,
    getAISPermissionsForUser,
    logEvent,
    sendEmail
};