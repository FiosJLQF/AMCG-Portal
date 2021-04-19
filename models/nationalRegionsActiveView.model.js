///////////////////////////////////////////////////////////////////////////////////
// National Regions (e.g., states, provinces, etc.), active only
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const NationalRegionsActive = sequelize.define('vwNationalRegionsActive', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext: {
            type: DataTypes.STRING
        },
        NationalRegion:                  DataTypes.STRING,
        NationalRegionAbbreviation:      DataTypes.STRING,
        NationalRegionCountry:           DataTypes.STRING,
        NationalRegionSortOrder:         DataTypes.INTEGER
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return  NationalRegionsActive;
};