const express = require("express");
const session = require("express-session");
const passport = require("passport");
const _ = require("lodash");
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
    successRedirect: "/sessions",
    failureRedirect: "/auth/failure",
  })
);

app.get("/auth/failure", (req, res) => {
  res.send("something went wrong");
});

const getFilteredData = (buckets) => {
  const result = [];

  for (const bucket of buckets) {
    const dataset = []; // Array to store objects with "com.google.activity.summary" dataTypeName

    let started_at = new Date(Number(bucket.startTimeMillis));
    let completed_at = new Date(Number(bucket.endTimeMillis));

    // Loop through the dataset array
    for (const data of bucket.dataset) {
      // Check if "dataTypeName" is "com.google.activity.summary" in each point object
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.activity.summary"
      ) {
        dataset.push({
          started_at: new Date(
            Number(data.point[0].startTimeNanos) / 1e6
          ).toISOString(),
          completed_at: new Date(
            Number(data.point[0].endTimeNanos) / 1e6
          ).toISOString(),
          dataTypeName: data.point[0].dataTypeName,
          activity: data.point[0].value[0].intVal,
          duration: Number(parseInt(data.point[0].value[1].intVal / 1e3)),
          num_segments: data.point[0].value[2].intVal,
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.heart_minutes.summary"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          intensity: Number(
            parseFloat(data.point[0].value[0].fpVal).toFixed(2)
          ),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.calories.bmr.summary"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          FIELD_AVERAGE: Number(
            parseFloat(data.point[0].value[0].fpVal).toFixed(2)
          ),
          FIELD_MAX: Number(
            parseFloat(data.point[0].value[1].fpVal).toFixed(2)
          ),
          FIELD_MIN: Number(
            parseFloat(data.point[0].value[2].fpVal).toFixed(2)
          ),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.power.summary"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          FIELD_AVERAGE: Number(
            parseFloat(data.point[0].value[0].fpVal).toFixed(2)
          ),
          FIELD_MAX: Number(
            parseFloat(data.point[0].value[1].fpVal).toFixed(2)
          ),
          FIELD_MIN: Number(
            parseFloat(data.point[0].value[2].fpVal).toFixed(2)
          ),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.location.bounding_box"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          FIELD_LOW_LATITUDE: Number(
            parseFloat(data.point[0].value[0].fpVal).toFixed(2)
          ),
          FIELD_LOW_LONGITUDE: Number(
            parseFloat(data.point[0].value[1].fpVal).toFixed(2)
          ),
          FIELD_HIGH_LATITUDE: Number(
            parseFloat(data.point[0].value[2].fpVal).toFixed(2)
          ),
          FIELD_HIGH_LONGITUDE: Number(
            parseFloat(data.point[0].value[3].fpVal).toFixed(2)
          ),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.speed.summary"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          average: Number(parseFloat(data.point[0].value[0].fpVal).toFixed(2)),
          max: Number(parseFloat(data.point[0].value[1].fpVal).toFixed(2)),
          min: Number(parseFloat(data.point[0].value[1].fpVal).toFixed(2)),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.calories.expended"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          calories: Number(parseFloat(data.point[0].value[0].fpVal).toFixed(2)),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.step_count.delta"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          steps: data.point[0].value[0].intVal,
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.step_count.cadence"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          rpm: Number(parseFloat(data.point[0].value[0].fpVal).toFixed(2)),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.cycling.pedaling.cadence"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          rpm: Number(parseFloat(data.point[0].value[0].fpVal).toFixed(2)),
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.cycling.pedaling.cumulative"
      ) {
        dataset.push({
          dataTypeName: data.point[0].dataTypeName,
          revolutions: data.point[0].value[0].intVal,
        }); // Add the object to the summaryObjects array
      }
      if (
        data.point.length > 0 &&
        data.point[0].value &&
        data.point[0].value.length > 0 &&
        data.point[0].dataTypeName === "com.google.active_minutes"
      ) {
        started_at = new Date(Number(data.point[0].startTimeNanos) / 1e6);
        completed_at = new Date(Number(data.point[0].endTimeNanos) / 1e6);
        dataset.push({
          started_at: new Date(
            Number(data.point[0].startTimeNanos) / 1e6
          ).toISOString(),
          completed_at: new Date(
            Number(data.point[0].endTimeNanos) / 1e6
          ).toISOString(),
          dataTypeName: data.point[0].dataTypeName,
          duration: data.point[0].value[0].intVal,
        }); // Add the object to the summaryObjects array
      }
    }

    const grouped = _.groupBy(_.uniqWith(dataset, _.isEqual), "dataTypeName");

    result.push({
      activity: bucket.activity,
      started_at: started_at.toISOString(),
      completed_at: completed_at.toISOString(),
      duration: Number(
        parseInt((completed_at.getTime() - started_at.getTime()) / 1000)
      ),
      dataset: Object.keys(grouped).reduce(
        (prev, curr) => ({ ...prev, [curr]: grouped[curr][0] }),
        {}
      ),
    });
  }

  return result;
};

app.get("/data", isLoggedIn, async (req, res) => {
  try {
    // Exchange the authorization code for an access token
    oauth2Client.setCredentials({
      access_token: req.user.token,
    });

    // Create a Google Fitness API client
    const fitness = google.fitness("v1");

    // Set the aggregation parameters
    const startTimeMillis = new Date("2019-10-01T00:00:00Z").getTime(); // Replace with your desired start time
    const endTimeMillis = new Date("2019-10-31T00:00:00Z").getTime(); // Replace with your desired end time
    const timeRange = endTimeMillis - startTimeMillis; // Calculate the time range
    const maxDuration = 7 * 24 * 60 * 60 * 1000; // Maximum duration for aggregation is 7 days in milliseconds
    const numRequests = Math.ceil(timeRange / maxDuration); // Calculate the number of requests needed
    const aggregationTypes = [
      // activity
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
      "com.google.activity.summary",
      "com.google.calories.bmr.summary",
      "com.google.heart_minutes.summary",
      "com.google.power.summary",
      "com.google.location.bounding_box",
      "com.google.speed.summary",
    ];

    let datasets = [];

    try {
      const data = await fitness.users.dataSources.list({
        auth: oauth2Client,
        userId: "me",
      });

      console.log(`Datasets - ${data.data.dataSource.length}`);

      const ids = [];
      for (let dataId of data.data.dataSource) {
        ids.push(dataId.dataStreamId);
      }

      console.log(`Unique Datasets - ${new Set(data.data.dataSource).size}`);

      for (let i = 0; i < numRequests; i++) {
        const startTime = startTimeMillis + i * maxDuration;
        const endTime = Math.min(startTime + maxDuration, endTimeMillis);

        const aggData = await fitness.users.dataset.aggregate({
          auth: oauth2Client,
          userId: "me",
          requestBody: {
            aggregateBy: ids.map((dataSourceId) => ({
              dataSourceId: dataSourceId,
            })),
            startTimeMillis: startTime,
            endTimeMillis: endTime,
            bucketByActivitySegment: {},
          },
        });

        console.log(
          `Fetching from ${new Date(
            startTime
          ).toLocaleDateString()} to ${new Date(endTime)}`,
          aggData.data.bucket.length
        );

        datasets = [...datasets, ...getFilteredData(aggData.data.bucket)];
      }
      res.json(datasets);
    } catch (e) {
      console.log(e);
    }
  } catch (error) {
    res.json({ error });
    console.error("Error:", error);
  }
});

app.get("/sessions", isLoggedIn, async (req, res) => {
  oauth2Client.setCredentials({
    access_token: req.user.token,
  });

  // Create a Google Fitness API client
  const fitness = google.fitness("v1");
  try {
    const data = await fitness.users.sessions.list({
      auth: oauth2Client,
      userId: "me",
      startTime: "2023-04-11T13:03:28+05:30",
      endTime: "2023-04-12T13:03:28+05:30",
    })
    res.json(data);
  } catch (error) {
    console.log(error);
    res.send("Sdgsdg");
  }

})

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
