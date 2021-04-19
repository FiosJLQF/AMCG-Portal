///////////////////////////////////////////////////////////////////////////////////
// Airports (Current)
///////////////////////////////////////////////////////////////////////////////////

//const { STRING } = require("sequelize/types");

module.exports = (sequelize, DataTypes) => {
    const AirportsCurrent = sequelize.define('vwAirportsCurrent', {
        LFLocationID_FAA:      DataTypes.STRING,
        LFName_FAA:            DataTypes.STRING,
        LFAddress_FAA:         DataTypes.STRING,
        LFCityName_FAA:        DataTypes.STRING,
        LFStateName_FAA:       DataTypes.STRING,
        LFAddressCSZ_FAA:      DataTypes.STRING,
        LFEmail:               DataTypes.STRING,
        LFWebsite:             DataTypes.STRING,
        LFNotes:               DataTypes.STRING,
        LFOwnerName_FAA:       DataTypes.STRING,
        LFOwnerAddress_FAA:    DataTypes.STRING,
        LFOwnerAddressCSZ_FAA: DataTypes.STRING,
        LFOwnerPhone_FAA:      DataTypes.STRING,
        LFOwnerFax:            DataTypes.STRING,
        LFOwnerEmail:          DataTypes.STRING,
        LFOwnerType:           DataTypes.STRING,
        LFOwnerLogoFilename:   DataTypes.STRING,
//        LFOwnerLogoURL:        DataTypes.STRING,
        LFOwnerNotes:          DataTypes.STRING,
        // Format data for "Matching Airports" DDL
        optionid:  {
            type:  DataTypes.STRING,
            field: 'LFLocationID_FAA'},
            optiontext:  {
                type:  DataTypes.STRING,
                field: 'LFName_FAA'}
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return AirportsCurrent;
};