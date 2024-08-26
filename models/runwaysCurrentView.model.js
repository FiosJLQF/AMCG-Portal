///////////////////////////////////////////////////////////////////////////////////
// Runways (current Effective Date)
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const RunwaysCurrentView = sequelize.define('vwRunwaysCurrent', {
        RecordID:                     DataTypes.STRING,
        LFLocationID:                 DataTypes.STRING,
        RWID:                         DataTypes.STRING,
        RWLength:                     DataTypes.STRING,
        RWWidth:                      DataTypes.STRING,
        RWSurfaceType:                DataTypes.STRING,
        RWSurfaceTreatment:           DataTypes.STRING,
        RWPavementClass:              DataTypes.STRING,
        RWWBCSingle:                  DataTypes.STRING,
        RWWBCDual:                    DataTypes.STRING,
        RWWBCDualTandem:              DataTypes.STRING,
        RWWBCDblDualTandem:           DataTypes.STRING,
        ILS1End:                      DataTypes.STRING,
        ILS1Type:                     DataTypes.STRING,
        ILS2End:                      DataTypes.STRING,
        ILS2Type:                     DataTypes.STRING,
        optionid:                     DataTypes.STRING,
        optiontext:                   DataTypes.STRING,
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return RunwaysCurrentView;
};