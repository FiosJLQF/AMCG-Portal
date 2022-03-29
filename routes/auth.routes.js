///////////////////////////////////////////////////////////////////////////////////
// Required External Modules
///////////////////////////////////////////////////////////////////////////////////
const express = require("express");
const router = express.Router();
const passport = require("passport");
const querystring = require("query-string");
require("dotenv").config();


///////////////////////////////////////////////////////////////////////////////////
// Routes Definitions
///////////////////////////////////////////////////////////////////////////////////
router.get( "/login", 
    passport.authenticate("auth0", {
      scope: "openid email profile"
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

router.get("/callback", (req, res, next) => {

  console.log('Entered router.get callback');

  passport.authenticate("auth0", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      const returnTo = req.session.returnTo;
      console.log(`returnTo: ${returnTo}`);
      delete req.session.returnTo;
      res.redirect(returnTo || "/switchboard");
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
    req.logOut();
    let returnTo = req.protocol + "://" + req.hostname;
    const port = req.socket.localPort;
    if (port !== undefined && port !== 80 && port !== 443) {
      returnTo =
        process.env.NODE_ENV === "production"
          ? `${returnTo}/`
          : `${returnTo}:${port}/`;
    }
    const logoutURL = new URL(
      `https://${process.env.AUTH0_DOMAIN}/v2/logout`
    );
    const searchString = querystring.stringify({
      client_id: process.env.AUTH0_CLIENT_ID,
      returnTo: returnTo
    });
    console.log(`searchString: ${searchString}`);
    logoutURL.search = searchString;
    res.redirect(logoutURL);
  });


///////////////////////////////////////////////////////////////////////////////////
// Module Exports
///////////////////////////////////////////////////////////////////////////////////
module.exports = router;
