///////////////////////////////////////////////////////////////////////////////////
// Airports (Current)
///////////////////////////////////////////////////////////////////////////////////

//const { STRING } = require("sequelize/types");

module.exports = (sequelize, DataTypes) => {
    const AirportsCurrent = sequelize.define('vwAirportsCurrent', {
        LFLocationID_FAA:            DataTypes.STRING,
        LFName_FAA:                  DataTypes.STRING,
        LFAddress_FAA:               DataTypes.STRING,
        LFCityName_FAA:              DataTypes.STRING,
        LFStateName_FAA:             DataTypes.STRING,
        LFAddressCSZ_FAA:            DataTypes.STRING,
        LFEmail:                     DataTypes.STRING,
        LFWebsite:                   DataTypes.STRING,
        LFNotes:                     DataTypes.STRING,
        LFOwnerName_FAA:             DataTypes.STRING,
        LFOwnerAddress_FAA:          DataTypes.STRING,
        LFOwnerAddressCSZ_FAA:       DataTypes.STRING,
        LFOwnerPhone_FAA:            DataTypes.STRING,
        LFOwnerFax:                  DataTypes.STRING,
        LFOwnerEmail:                DataTypes.STRING,
        LFOwnerType:                 DataTypes.STRING,
        LFOwnerLogoFilename:         DataTypes.STRING,
//        LFOwnerLogoURL:           DataTypes.STRING,
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
        LFMgrName_FAA:               DataTypes.STRING,
        LFMgrAddress_FAA:            DataTypes.STRING,
        LFMgrAddressCSZ_FAA:         DataTypes.STRING,
        LFMgrPhone_FAA:              DataTypes.STRING,
        LFMgrFax:                    DataTypes.STRING,
        LFMgrEmail:                  DataTypes.STRING,
        LFMgrNotes:                  DataTypes.STRING,
        LFMgrOrgChartFilename:       DataTypes.STRING,
//        LFMgrOrgChartURL:         DataTypes.STRING,
        LFLatitude:                  DataTypes.STRING,
        LFLongitude:                 DataTypes.STRING,
        LFElevation:                 DataTypes.STRING,
        LFAeroSectionalChart:        DataTypes.STRING,
        LFFAARegionCode:             DataTypes.STRING,
        LFFAARegionCodeDesc:         DataTypes.STRING,
        LFFAADistrictCode:           DataTypes.STRING,
        LFLocationNotes:             DataTypes.STRING,
        LFOwnershipType:             DataTypes.STRING,
        LFOwnershipTypeDesc:         DataTypes.STRING,
        LFFacilityUse:               DataTypes.STRING,
        LFFacilityUseDesc:           DataTypes.STRING,
        LFLongestRunwayCategory:     DataTypes.STRING,
        LFSystemAirport:             DataTypes.STRING,
        LFSystemAirportIDs:          DataTypes.STRING,
        LFCompsEffectiveDate:        DataTypes.STRING,
        LFComparablesIDs:            DataTypes.STRING,
        LFCompetitivesIDs:           DataTypes.STRING,
        NPIASServiceLevel:           DataTypes.STRING,
        NPIASServiceLevelDesc:       DataTypes.STRING,
        NPIASHubClassification:      DataTypes.STRING,
        NPIASHubClassificationDesc:  DataTypes.STRING,
        NPIASGACategory:             DataTypes.STRING,
        LFClassificationNotes:       DataTypes.STRING,

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