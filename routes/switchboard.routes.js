///////////////////////////////////////////////////////////////////////////////////
// Required External Modules
///////////////////////////////////////////////////////////////////////////////////
const express = require("express");
const router = express.Router();
const { auth, requiresAuth } = require('express-openid-connect');
require("dotenv").config();  // load all ".env" variables into "process.env" for use
const { ScholarshipsTable, ScholarshipsActive, ScholarshipsDDL, ScholarshipsAllDDL, ScholarshipsAllDDLTest,
        SponsorsTableTest, Sponsors, SponsorsDDL, SponsorsAllDDLTest, 
        GenderCategoriesDDL, FieldOfStudyCategoriesDDL, CitizenshipCategoriesDDL, YearOfNeedCategoriesDDL,
        EnrollmentStatusCategoriesDDL, MilitaryServiceCategoriesDDL, FAAPilotCertificateCategoriesDDL,
        FAAPilotRatingCategoriesDDL, FAAMechanicCertificateCategoriesDDL, SponsorTypeCategoriesDDL,
        UsersAllDDL, UserPermissionsActive, UserProfiles
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

////////////////////////////////////////
// "GET" Routes
////////////////////////////////////////

router.get('/newuser', requiresAuth(), async (req, res) => {
    try {
        return res.render('switchboard_newuser', {
            user: req.oidc.user,
            userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
        } )
    } catch(err) {
        console.log('Error:' + err);
    }
});

router.get('/', requiresAuth(), async (req, res) => {
    try {

        let errorCode = 0;
        let actionRequested = '';

        // Get the current user's profile
        const userProfiles = await UserProfiles.findAll( { where: { Username: req.oidc.user.email }});
        if ( userProfiles.length === 0 ) {
            res.redirect(`/switchboard/newuser`);
        };

        // Get the list of active permissions for the user
        const userPermissionsActive = await UserPermissionsActive.findAndCountAll( { where: { UserID: userProfiles[0].UserID }});

        ////////////////////////////////////////////////////
        //  Sponsors Information (DDL, Add Sponsor, Default Sponsor, etc.)
        ////////////////////////////////////////////////////

        // Can the user see the sponsors select object?  If so, load the Sponsors available to the current user.
        const userPermissionsSponsorDDL = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'switchboard-sponsors');
        let userCanReadSponsors = false;
        let userPermissionsSponsors = [];
        let sponsorsAllDDL = [];
        let sponsorID = '';
        if ( userPermissionsSponsorDDL.length > 0 && userPermissionsSponsorDDL[0].CanRead ) {
            userCanReadSponsors = true;
            userPermissionsSponsors = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'sponsors');
            if ( userPermissionsSponsors.length > 0 && userPermissionsSponsors[0].CanRead ) {
                if ( userPermissionsSponsors[0].ObjectValues === '*' ) {
                    sponsorsAllDDL = await SponsorsAllDDLTest.findAndCountAll({});
                } else {
                    sponsorsAllDDL = await SponsorsAllDDLTest.findAndCountAll({ where: { optionid: userPermissionsSponsors[0].ObjectValues } });
                    sponsorID = userPermissionsSponsors[0].ObjectValues; // Set the Sponsor ID to the only one Sponsor the User has permission to see
                };
            } else {  // The user can see the Sponsors DDL, but has no Sponsors assigned to them - hide the DDL
                userCanReadSponsors = false;
            };
        };
        console.log(`userCanReadSponsors: ${userCanReadSponsors}`);

        // If a SponsorID was provided in the querystring, or the User only has access to one Sponsor, find the Sponsor's details
        let sponsorDetails = [];
        let userCanReadSponsor = false;
        let userCanUpdateSponsor = false;
        let userCanDeleteSponsor = false;
        if ( req.query['sponsorid'] ) {  // If a Sponsor ID was provided in the query string, use that value
            if ( req.query['sponsorid'] == 0 ) {  // If Sponsor ID is "0", redirect to the generic Switchboard page
                res.redirect('/switchboard');
            } else {
                sponsorID = req.query['sponsorid'];
            };
        };
        if ( sponsorID !== '' ) {
            // Does the requested Sponsor exist? Retrieve the Sponsor's details from the database.
            sponsorDetails = await SponsorsTableTest.findAll({ where: { SponsorID: sponsorID }});
            if ( typeof sponsorDetails[0] === 'undefined' ) {  // Sponsor ID does not exist
                console.log('908');
                errorCode = 908;  // Unknown Sponsor
                console.log(`errorcode = ${errorCode}`);
                return res.render( 'error', {
                    errorCode: errorCode,
                    userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
                });
            };

            // Does the User have permission to see/edit/delete this Sponsor?
            if ( sponsorID === userPermissionsSponsors[0].ObjectValues || userPermissionsSponsors[0].ObjectValues === '*' ) {
                userCanReadSponsor = userPermissionsSponsors[0].CanRead;
                console.log(`userCanReadSponsor: ${userCanReadSponsor}`);
                userCanUpdateSponsor = userPermissionsSponsors[0].CanUpdate;
                console.log(`userCanUpdateSponsor: ${userCanUpdateSponsor}`);
                userCanDeleteSponsor = userPermissionsSponsors[0].CanDelete;
                console.log(`userCanDeleteSponsor: ${userCanDeleteSponsor}`);
            } else {  // User does not have permission to read Sponsor's data - trap and log error
                console.log('909');
                errorCode = 909;  // Unknown Sponsor
                console.log(`errorcode = ${errorCode}`);
                return res.render( 'error', {
                        errorCode: errorCode,
                        userName: ( req.oidc.user == null ? '' : req.oidc.user.name )
                });
            };
        };

        // Can the user create new sponsors?
        let userCanCreateSponsors = false;
        if ( userCanReadSponsors && userPermissionsSponsorDDL[0].CanCreate ) {
            userCanCreateSponsors = true;
        };

        // Retrieve options for DDLs
        const sponsorTypeCategoriesDDL = await SponsorTypeCategoriesDDL.findAndCountAll({});

        ////////////////////////////////////////////////////
        //  Scholarships Information (DDL, Add Scholarship, etc.)
        ////////////////////////////////////////////////////

        // Can the user see the scholarships select object?  If so, load the Scholarships available to the current user.
        let userCanReadScholarships = false;
        let userPermissionsScholarshipDDL = [];
        let scholarshipsDDL = [];
        if (userPermissionsSponsorDDL.length > 0 && userPermissionsSponsorDDL[0].CanRead ) { // Only load scholarships if the user can see Sponsors
            userPermissionsScholarshipDDL = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'switchboard-scholarships');
            if ( userPermissionsScholarshipDDL.length > 0 && userPermissionsScholarshipDDL[0].CanRead ) {  // If the User can see the Scholarships DDL, show it
                userCanReadScholarships = true;
//                console.log(`sponsorID for scholarships DDL: ${sponsorID}`);
                if ( sponsorID !== '' ) {  // If a single Sponsor ID is assigned, load the Scholarships for that Sponsor
                    scholarshipsDDL = await ScholarshipsAllDDLTest.findAndCountAll({ where: { SponsorID: sponsorID } });
                } else {  // Load a blank row of data
                    scholarshipsDDL = await ScholarshipsAllDDLTest.findAndCountAll({ where: { SponsorID: -1 } });
                };
            };
        };
//        console.log(`userCanReadScholarships: ${userCanReadScholarships}`);
//        console.log(`active scholarships for the Sponsor: ${scholarshipsDDL.count}`);

        // Can the user create new scholarships?
        let userCanCreateScholarships = false;
        if ( userCanReadScholarships && userPermissionsScholarshipDDL[0].CanCreate ) {
            userCanCreateScholarships = true;
        };

        ////////////////////////////////////////////////////
        //  Users Information (DDL, Add User, etc.)
        ////////////////////////////////////////////////////

        // Can the user see the users select object?  If so, load the Users available to the current user
        const userPermissionsUserDDL = userPermissionsActive.rows.filter( permission => permission.ObjectName === 'switchboard-users');
        let userCanReadUsers = false;
        let usersAllDDL = [];
        if ( userPermissionsUserDDL.length > 0 && userPermissionsUserDDL[0].CanRead ) {
            userCanReadUsers = true;
            usersAllDDL = await UsersAllDDL.findAndCountAll({});
            console.log(`usersAllDDL: ${usersAllDDL.count}`);
        };
        console.log(`userCanReadUsers: ${userCanReadUsers}`);

        // Can the user create new users?
        let userCanCreateUsers = false;
        if ( userCanReadUsers && userPermissionsUserDDL[0].CanCreate ) {
            userCanCreateUsers = true;
        };

        // If a ScholarshipID was provided in the querystring, find the Scholarship's details
        let scholarshipDetails = [];
        let scholarshipID = '';
        if ( req.query['scholarshipid'] ) {
            scholarshipID = req.query['scholarshipid'];
//            scholarshipDetails = await ScholarshipsTable.findAll({ where: { ScholarshipID: scholarshipID }});
        };

        ////////////////////////////////////////////////////
        //  Process any querystring "actions requested"
        ////////////////////////////////////////////////////

        if ( req.query['actionRequested'] === 'addsponsor' ) {
            if ( userCanCreateSponsors ) {
                actionRequested = 'addsponsor';
            };
        } else if ( req.query['actionRequested'] === 'addscholarships' ) {
            if ( userCanCreateScholarships ) {
                actionRequested = 'addscholarship';
            };
        };

        // Render the page
        return res.render('switchboard', {
            // Admin data
            errorCode,
            actionRequested,
            // User data
            user: req.oidc.user,
            userName: ( req.oidc.user == null ? '' : req.oidc.user.name ),
            // Main Menu Data
            userCanReadSponsors,
            sponsorsAllDDL,
            userCanCreateSponsors,
            sponsorTypeCategoriesDDL,
            userCanReadScholarships,
            scholarshipsDDL,
            userCanCreateScholarships,
            userCanReadUsers,
            usersAllDDL,
            userCanCreateUsers,
            userID: '',
            // Sponsor Details data
            sponsorID,
            sponsorDetails,
            userCanReadSponsor, userCanUpdateSponsor, userCanDeleteSponsor,
            // Scholarship Details data
            scholarshipID,
        })
    } catch(err) {
        console.log('Error:' + err);
    }
});


////////////////////////////////////////
// "POST" Routes
////////////////////////////////////////

router.post('/sponsoradd', requiresAuth(), async (req, res) => {

    // Reformat the SELECT options into a pipe-delimited array for storage
    let sponsorTypesOrig = req.body.sponsorTypes;
    let sponsorTypesFormatted = [];
//    console.log(`sponsorTypesOrig: ${sponsorTypesOrig}`);
//    console.log(`sponsorTypesOrig.indexOf(0): ${sponsorTypesOrig.indexOf('0')}`);
    if ( sponsorTypesOrig.length > 1 ) {
        sponsorTypesOrig.splice(sponsorTypesOrig.indexOf('0'), 1);
        sponsorTypesFormatted = '|' + sponsorTypesOrig.join('|') + '|';
    } else {
        if ( sponsorTypesOrig[0] === '0' ) {  // 'Not Selected' was the only option selected
            sponsorTypesFormatted = '';    
        } else {
            sponsorTypesFormatted = '|' + sponsorTypesOrig[0] + '|';
        };
    };
//    console.log(`sponsorTypesTrimmed: ${sponsorTypesOrig}`);
//    console.log(`sponsorTypesFormatted: ${sponsorTypesFormatted}`);

    const newSponsor = new SponsorsTableTest( {
        SponsorName: req.body.sponsorName,
        SponsorDescription: req.body.sponsorDescription,
        SponsorWebsite: req.body.sponsorWebsite,
        SponsorLogo: req.body.sponsorLogo,
        SponsorContactFName: req.body.sponsorContactFName,
        SponsorContactLName: req.body.sponsorContactLName,
        SponsorContactEmail: req.body.sponsorContactEmail,
        SponsorContactTelephone: req.body.sponsorContactTelephone,
        SponsorType: sponsorTypesFormatted
    });
    await newSponsor.save();
    res.redirect(`/switchboard?sponsorid=${newSponsor.SponsorID}`);
});

////////////////////////////////////////
// Return all routes
////////////////////////////////////////

module.exports = router;