//////////////////////////////////////////////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////////////////////////////////////////////
const { EventLogsTable, UsersAllView, UsersAllDDL, UsersTable,
        UserPermissionsActive, UserPermissionsAllDDL, UserPermissionsAllView,
        UserPermissionsTable
    } = require('../models/sequelize_common.js');
require("dotenv").config();  // load all ".env" variables into "process.env" for use
const nodemailer = require('nodemailer');  // allows SMPT push emails to be sent
    

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
// If the Current User is not configured for access (i.e., a New User),
// create an entry in the User Profiles table, and create their default User Permissions
//////////////////////////////////////////////////////////////////////////////////////////
async function checkForNewUser( usernameToCheck ) {

    // Local variables
    let errorCode = 0;
    let newUserID = 0;
    let today = new Date();
    let permissionExpirationDate = new Date();
    permissionExpirationDate.setFullYear(today.getFullYear() + 5);

    // Log the event
    let logEventResult = await logEvent('User Profiles', 'Get Current User', 0, 'Failure',
        'User not yet configured.', 0, 0, 0, '');

    // Add the new data to the database in a new record, and return the newly-generated [UserID] value
    const newUser = new UsersTable( { Username: usernameToCheck });
console.log(`Before newuser.save`);
    await newUser.save()
        .then( async function() {
            newUserID = newUser.UserID;
console.log(`newUser.UserID: ${newUserID}`);

            // Add New User Permission (Switchboard)
            const newUserPermissionSwitchboard = new UserPermissionsTable( {
                UserID: newUserID,
                PermissionCategoryID: '923001',
                ObjectValues: '*',
                EffectiveDate: today,
                ExpirationDate: permissionExpirationDate,
                CanCreate: false,
                CanRead: true,
                CanUpdate: false,
                CanDelete: false
            });
            await newUserPermissionSwitchboard.save()
                .then()
                .catch( async function(errorSwitchboard) {
console.log(`newUser Switchboard Permission error: ${errorSwitchboard}`);
                    errorCode = 902;
                    // Log the error
                    let logEventResult = logEvent('Error', 'New Permission', errorCode, 'Failure',
                        'Could not create new User Permission for Switchboard (' + errorSwitchboard + ').',
                        0, 0, newUserID, '');
                }); // END: Create new User Permission (Switchboard)

            // Add New User Permission (User Data Mgmt - allows user to manage their "profile" information)
            const newUserPermissionUserMgmt = new UserPermissionsTable( {
                UserID: newUserID,
                PermissionCategoryID: '923007',
                ObjectValues: '|' + newUserID + '|',
                EffectiveDate: today,
                ExpirationDate: permissionExpirationDate,
                CanCreate: false,
                CanRead: true,
                CanUpdate: true,
                CanDelete: false
            });
            await newUserPermissionUserMgmt.save()
                .then()
                .catch( async function(errorUserMgmt) {
 console.log(`newUser User Data Mgmt Permission error: ${errorUserMgmt}`);
                    errorCode = 902;
                    // Log the error
                    let logEventResult = logEvent('Error', 'New Permission', errorCode, 'Failure',
                        'Could not create new User Permission for User Data Mgmt (' + errorUserMgmt + ').',
                        0, 0, newUserID, '');
                }); // END: Create new User Permission (User Data Mgmt)

        }).catch( function(errorUserProfile) { // Could not create new User Profile
console.log(`newUser error: ${errorUserProfile}`);
            errorCode = 901;
            // Log the error
            let logEventResult = logEvent('Error', 'New User', errorCode, 'Failure',
                'Could not create new User Profile (' + errorUserProfile + ').',
                0, 0, newUserID, '');
        }); // END: Create new User Profile

console.log(`After newuser.save`);

    // ToDo: Send email notification
    let emailResultError = sendEmail(
        'fiosjlqf@gmail.com',
        `New User Account Created`,
        `A New User Account was successfully created for ${usernameToCheck}.`,
        '');

    // New User successfully configured
    
    return { errorCode, newUserID };
       
}; // END: checkForNewUser()


//////////////////////////////////////////////////////////////////////////////////////////
// Check Current User Permission
//////////////////////////////////////////////////////////////////////////////////////////
async function checkUserPermission(userID, permissionCategoryID, permissionType) {

    // default to "false"
    var permissionStatus = 0;

    // Get the list of active permissions for the user
    const matchingPermissions = await UserPermissionsActive.findAndCountAll( {
        where: { UserID: userID,
                 PermissionCategoryID: permissionCategoryID },
    });
//    console.log(`matchingPermissions.count: ${matchingPermissions.count}`);

    // Does the user have the requested permission?
    switch ( permissionType ) {
        case 'CanCreate':    permissionStatus = ( matchingPermissions.count > 0 ) ? matchingPermissions.rows[0].CanCreate : 0; break;
        case 'CanRead':      permissionStatus = ( matchingPermissions.count > 0 ) ? matchingPermissions.rows[0].CanRead   : 0; break;
        case 'CanUpdate':    permissionStatus = ( matchingPermissions.count > 0 ) ? matchingPermissions.rows[0].CanUpdate : 0; break;
        case 'CanDelete':    permissionStatus = ( matchingPermissions.count > 0 ) ? matchingPermissions.rows[0].CanDelete : 0; break;
        case 'ObjectValues': permissionStatus = ( matchingPermissions.count > 0 ) ? matchingPermissions.rows[0].ObjectValues : 'test'; break;
    };

    return permissionStatus;

}; // end "checkUserPermission"


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
// Get the Current User's Website User Profile permissions
//   (permissions to let the Current User manage other website Users' profile)
// Notes:  Input parameters are validated prior to this function call.
//////////////////////////////////////////////////////////////////////////////////////////
async function getWebsiteUserPermissionsForCurrentUser( currentUserID, userIDRequested ) {

    // declare and set local variables
    let userCanReadUsersDDL = false; // DDL permission
    let usersAllowedToCurrentUser = '';
    let usersAllowedToCurrentUserArray = [];
    let userCanCreateUsers = false; // "Add User" link permission
    let usersAllowedDDL = [];
    let userDetails = []; // User Profile data
    let doesUserExist = false;
    let userCanReadUser = false;
    let userCanUpdateUser = false;
    let userCanDeleteUser = false;

    ////////////////////////////////////////////////////////////////////
    // Get the list of general user-related permissions for the current user
    ////////////////////////////////////////////////////////////////////

    // "Website Users" DDL on Main Menu
    userCanReadUsersDDL = await checkUserPermission( currentUserID, '923004', 'CanRead' );
    userCanCreateUsers = await checkUserPermission( currentUserID, '923004', 'CanCreate' );

    // "Website Users" allowed to the Current User
    usersAllowedToCurrentUser = await checkUserPermission( currentUserID, '923007', 'ObjectValues' );
    usersAllowedToCurrentUserArray = usersAllowedToCurrentUser.split('|').slice(1, -1);
    if ( usersAllowedToCurrentUser === '*' ) {
        usersAllowedDDL = await UsersAllDDL.findAndCountAll({});
    } else {  // Current user can only see specific Website User(s)
        usersAllowedDDL = await UsersAllDDL.findAndCountAll({ where: { optionid: usersAllowedToCurrentUserArray } });
    };
//    } else { // populate a blank data set
//        usersAllowedDDL = await UsersAllDDL.findAndCountAll( { where: { optionid: 0 } } );

    ////////////////////////////////////////////////////////////////////
    // If a querystring request was made for a specific User, retrieve the profile and associated permissions
    ////////////////////////////////////////////////////////////////////
    if ( userIDRequested.toString().length > 0 ) {
        // Does the requested User exist? Retrieve the User's details from the database.
        userDetails = await UsersAllView.findAll({ where: { UserID: userIDRequested }});
        if ( typeof userDetails[0] === 'undefined' ) {  // User ID does not exist
            doesUserExist = false;
        } else { // User ID does exist
            doesUserExist = true;
            // Can current user view requested website user?
            if ( usersAllowedToCurrentUserArray.indexOf(userIDRequested.toString()) > -1
                 || (usersAllowedToCurrentUser === '*') ) {
                userCanReadUser = await checkUserPermission( currentUserID, '923007', 'CanRead' );
                userCanUpdateUser = await checkUserPermission( currentUserID, '923007', 'CanUpdate' );
                userCanDeleteUser = await checkUserPermission( currentUserID, '923007', 'CanDelete' );
            };
        };
    }; // End: Retrieve Requested Website User profile

    console.log(`currentUserID: ${currentUserID}`);
    console.log(`userIDRequested: ${userIDRequested}`);
    console.log(`userCanReadUsersDDL: ${userCanReadUsersDDL}`);
    console.log(`currentUserID: ${currentUserID}`);
    console.log(`userAllowedToCurrentUser: ${usersAllowedToCurrentUser}`);
    console.log(`usersAllowedDDL.count: ${usersAllowedDDL.count}`);
    console.log(`userCanReadUser: ${userCanReadUser}`);
    console.log(`userCanUpdateUser: ${userCanUpdateUser}`);
    console.log(`userCanDeleteUser: ${userCanDeleteUser}`);

    return { userCanReadUsersDDL, userCanCreateUsers, usersAllowedDDL,
             userDetails, doesUserExist, userCanReadUser, userCanUpdateUser, userCanDeleteUser };
};


//////////////////////////////////////////////////////////////////////////////////////////
// Get the Current User's Website User's Permission permissions
//   (permissions to let the Current User manage other Website Users' permissions)
//////////////////////////////////////////////////////////////////////////////////////////
async function getWebsiteUserPermissionPermissionsForCurrentUser( currentUserID, userPermissionIDRequested ) {

    console.log(`userPermissionIDRequested at Permissions fx: ${userPermissionIDRequested}`);

    // declare and set local variables
    // User Permissions
    //    (note individual website user permissions are not separated in authority; 
    //     if the current user can see any user permission, they can see all user permissions)
    let userCanReadUserPermissionsDDL = false; // DDL permissions
    let userCanCreateUserPermissions = false; // "Add Permission" link permission
    let userPermissionsAllowedToCurrentUser = '';
    let userPermissionsAllowedToCurrentUserArray = [];
    let userPermissionsAllowedDDL = [];
//    let userPermissionIDDefault = 0;
//    let userPermissionID = 0;  // same as used above
    let userPermissionDetails = []; // User Permissions data
    let doesUserPermissionExist = false;
    let userCanReadUserPermission = false;
    let userCanUpdateUserPermission = false;
    let userCanDeleteUserPermission = false;

    ////////////////////////////////////////////////////////////////////
    // Get the list of general user permissions-related permissions for the current user
    ////////////////////////////////////////////////////////////////////

    // "Website User Permissions" DDL on Main Menu
    userCanReadUserPermissionsDDL = await checkUserPermission( currentUserID, '923009', 'CanRead' );
    userCanCreateUserPermissions = await checkUserPermission( currentUserID, '923009', 'CanCreate' );

    // "Website User Permissions" allowed to the Current User (same across all users - not differentiated by user)
    userPermissionsAllowedToCurrentUser = await checkUserPermission( currentUserID, '923008', 'ObjectValues' );
    userPermissionsAllowedToCurrentUserArray = userPermissionsAllowedToCurrentUser.split('|').slice(1, -1);
    if ( userPermissionsAllowedToCurrentUser === '*' ) {
        userPermissionsAllowedDDL = await UserPermissionsAllDDL.findAndCountAll({ where: {UserID: currentUserID}});
    } else {  // Current user can only see specific Website User Permission(s)
        userPermissionsAllowedDDL = await UserPermissionsAllDDL.findAndCountAll({
            where: { 
                optionid: userPermissionsAllowedToCurrentUserArray,
                UserID: currentUserID
            }
        });
    };

    ////////////////////////////////////////////////////////////////////
    // If a querystring request was made for a specific User Permission, retrieve the permission details
    ////////////////////////////////////////////////////////////////////
    if ( userPermissionIDRequested.toString().length > 0 ) {
        // Does the requested User Permission exist? Retrieve the User Permission's details from the database.
        userPermissionDetails = await UserPermissionsAllView.findAll({ where: { WebsiteUserPermissionID: userPermissionIDRequested }});
        if ( typeof userPermissionDetails[0] === 'undefined' ) {  // User Permission ID does not exist
            doesUserPermissionExist = false;
        } else { // User Permission ID does exist
            doesUserPermissionExist = true;
            // Can current user view requested website user permission?
            if ( userPermissionsAllowedToCurrentUserArray.indexOf(userPermissionIDRequested.toString()) > -1
                 || (userPermissionsAllowedToCurrentUser === '*') ) {
                userCanReadUserPermission = await checkUserPermission( currentUserID, '923008', 'CanRead' );
                userCanUpdateUserPermission = await checkUserPermission( currentUserID, '923008', 'CanUpdate' );
                userCanDeleteUserPermission= await checkUserPermission( currentUserID, '923008', 'CanDelete' );
            };
        };
    }; // End: Retrieve Requested Website User Permission details


    //     // Get the list of user permissions-related permissions for the current user
//     const userPermissionsUserPermissionDDL = userPermissionsActive.rows.filter( permission => permission.PermissionCategoryID == 923009 );
    
//     // Can the current user view the User Permissions DDL?  What User Permissions can the current user see?
//     if ( userPermissionsUserPermissionDDL.length > 0 && userPermissionsUserPermissionDDL[0].CanRead ) {
//         userCanReadUserPermissionsDDL = true;

//         // What CRUD operations can the current user perform?
//         userPermissionsUserPermissions = userPermissionsActive.rows.filter( permission => permission.PermissionCategoryID == 923008 );
//         // Find the list of User Permissions the current user can see (for loading into the "User:" dropdown list)
//         if ( userPermissionsUserPermissions.length > 0 && userPermissionsUserPermissions[0].CanRead ) {
//             if ( userIDRequested !== '' ) { // A specific User was requested - load User Permissions for that User
//                 if ( userPermissionsUserPermissions[0].ObjectValues === '*' ) {
//                     userPermissionsAllowedDDL = await UserPermissionsAllDDL.findAndCountAll({ where: { UserID: userIDRequested } });
//                     userPermissionIDDefault = 999999;
//                 } else {  // Current user can only see specific User Permission(s)
//                     userPermissionsAllowedDDL = await UserPermissionsAllDDL.findAndCountAll({ where: { optionid: userPermissionsUserPermissions[0].ObjectValues } });
// // ToDo: expand for multiple User Permissions (eventually)
//                     // Assign the default UserPermissionID to be the sole User Permission allowed
//                     userPermissionIDDefault = userPermissionsUserPermissions[0].ObjectValues; // Set the User Permission ID to the only one User Permission the User has permission to see
//                 };
//             } else {  // Load a blank row of data
//                 userPermissionsAllowedDDL = await UserPermissionsAllDDL.findAndCountAll({ where: { UserID: -1 } });
//                 userPermissionIDDefault = 999999; // used ???
//             };
//         } else {  // The user can see the User Permissions DDL, but has no User Permissions assigned to them - hide the DDL
//             userCanReadUserPermissionsDDL = false;
//         };

//     };
//     console.log(`userPermissionsUserPermissionDDL.length: ${userPermissionsUserPermissionDDL.length}`);
// //    console.log(`record Permission Category ID: ${userPermissionsUserPermissionDDL[0].PermissionCategoryID}`);
//     console.log(`userCanReadUserPermissionsDDL: ${userCanReadUserPermissionsDDL}`);

//     // Can the current user create new User Permissions? (Current logic is always true for allowed User)
//     if ( userPermissionsUserPermissionDDL.length > 0 && userPermissionsUserPermissionDDL[0].CanCreate ) {
//         userCanCreateUserPermissions = true;
//     };

//     // If a querystring request was made for a specific User Permission
//     if ( userPermissionIDRequested ) {
//         console.log(`userPermissionIDRequested: ${userPermissionIDRequested}`);
//         // Does the requested User Permission exist? Retrieve the User Permission's details from the database.
//         userPermissionDetails = await UserPermissionsAllView.findAll({ where: { WebsiteUserPermissionID: userPermissionIDRequested }});
//         if ( typeof userPermissionDetails[0] === 'undefined' ) {  // User Permission ID does not exist
//             doesUserPermissionExist = false;
//         } else { // User Permission ID does exist
//             doesUserPermissionExist = true;
//             // Can current user view requested User Permission (or permission to view all User Permissions)?
//             if ( userPermissionIDRequested === userPermissionsUserPermissions[0].ObjectValues
//                  || userPermissionsUserPermissions[0].ObjectValues === '*' ) {
//                 userCanReadUserPermission = userPermissionsUserPermissions[0].CanRead;
//                 console.log(`userCanReadUserPermission: ${userCanReadUserPermission}`);
//                 userCanUpdateUserPermission = userPermissionsUserPermissions[0].CanUpdate;
//                 console.log(`userCanUpdateUserPermission: ${userCanUpdateUserPermission}`);
//                 userCanDeleteUserPermission = userPermissionsUserPermissions[0].CanDelete;
//                 console.log(`userCanDeleteUserPermission: ${userCanDeleteUserPermission}`);
//             };
//             userPermissionID = userPermissionIDRequested;
//         };

//     } else if ( userPermissionIDDefault !== 999999) { // Requested User Permission ID does not exist - if there a default User Permission ID
//         console.log(`userPermissionIDRequested does not exist - process default User Permission ID: ${userPermissionIDDefault}`);
//         // Does the default User Permission exist? Retrieve the User Permission's details from the database.
//         userPermissionDetails = await UserPermissionsAllView.findAll({ where: { WebsiteUserPermissionID: userPermissionIDDefault }});
//         if ( typeof userPermissionDetails[0] === 'undefined' ) {  // User Permission ID does not exist
//             doesUserPermissionExist = false;
//         } else {
//             doesUserPermissionExist = true;
//             // Can current user view requested User Permission (or permission to view all User Permissions)?
//             if ( userPermissionIDDefault === userPermissionsUserPermissions[0].ObjectValues
//                 || userPermissionsUserPermissions[0].ObjectValues === '*' ) {
//                userCanReadUserPermission = userPermissionsUserPermissions[0].CanRead;
//                console.log(`userCanReadUserPermission: ${userCanReadUserPermission}`);
//                userCanUpdateUserPermission = userPermissionsUserPermissions[0].CanUpdate;
//                console.log(`userCanUpdateUserPermission: ${userCanUpdateUserPermission}`);
//                userCanDeleteUserPermission = userPermissionsUserPermissions[0].CanDelete;
//                console.log(`userCanDeleteUserPermission: ${userCanDeleteUserPermission}`);
//            };
//            userPermissionID = userPermissionIDDefault;
//         };

//     } else { // No specific User Permission was requested, or user can read all User Permissions

//         doesUserPermissionExist = true;
//         userCanReadUserPermission = true;
//         userPermissionID = '';

//     };

//    console.log(`userPermissionID returned: ${userPermissionID}`);
    console.log(`currentUserID: ${currentUserID}`);
    console.log(`userPermissionIDRequested: ${userPermissionIDRequested}`);
    console.log(`userCanReadUserPermissionsDDL: ${userCanReadUserPermissionsDDL}`);
    console.log(`userPermissionsAllowedToCurrentUser: ${userPermissionsAllowedToCurrentUser}`);
    console.log(`userPermissionsAllowedDDL.count: ${userPermissionsAllowedDDL.count}`);
    console.log(`userCanReadUserPermission: ${userCanReadUserPermission}`);
    console.log(`userCanUpdateUserPermission: ${userCanUpdateUserPermission}`);
    console.log(`userCanDeleteUserPermission: ${userCanDeleteUserPermission}`);

    return { userCanReadUserPermissionsDDL, userCanCreateUserPermissions, userPermissionsAllowedDDL,
             userPermissionDetails, doesUserPermissionExist,
             userCanReadUserPermission, userCanUpdateUserPermission, userCanDeleteUserPermission
    };
};


//////////////////////////////////////////////////////////////////////////////////////////
// Send email
//////////////////////////////////////////////////////////////////////////////////////////
async function sendEmail(emailRecipient, emailSubject, emailBody, emailBodyHTML) {

    let result = '';

    // create message
    var msg = {
        to: emailRecipient,
        from: process.env.EMAIL_SENDER,
        subject: emailSubject,
        text: emailBody,
        html: emailBodyHTML
    };

    // send the message
    // nodemailer example
    console.log('Before creating nodemailer transporter.');
    let transporter = nodemailer.createTransport( {  // the email account to send SMTP emails
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
    console.log(`After creating nodemailer transporter: ${transporter}`);
//     let info = await transporter.sendMail( msg , function (error, info) {
//         console.log(`sendMail() result: ${info}`);
// //        if (error) {
// //            console.log(error.message);
// //            result = error;
// //            // ToDo: log error in "events" table
// //        } else {
// //            console.log('Email sent: ' + info.response);
// //            result = info.response;
// //            // ToDo: log event in "events" table
// //        }
// //        console.log(`Result (in sendMail Fn): ${result}`);
//     }
//     ).then( info => {
//         console.log(`sendMail() result: ${info}`);
//     });

/*
    let info = await transporter.sendMail( msg );
    console.log(`Send email result: ${info.messageId}`);
*/
    console.log('After sending email by transporter.');

    return result;

}; // end "sendEmail"


module.exports = {
    logEvent,
    checkUserPermission,
    checkForNewUser,
    convertOptionsToDelimitedString,
    getWebsiteUserPermissionsForCurrentUser,
    getWebsiteUserPermissionPermissionsForCurrentUser,
    sendEmail
};