///////////////////////////////////////////////////////////////////////////////////
// Website User Permissions Options, formatted for DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const UserPermissionCategoriesAllDDL = sequelize.define('vwWebsiteUserPermissionCategoriesDDL', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext: {
            type: DataTypes.STRING
        }
    }, {
        schema: 'public',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return UserPermissionCategoriesAllDDL;
};
