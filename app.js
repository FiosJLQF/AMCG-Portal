// Import and require external libraries/files
const compression = require('compression');
const express = require('express');
const routes = require('./routes');
const path = require('path');
const bodyParser = require('body-parser');
const pg = require('pg');
const app = express();
const port = process.env.PORT || 3000;
//const eventRouter = express.Router();

// Set up local variables and file locations
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));  // publicly-accessible files (such as images and css)

// FINISH THIS LATER!
//app.use(bodyParser.urlencoded({extended: false}));

app.set('views', 'views');  // HTML pages and templates, using EJS for templating
app.set('view engine', 'ejs');  // Sets the EJS engine
app.use('/', routes);  // imports the root folder URL endpoint routes from index.js
app.use('/sponsors', require('./routes/sponsor_routes'));  // imports the "sponsors" URL endpoint routes from sponsors.js
//app.use('/scholarships', require('./routes/scholarships'));  // imports the "scholarships" URL endpoint routes from scholarships.js

// For local testing only
app.listen(port, function(err) {
    console.log(`The server is running on port ${port}`);
    console.log(__dirname);
    console.log(__dirname + '/public');
})

app.use((err, req, res, next) => {
    res.json(err);
});

/*
// Test DB
const db = require('./db/db_config.js');
db.authenticate()
  .then( () => console.log('Database connected...'))
  .catch( err => console.log('Error: ' + err))
*/

module.exports = app;