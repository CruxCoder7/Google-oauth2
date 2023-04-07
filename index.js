const express = require("express");
const session = require("express-session");
const passport = require("passport");
const axios = require("axios");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;

require("./auth");

const app = express();
app.use(session({ secret: "secret", saveUninitialized: true, resave: true }));
app.use(passport.initialize());
app.use(passport.session());

const CLIENT_ID =
  "586194342035-1gnp79kdkppd9se2em7jf0tbr863vct9.apps.googleusercontent.com";
const CLIENT_SECRET = "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";

// Replace with your own client ID, client secret, and redirect URL
const REDIRECT_URL = "http://localhost:3000/google/callback";

// Replace with the scopes you need for the Google Fitness API
const SCOPES = [
  "email",
  "profile",
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.activity.write",
  "https://www.googleapis.com/auth/fitness.location.read",
  "https://www.googleapis.com/auth/fitness.location.write",
];

// Create an OAuth2 client
const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

app.get(
  "/",
  passport.authenticate("google", {
    scope: SCOPES,
  })
);

app.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/get2",
    failureRedirect: "/auth/failure",
  })
);

app.get("/auth/failure", (req, res) => {
  res.send("something went wrong");
});

app.get("/get2", isLoggedIn, async (req, res) => {
  try {
    // Exchange the authorization code for an access token
    oauth2Client.setCredentials({
      access_token: req.user.token,
    });

    // Create a Google Fitness API client
    const fitness = google.fitness("v1");

    // Set the aggregation parameters
    const startTimeMillis = new Date("2023-01-01T00:00:00Z").getTime(); // Replace with your desired start time
    const endTimeMillis = new Date().getTime(); // Replace with your desired end time
    const timeRange = endTimeMillis - startTimeMillis; // Calculate the time range
    const maxDuration = 7 * 24 * 60 * 60 * 1000; // Maximum duration for aggregation is 7 days in milliseconds
    const numRequests = Math.ceil(timeRange / maxDuration); // Calculate the number of requests needed
    const aggregationTypes = [
      //   // activity
      "com.google.activity.segment",
      "com.google.calories.bmr",
      "com.google.calories.expended",
      "com.google.active_minutes",
      "com.google.step_count.delta",
      "com.google.step_count.cadence",
      "com.google.cycling.pedaling.cadence",
      "com.google.cycling.pedaling.cumulative",
      "com.google.power.sample",
      "com.google.activity.exercise",
      //   // location
      "com.google.cycling.wheel_revolution.rpm",
      "com.google.cycling.wheel_revolution.cumulative",
      "com.google.distance.delta",
      "com.google.location.sample",
      "com.google.speed",
      // summary
      //   "com.google.activity.summary",
      //   "com.google.calories.bmr.summary",
      //   "com.google.heart_minutes.summary",
      //   "com.google.power.summary",
      //   "com.google.location.bounding_box",
      //   "com.google.speed.summary",
    ];

    //   {
    //     dataTypeName: "com.google.cycling.pedaling.cadence",
    //     aggregation: {
    //       aggregatedDataType: {
    //         fieldName: "com.google.cycling.pedaling.cadence",
    //         type: "SUM",
    //       },
    //       bucketByActivityType: {},
    //     },
    //   }

    let datasets = [];

    try {
      // Make multiple requests with smaller time ranges
      for (let i = 0; i < numRequests; i++) {
        const startTime = startTimeMillis + i * maxDuration;
        const endTime = Math.min(startTime + maxDuration, endTimeMillis);

        // Call the aggregate method to get the aggregated dataset for the current time range
        const response = await fitness.users.dataset.aggregate({
          auth: oauth2Client,
          userId: "me",
          requestBody: {
            aggregateBy: aggregationTypes.map((dataTypeName) => ({
              dataTypeName: dataTypeName,
              // dataSourceId: `derived:${dataTypeName}:com.google.android.gms:from_activities`,
            })),
            startTimeMillis: startTime.toString(),
            endTimeMillis: endTime.toString(),
            bucketByActivityType: {},
          },
        });

        // Print the aggregated dataset
        datasets = [...datasets, ...response.data.bucket];
        //   console.log("Aggregated Dataset:");
        //   datasets.forEach((dataset) => {
        //     const startTime = new Date(
        //       parseInt(dataset.startTimeMillis)
        //     ).toISOString();
        //     const endTime = new Date(parseInt(dataset.endTimeMillis)).toISOString();
        //     console.log(`Start Time: ${startTime}`);
        //     console.log(`End Time: ${endTime}`);
        //     console.log(`Step Count: ${dataset.dataset[0].point[0].value.intVal}`);
        //     console.log("---");
        //   });
      }
    } catch (e) {
      console.log(e);
    }

    return res.json(datasets);
  } catch (error) {
    console.error("Error:", error);
  }
});

app.get("/getData", isLoggedIn, async (req, res) => {
  try {
    const result = await axios({
      method: "POST",
      headers: {
        authorization: "Bearer " + req.user.token,
      },
      "Content-Type": "application/json",
      url: `https://www.googleapis.com/fitness/v1/users/me/dataSources`,
      data: {
        dataStreamName: "MyStepSource3",
        type: "derived",
        application: {
          detailsUrl: "http://example.com",
          name: "Foo Example App",
          version: "1",
        },
        dataType: {
          field: [
            {
              name: "steps",
              format: "integer",
            },
          ],
          name: "com.google.step_count.delta",
        },
        device: {
          manufacturer: req.user.displayName,
          model: "New",
          type: "tablet",
          uid: "1000001",
          version: "1.0",
        },
      },
    });
    const dataStreamId = result.data.dataStreamId;
    try {
      const result = await axios({
        method: "POST",
        headers: {
          authorization: "Bearer " + req.user.token,
        },
        "Content-Type": "application/json",
        url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        data: {
          aggregateBy: [
            {
              dataSourceId: dataStreamId,
            },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: 1454284800000,
          endTimeMillis: 1455062400000,
        },
      });
      const stepArray = result.data.bucket;
      res.json({ data: stepArray });
    } catch (error) {
      console.log(error);
      res.send("errorrrrr");
    }
  } catch (error) {
    console.log(error);
    res.send("error");
  }
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    console.log("done");
  });
  req.session.destroy();
  res.send("BYE!");
});

app.listen(3000, () => {
  console.log("llistening on 3000");
});
