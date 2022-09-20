///////////////////////////////////////////////////////////////////////////////////
// User Permissions Table
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const UserPermissionsTable = sequelize.define('tblWebsiteUserPermissions', {
        WebsiteUserPermissionID: {
            type: DataTypes.INTEGER//,
//            primaryKey: true
        },
        UserID:                   DataTypes.NUMBER,
        PermissionCategoryID:     DataTypes.NUMBER,
        ObjectValues:             DataTypes.STRING,
        EffectiveDate:            DataTypes.DATE,
        ExpirationDate:           DataTypes.DATE,
        CanCreate:                DataTypes.BOOLEAN,
        CanRead:                  DataTypes.BOOLEAN,
        CanUpdate:                DataTypes.BOOLEAN,
        CanDelete:                DataTypes.BOOLEAN,
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return UserPermissionsTable;
};