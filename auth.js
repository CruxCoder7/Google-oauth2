const passport = require("passport")
const GoogleStrategy = require('passport-google-oauth2').Strategy

const GOOGLE_CLIENT_ID = "586194342035-1gnp79kdkppd9se2em7jf0tbr863vct9.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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"


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback",
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        profile.token = accessToken;
        console.log(profile);
        return done(null, profile, accessToken, refreshToken)
    }
))

passport.serializeUser(function (user, done, accessToken, refreshToken) {
    done(null, user, accessToken, refreshToken);
})
passport.deserializeUser(function (user, done, accessToken, refreshToken) {
    done(null, user, accessToken, refreshToken);
})