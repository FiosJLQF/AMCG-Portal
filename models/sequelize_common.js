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


/********************************************
  Administrative Models
********************************************/
const EventLogsTableModel = require('./eventLogsTable.model');
const EventLogsTable = EventLogsTableModel(sequelize, DataTypes);
EventLogsTable.removeAttribute('id');  // a different, auto-populated primary key is used in the DB


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
// Table reference used for writing user permission data to the database
const UserPermissionsTableModel = require('./userPermissionsTable.model');
const UserPermissionsTable = UserPermissionsTableModel(sequelize, DataTypes);
UserPermissionsTable.removeAttribute('id');  // The default [id] column is not used in this table
// Basic user permission category information formatted for the "Select a User Permission Category" SELECT object
const UserPermissionCategoriesAllDDLModel = require('./userPermissionCategoriesAllDDL.model');
const UserPermissionCategoriesAllDDL = UserPermissionCategoriesAllDDLModel(sequelize, DataTypes);

/**************************************************************************************************
  Export objects
**************************************************************************************************/
module.exports = {
  // Administrative
  EventLogsTable,
  // Users
//  UserProfiles,
  UsersAllDDL,
  UsersAllView,
  UsersTable,
  // User Permissions
  UserPermissionsActive,
  UserPermissionsAllDDL,
  UserPermissionsAllView,
  UserPermissionsTable,
  UserPermissionCategoriesAllDDL
};