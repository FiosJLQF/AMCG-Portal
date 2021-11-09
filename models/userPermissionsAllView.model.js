///////////////////////////////////////////////////////////////////////////////////
// Website User Permissions
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const UserPermissionsAllView = sequelize.define('vwWebsiteUserPermissionsAll', {
        WebsiteUserPermissionID: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        UserID:                   DataTypes.NUMBER,
        Username:                 DataTypes.STRING,
        PermissionCategoryID:     DataTypes.NUMBER,
        EffectiveDate:            DataTypes.DATE,
        ExpirationDate:           DataTypes.DATE,
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
    return UserPermissionsAllView;
};