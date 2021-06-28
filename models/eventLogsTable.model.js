///////////////////////////////////////////////////////////////////////////////////
// Event Logs Table
///////////////////////////////////////////////////////////////////////////////////

module.exports = (sequelize, DataTypes) => {
    const EventLogsTableTest = sequelize.define('tblAdmin_EventLogs', {
//        SponsorID: {
//            type: DataTypes.INTEGER//,
//            primaryKey: true
//        },
        EventDate:                   DataTypes.DATE,
        ProcessName:                 DataTypes.STRING,
        EventObject:                 DataTypes.STRING,
        EventStatus:                 DataTypes.STRING,
        EventDescription:            DataTypes.STRING,
        EventDuration:               DataTypes.NUMBER,
        EventRows:                   DataTypes.NUMBER,
        EventUserID:                 DataTypes.NUMBER,
        EventCode:                   DataTypes.NUMBER
    }, {
        schema: 'amcgportal',
        freezeTableName: true,  // don't have Sequelize automatically pluralize the table name
        timestamps: false,  // don't add the timestamp attributes (updatedAt, createdAt)
    });
    return EventLogsTableTest;
};