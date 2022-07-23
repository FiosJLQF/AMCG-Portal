///////////////////////////////////////////////////////////////////////////////////
// Fuel Storage Condition Categories, formatted for the search criteria DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const FuelStorageConditionCategories = sequelize.define('vwFuelStorageConditionCategories', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext: {
            type: DataTypes.STRING
        },
        FuelStorageConditionCategory:           DataTypes.STRING,
        FuelStorageConditionCategorySortOrder:  DataTypes.INTEGER,
        FuelStorageConditionCategoryIsActive:   DataTypes.BOOLEAN
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return  FuelStorageConditionCategories;
};