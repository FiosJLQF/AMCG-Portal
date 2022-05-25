///////////////////////////////////////////////////////////////////////////////////
// Airports Table
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const AirportsTable = sequelize.define('tblAirports', {
        LFLocationID: {
            type: DataTypes.STRING,
//            primaryKey: true
        },
        LFWebsite:                   DataTypes.STRING,
        LFEmail:                     DataTypes.STRING,
        LFNotes:                     DataTypes.STRING,
        LFOwnerFax:                  DataTypes.STRING,
        LFOwnerEmail:                DataTypes.STRING,
        LFOwnerType:                 DataTypes.STRING,
        LFOwnerLogoFilename:         DataTypes.STRING,
        LFOwnerNotes:                DataTypes.STRING,
        LFGovBodyName:               DataTypes.STRING,
        LFGovBodyMemberCount:        DataTypes.STRING,
        LFGovBodyTerm:               DataTypes.STRING,
        LFGovBodyTermMax:            DataTypes.STRING,
        LFGovBodyNotes:              DataTypes.STRING,
        LFAdvBodyName:               DataTypes.STRING,
        LFAdvBodyMemberCount:        DataTypes.STRING,
        LFAdvBodyTerm:               DataTypes.STRING,
        LFAdvBodyTermMax:            DataTypes.STRING,
        LFAdvBodyNotes:              DataTypes.STRING,
        LFOpName:                    DataTypes.STRING,
        LFOpAddress:                 DataTypes.STRING,
        LFOpCity:                    DataTypes.STRING,
        LFOpState:                   DataTypes.STRING,
        LFOpZip:                     DataTypes.STRING,
        LFOpPhone:                   DataTypes.STRING,
        LFOpFax:                     DataTypes.STRING,
        LFOpEmail:                   DataTypes.STRING,
        LFOpType:                    DataTypes.STRING,
        LFOpNotes:                   DataTypes.STRING,
        LFMgrFax:                    DataTypes.STRING,
        LFMgrEmail:                  DataTypes.STRING,
        LFMgrNotes:                  DataTypes.STRING,
        LFMgrOrgChartFilename:       DataTypes.STRING,
        LFLocationNotes:             DataTypes.STRING,
        LFSystemAirport:             DataTypes.STRING,
        LFSystemAirportIDs:          DataTypes.STRING,
        LFCompsEffectiveDate:        DataTypes.STRING,
        LFComparablesIDs:            DataTypes.STRING,
        LFCompetitivesIDs:           DataTypes.STRING,
        LFClassificationNotes:       DataTypes.STRING
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return AirportsTable;
};