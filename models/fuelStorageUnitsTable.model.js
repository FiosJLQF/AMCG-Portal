///////////////////////////////////////////////////////////////////////////////////
// Fuel Storage Units Table
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const FuelStorageUnitsTable = sequelize.define('tblFuelStorageUnits', {
        RecordID: {
            type: DataTypes.INTEGER//,
//            primaryKey: true
        },
        LFLocationID:                 DataTypes.STRING,
        FuelStorageConstructionDate:  DataTypes.STRING,
        FuelStorageCondition:         DataTypes.STRING,
        FuelStorageType:              DataTypes.STRING,
        FuelStorageFuelGrade:         DataTypes.STRING,
        FuelStorageCapacity:          DataTypes.STRING,
        FuelStorageConstructionCost:  DataTypes.STRING,
        FuelStorageUnitID:            DataTypes.STRING
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return FuelStorageUnitsTable;
};
