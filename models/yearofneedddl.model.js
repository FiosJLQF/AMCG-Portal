///////////////////////////////////////////////////////////////////////////////////
// Year Of Need Options, formatted for the search criteria DDL
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const YearOfNeedCategoriesDDL = sequelize.define('vwYearOfNeedCategoriesDDL', {
        optionid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        optiontext: {
            type: DataTypes.STRING
        }
    }, {
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return YearOfNeedCategoriesDDL;
};