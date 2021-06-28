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
        LFAdvBodyNotes:              DataTypes.STRING
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return AirportsTable;
};