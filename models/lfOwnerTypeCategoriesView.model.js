///////////////////////////////////////////////////////////////////////////////////
// LF Owner Type Categories, formatted for the search criteria DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const LFOwnerTypeCategories = sequelize.define('vwLFOwnerTypeCategories', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext: {
            type: DataTypes.STRING
        },
        LFOwnerTypeCategory:             DataTypes.STRING,
        LFOwnerTypeCategorySortOrder:    DataTypes.INTEGER,
        LFOwnerTypeCategoryIsActive:     DataTypes.BOOLEAN
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return  LFOwnerTypeCategories;
};