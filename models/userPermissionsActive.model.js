///////////////////////////////////////////////////////////////////////////////////
// Website User Permissions
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const UserPermissionsActive = sequelize.define('vwWebsiteUserPermissionsActive', {
        WebsiteUserPermissionID: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        UserID:                   DataTypes.NUMBER,
        Username:                 DataTypes.STRING,
        PermissionCategoryID:     DataTypes.NUMBER,
        ObjectValues:             DataTypes.STRING,
        CanCreate:                DataTypes.BOOLEAN,
        CanRead:                  DataTypes.BOOLEAN,
        CanUpdate:                DataTypes.BOOLEAN,
        CanDelete:                DataTypes.BOOLEAN,
    }, {
    schema: 'amcgportal',
    freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
    timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return UserPermissionsActive;
};