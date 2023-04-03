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
        "https://www.googleapis.com/auth/fitness.activity.write",

        "https://www.googleapis.com/auth/fitness.location.read",
        "https://www.googleapis.com/auth/fitness.location.write",

        "https://www.googleapis.com/auth/fitness.nutrition.read",
        "https://www.googleapis.com/auth/fitness.nutrition.write",

        "https://www.googleapis.com/auth/fitness.blood_glucose.read",
        "https://www.googleapis.com/auth/fitness.blood_glucose.write",

        "https://www.googleapis.com/auth/fitness.blood_pressure.read",
        "https://www.googleapis.com/auth/fitness.blood_pressure.write",

        "https://www.googleapis.com/auth/fitness.body.read",
        "https://www.googleapis.com/auth/fitness.body.write",

        "https://www.googleapis.com/auth/fitness.body_temperature.read",
        "https://www.googleapis.com/auth/fitness.body_temperature.write",

        "https://www.googleapis.com/auth/fitness.reproductive_health.read",
        "https://www.googleapis.com/auth/fitness.reproductive_health.write",

        "https://www.googleapis.com/auth/fitness.heart_rate.read",
        "https://www.googleapis.com/auth/fitness.heart_rate.write"
    ]
}))

app.get("/google/callback", passport.authenticate('google', {
    successRedirect: '/step',
    failureRedirect: '/auth/failure',
}))

app.get("/auth/failure", (req, res) => {
    res.send('something went wrong')
})

let token = "ya29.a0Ael9sCOtY95H_AtKYhgWf5IemIDg1MmLNU9A_51pNGnfu0JbncMHC-YuNZh3lc6Rgkv36NE6NbXccPiYSrLnTjeMOFAVuGY_oAVrhkxzUajxQdZcd4hLq6X6O_C2BrJi92A6l-8pqL9iolwuXdUt0p5JL48raCgYKAe0SARESFQF4udJhgTP6EWy3vo1rUUh4lG-vQQ0163"
const stepStreamId = "derived:com.google.step_count.delta:407408718192:Example Manufacturer:ExampleTablet:1000001:MyDataSourceNew";
const speedStreamId = "derived:com.google.speed.summary:407408718192:ExampleManufacturer:ExampleTablet:1000001:MyBodyTempSource";
const caloriesStreamId = "derived:com.google.calories.bmr.summary:407408718192:ExampleManufacturer:ExampleTablet:1000001:MyBodyTempSource";
const caloriesBurntStreamId = "derived:com.google.calories.expended:407408718192:ExampleManufacturer:ExampleTablet:1000001:MyWorkoutSource";
const cyclingCadence = "derived:com.google.cycling.pedaling.cadence:407408718192:ExampleManufacturer:ExampleTablet:1000001:MyWorkoutSource";
const cyclingCumul = "derived:com.google.cycling.pedaling.cumulative:407408718192:ExampleManufacturer:ExampleTablet:1000001:MyCyclingPedalingCumulativeSource";
const powerStreamId = "derived:com.google.power.sample:407408718192:ExampleManufacturer:ExampleTablet:1000001:MyWorkoutSource";


app.get("/step", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + token
            },
            "Content-Type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                "aggregateBy": [{
                    "dataSourceId": stepStreamId
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": 1454284800000,
                "endTimeMillis": 1455062400000
            }
        })
        const stepArray = result.data.bucket;
        res.json({ data: stepArray, url: "http://localhost:3000/speed" });
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

app.get("/speed", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + token
            },
            "Content-Type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                "aggregateBy": [{
                    "dataSourceId": speedStreamId
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": 1454284800000,
                "endTimeMillis": 1455062400000
            }
        })
        const stepArray = result.data.bucket;
        res.json({ data: stepArray, url: "http://localhost:3000/cals" });
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

app.get("/cals", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + token
            },
            "Content-Type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                "aggregateBy": [{
                    "dataSourceId": caloriesStreamId
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": 1454284800000,
                "endTimeMillis": 1455062400000
            }
        })
        const stepArray = result.data.bucket;
        res.json({ data: stepArray, url: "http://localhost:3000/calsburnt" });
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

app.get("/calsburnt", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + token
            },
            "Content-Type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                "aggregateBy": [{
                    "dataSourceId": caloriesBurntStreamId
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": 1454284800000,
                "endTimeMillis": 1455062400000
            }
        })
        const stepArray = result.data.bucket;
        res.json({ data: stepArray, url: "http://localhost:3000/cyclingCadence" });
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

app.get("/cyclingCadence", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + token
            },
            "Content-Type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                "aggregateBy": [{
                    "dataSourceId": cyclingCadence
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": 1454284800000,
                "endTimeMillis": 1455062400000
            }
        })
        const stepArray = result.data.bucket;
        res.json({ data: stepArray, url: "http://localhost:3000/cyclingCumul" });
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

app.get("/cyclingCumul", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + token
            },
            "Content-Type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                "aggregateBy": [{
                    "dataSourceId": cyclingCumul
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": 1454284800000,
                "endTimeMillis": 1455062400000
            }
        })
        const stepArray = result.data.bucket;
        res.json({ data: stepArray, url: "http://localhost:3000/powerStreamId" });
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

app.get("/powerStreamId", isLoggedIn, async (req, res) => {
    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + token
            },
            "Content-Type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                "aggregateBy": [{
                    "dataSourceId": powerStreamId
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": 1454284800000,
                "endTimeMillis": 1455062400000
            }
        })
        const stepArray = result.data.bucket;
        res.json({ data: stepArray, url: "http://localhost:3000/step" });
    } catch (error) {
        console.log(error);
        res.send("error");
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