///////////////////////////////////////////////////////////////////////////////////
// Airports (Hx)
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const AirportsHx = sequelize.define('vwAirportsHx', {
        LFLocationID_FAA:              DataTypes.STRING,
        LFName_FAA:                    DataTypes.STRING,
        LFAddress_FAA:                 DataTypes.STRING,
        LFAddressCSZ_FAA:              DataTypes.STRING,
        LFOwnerName_FAA:               DataTypes.STRING,
        LFOwnerAddress_FAA:            DataTypes.STRING,
        LFOwnerAddressCSZ_FAA:         DataTypes.STRING,
        LFOwnerPhone_FAA:              DataTypes.STRING,
        LFMgrName_FAA:                 DataTypes.STRING,
        LFMgrAddress_FAA:              DataTypes.STRING,
        LFMgrAddressCSZ_FAA:           DataTypes.STRING,
        LFMgrPhone_FAA:                DataTypes.STRING,
        LFLatitude:                    DataTypes.STRING,
        LFLongitude:                   DataTypes.STRING,
        LFElevation:                   DataTypes.STRING,
        LFAeroSectionalChart:          DataTypes.STRING,
        LFFAARegionCodeDesc:           DataTypes.STRING,
        LFFAADistrictCode:             DataTypes.STRING,
        LFOwnershipTypeDesc_FAA:       DataTypes.STRING,
        LFFacilityUseDesc_FAA:         DataTypes.STRING,
        LFLongestRunwayCategory_FAA:   DataTypes.STRING,
        LFServiceLevelDesc_NPIAS:      DataTypes.STRING,
        LFHubClassificationDesc_NPIAS: DataTypes.STRING,
        LFGACategory_NPIAS:            DataTypes.STRING,
        LFAcreage_FAA:                 DataTypes.STRING,
        LFLandSF_FAA:                  DataTypes.STRING,

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
    return AirportsHx;
};