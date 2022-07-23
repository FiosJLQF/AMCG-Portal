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


/********************************************
  Administrative Models
********************************************/
const EventLogsTableModel = require('./eventLogsTable.model');
const EventLogsTable = EventLogsTableModel(sequelize, DataTypes);
EventLogsTable.removeAttribute('id');  // a different, auto-populated primary key is used in the DB


/********************************************
  AIS / Airports Models
********************************************/
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

const FuelStorageConditionCategoriesModel = require('./fuelStorageConditionCategoriesView.model');
const FuelStorageConditionCategories = FuelStorageConditionCategoriesModel(sequelize, DataTypes);
FuelStorageConditionCategories.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const FuelStorageUnitsAllModel = require('./fuelStorageUnitsAllView.model');
const FuelStorageUnitsAll = FuelStorageUnitsAllModel(sequelize, DataTypes);
FuelStorageUnitsAll.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined


/********************************************
  User Models
********************************************/
/*****************************
  User Profiles
*****************************/
// Basic user profile information formatted for the "Select a User" SELECT object
const UsersAllDDLModel = require('./usersAllDDL.model');
const UsersAllDDL = UsersAllDDLModel(sequelize, DataTypes);
UsersAllDDL.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined
// View used to read Website User's data
const UsersAllViewModel = require('./usersAllView.model');
const UsersAllView = UsersAllViewModel(sequelize, DataTypes);
UsersAllView.removeAttribute('id');  // The default [id] column is not used in this table
// Table reference used for writing user profile data to the database
const UsersTableModel = require('./usersTable.model');
const UsersTable = UsersTableModel(sequelize, DataTypes);
UsersTable.removeAttribute('id');  // The default [id] column is not used in this table
// View used for reading user profile data
const UserProfilesModel = require('./userProfiles.model');
const UserProfiles = UserProfilesModel(sequelize, DataTypes);
UserProfiles.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined
/*****************************
  User Permissions
*****************************/
// View used for reading all user permission data (for loading into the "Select a User Permission" SELECT object)
const UserPermissionsAllDDLModel = require('./userPermissionsAllDDL.model');
const UserPermissionsAllDDL = UserPermissionsAllDDLModel(sequelize, DataTypes);
UserPermissionsAllDDL.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined
// View used for reading active user permission data (for authorization checking)
const UserPermissionsActiveModel = require('./userPermissionsActive.model');
const UserPermissionsActive = UserPermissionsActiveModel(sequelize, DataTypes);
UserPermissionsActive.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined
// View used for reading all user permission data (for data mgmt)
const UserPermissionsAllViewModel = require('./userPermissionsAllView.model');
const UserPermissionsAllView = UserPermissionsAllViewModel(sequelize, DataTypes);
UserPermissionsAllView.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined


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
  // Administrative
  EventLogsTable,
  // Users
  UserProfiles,
  UsersAllDDL,
  UsersAllView,
  UsersTable,
  UserPermissionsActive,
  UserPermissionsAllDDL,
  UserPermissionsAllView,
  // AIS - Airports
  NationalRegions,
  AirportsTable,
  AirportsCurrent,
  AISContentTypeCategories,
  LFOwnerTypeCategories,
  FuelStorageConditionCategories,
  FuelStorageUnitsAll
};