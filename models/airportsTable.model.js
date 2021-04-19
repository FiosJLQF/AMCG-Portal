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
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return AirportsTable;
};