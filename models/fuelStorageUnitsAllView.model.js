///////////////////////////////////////////////////////////////////////////////////
// Fuel Storage Units (all)
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const FuelStorageUnitsAllView = sequelize.define('vwFuelStorageUnits', {
        LFLocationID:                 DataTypes.STRING,
        FuelStorageUnitID:            DataTypes.STRING,
        FuelStorageConstructionDate:  DataTypes.STRING,
        FuelStorageConstructionCost:  DataTypes.STRING,
        FuelStorageCondition:         DataTypes.INTEGER,
        FuelStorageType:              DataTypes.INTEGER,
        FuelStorageFuelGrade:         DataTypes.INTEGER,
        FuelStorageCapacity:          DataTypes.DECIMAL,
        FuelStorageUnitDesc:          DataTypes.STRING,
        optionid:                     DataTypes.STRING,
        optiontext:                   DataTypes.STRING,
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return FuelStorageUnitsAllView;
};