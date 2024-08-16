///////////////////////////////////////////////////////////////////////////////////
// Fuel Storage FuelGrade Categories, formatted for the search criteria DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const FuelStorageFuelGradeCategories = sequelize.define('vwFuelStorageFuelGradeCategories', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext:                        DataTypes.STRING,
        FuelStorageFuelGradeCategory:           DataTypes.STRING,
        FuelStorageFuelGradeCategorySortOrder:  DataTypes.INTEGER,
        FuelStorageFuelGradeCategoryIsActive:   DataTypes.BOOLEAN
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return  FuelStorageFuelGradeCategories;
};