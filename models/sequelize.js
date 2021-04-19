/**************************************************************************************************
  Define all required libraries
**************************************************************************************************/
require("dotenv").config();  // load all ".env" variables into "process.env" for use


/**************************************************************************************************
  Create the database connection and test
**************************************************************************************************/
const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize( process.env.DB_URI, {
    dialect: 'postgres',
    operatorsAliases: 0,
    dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
    }
});

// Test the DB Connection
sequelize.authenticate().then(() => {
    console.log("Success!");
  }).catch((err) => {
    console.log(err);
});


/**************************************************************************************************
  Import all models
**************************************************************************************************/
// const ScholarshipsActiveModel = require('./scholarshipsActiveView.model');
// const ScholarshipsActive = ScholarshipsActiveModel(sequelize, DataTypes);
// const SponsorsModel = require('./sponsors.model');
// const Sponsors = SponsorsModel(sequelize, DataTypes);
// const SponsorTypeCategoriesDDLModel = require('./sponsortypeddl.model');
// const SponsorTypeCategoriesDDL = SponsorTypeCategoriesDDLModel(sequelize, DataTypes);

//const UsersAllDDLModel = require('./usersAllDLL.model');
//const UsersAllDDL = UsersAllDDLModel(sequelize, DataTypes);

const UserPermissionsActiveModel = require('./userPermissionsActive.model');
const UserPermissionsActive = UserPermissionsActiveModel(sequelize, DataTypes);
UserPermissionsActive.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const UserProfilesModel = require('./userProfiles.model');
const UserProfiles = UserProfilesModel(sequelize, DataTypes);
UserProfiles.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const AirportsTableModel = require('./airportsTable.model');
const AirportsTable = AirportsTableModel(sequelize, DataTypes);
AirportsTable.removeAttribute('id');  // a different, auto-populated primary key is used in the DB

const AirportsCurrentModel = require('./airportsCurrent.model');
const AirportsCurrent = AirportsCurrentModel(sequelize, DataTypes);
AirportsCurrent.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const NationalRegionsModel = require('./nationalRegionsActiveView.model');
const NationalRegions = NationalRegionsModel(sequelize, DataTypes);
NationalRegions.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const AISContentTypeCategoriesModel = require('./aisContentTypeCategoriesView.model');
const AISContentTypeCategories = AISContentTypeCategoriesModel(sequelize, DataTypes);
AISContentTypeCategories.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const LFOwnerTypeCategoriesModel = require('./lfOwnerTypeCategoriesView.model');
const LFOwnerTypeCategories = LFOwnerTypeCategoriesModel(sequelize, DataTypes);
LFOwnerTypeCategories.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined


/**************************************************************************************************
  Export objects
**************************************************************************************************/
module.exports = {
  // ScholarshipsDDL,
  // ScholarshipsAllDDL,
  // ScholarshipsAllDDLTest,
  // FieldOfStudyCategoriesDDL,
  // GenderCategoriesDDL,
  // CitizenshipCategoriesDDL,
  // YearOfNeedCategoriesDDL,
  // EnrollmentStatusCategoriesDDL,
  // MilitaryServiceCategoriesDDL,
  // FAAPilotCertificateCategoriesDDL,
  // FAAPilotRatingCategoriesDDL,
  // FAAMechanicCertificateCategoriesDDL,
  // Sponsors,
  // SponsorTypeCategoriesDDL,
  // UsersAllDDL,
  UserPermissionsActive,
  UserProfiles,
  NationalRegions,
  AirportsTable,
  AirportsCurrent,
  AISContentTypeCategories,
  LFOwnerTypeCategories
};