///////////////////////////////////////////////////////////////////////////////////
// AIS Content Type Categories, formatted for the search criteria DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const AISContentTypeCategories = sequelize.define('vwAISContentTypeCategories', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext: {
            type: DataTypes.STRING
        },
        AISContentTypeCategory:             DataTypes.STRING,
        AISContentTypeCategorySortOrder:    DataTypes.INTEGER,
        AISContentTypeCategoryIsActive:     DataTypes.BOOLEAN
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return  AISContentTypeCategories;
};