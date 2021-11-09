///////////////////////////////////////////////////////////////////////////////////
// User Permission IDs, formatted for the search criteria DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const UserPermissionsAllDDL = sequelize.define('vwWebsiteUserPermissionsAllDDL', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext: {
            type: DataTypes.STRING
        },
        UserID: DataTypes.STRING
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return UserPermissionsAllDDL;
};
