///////////////////////////////////////////////////////////////////////////////////
// List of all Users (with supplemental data)
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const UsersAllView = sequelize.define('vwWebsiteUsersAll', {
        UserID:         DataTypes.INTEGER,
        Username:       DataTypes.STRING,
        UserFName:      DataTypes.STRING,
        UserLName:      DataTypes.STRING,
        UserTelephone:  DataTypes.STRING,
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return UsersAllView;
};