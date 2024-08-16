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

//// Test the DB Connection
//sequelize.authenticate().then(() => {
//    console.log("Success!");
//  }).catch((err) => {
//    console.log(err);
//});


/********************************************
  AIS / Airports Models
********************************************/
const AirportsTableModel = require('./airportsTable.model');
const AirportsTable = AirportsTableModel(sequelize, DataTypes);
AirportsTable.removeAttribute('id');  // a different, auto-populated primary key is used in the DB

const AirportsHxModel = require('./airportsHx.model');
const AirportsHx = AirportsHxModel(sequelize, DataTypes);
AirportsHx.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

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

const FuelStorageTypeCategoriesModel = require('./fuelStorageTypeCategoriesView.model');
const FuelStorageTypeCategories = FuelStorageTypeCategoriesModel(sequelize, DataTypes);
FuelStorageTypeCategories.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const FuelStorageFuelGradeCategoriesModel = require('./fuelStorageFuelGradeCategoriesView.model');
const FuelStorageFuelGradeCategories = FuelStorageFuelGradeCategoriesModel(sequelize, DataTypes);
FuelStorageFuelGradeCategories.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined

const FuelStorageUnitsAllModel = require('./fuelStorageUnitsAllView.model');
const FuelStorageUnitsAll = FuelStorageUnitsAllModel(sequelize, DataTypes);
FuelStorageUnitsAll.removeAttribute('id');  // this is an non-updatable view and does not have a PK defined


/**************************************************************************************************
  Export objects
**************************************************************************************************/
module.exports = {
  // AIS - Airports
  AirportsTable,
  AirportsCurrent,
  AirportsHx,
  NationalRegions,
  AISContentTypeCategories,
  LFOwnerTypeCategories,
  FuelStorageConditionCategories,
  FuelStorageTypeCategories,
  FuelStorageFuelGradeCategories,
  FuelStorageUnitsAll
};