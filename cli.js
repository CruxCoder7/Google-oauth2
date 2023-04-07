const dataset = require("./final.json");

for (const data of dataset) {
  console.log(
    `${new Date(Number(data.startTimeMillis)).toLocaleString()} - ${new Date(
      Number(data.endTimeMillis)
    ).toLocaleString()}`
  );
}
