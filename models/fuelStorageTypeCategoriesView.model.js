///////////////////////////////////////////////////////////////////////////////////
// Fuel Storage Type Categories, formatted for the search criteria DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const FuelStorageTypeCategories = sequelize.define('vwFuelStorageTypeCategories', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext:                        DataTypes.STRING,
        FuelStorageTypeCategory:           DataTypes.STRING,
        FuelStorageTypeCategorySortOrder:  DataTypes.INTEGER,
        FuelStorageTypeCategoryIsActive:   DataTypes.BOOLEAN
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return  FuelStorageTypeCategories;
};