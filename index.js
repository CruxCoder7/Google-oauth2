const express = require("express");
const session = require('express-session');
const passport = require("passport");
const axios = require("axios");

require("./auth")

const app = express();
app.use(session({ secret: "secret", saveUninitialized: true, resave: true }));
app.use(passport.initialize())
app.use(passport.session());


const isLoggedIn = (req, res, next) => {

    req.user ? next() : res.sendStatus(401);
}

app.get("/", (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google</a>');

})

app.get("/auth/google", passport.authenticate('google', {
    scope: [
        'email',
        'profile',
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/fitness.activity.write"
    ]
}))

app.get("/google/callback", passport.authenticate('google', {
    successRedirect: '/getData',
    failureRedirect: '/auth/failure',
}))

app.get("/auth/failure", (req, res) => {
    res.send('something went wrong')
})


app.get("/getData", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + req.user.token
            },
            "Content-Type": "application/json",
            url: `https://www.googleapis.com/fitness/v1/users/me/dataSources`,
            data: {
                "dataStreamName": "MyStepSource2",
                "type": "derived",
                "application": {
                    "detailsUrl": "http://example.com",
                    "name": "Foo Example App",
                    "version": "1"
                },
                "dataType": {
                    "field": [
                        {
                            "name": "steps",
                            "format": "integer"
                        }
                    ],
                    "name": "com.google.step_count.delta"
                },
                "device": {
                    "manufacturer": req.user.displayName,
                    "model": "New",
                    "type": "tablet",
                    "uid": "1000001",
                    "version": "1.0"
                }
            }
        })
        const dataStreamId = result.data.dataStreamId
        try {
            const result = await axios({
                method: "POST",
                headers: {
                    authorization: "Bearer " + req.user.token
                },
                "Content-Type": "application/json",
                url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
                data: {
                    "aggregateBy": [{
                        "dataSourceId": dataStreamId
                    }],
                    "bucketByTime": { "durationMillis": 86400000 },
                    "startTimeMillis": 1454284800000,
                    "endTimeMillis": 1455062400000
                }
            })
            const stepArray = result.data.bucket;
            res.json({ data: stepArray });
        } catch (error) {
            console.log(error);
            res.send("errorrrrr");
        }
    } catch (error) {
        console.log(error);
        res.send("error")
    }
})


app.get('/logout', (req, res) => {
    req.logout(() => {
        console.log("done");
    })
    req.session.destroy();
    res.send('BYE!')
})

app.listen(3000, () => {
    console.log("llistening on 3000");
})