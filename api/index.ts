import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import axios from "axios";

require("dotenv").config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const { ZOOM_API_URL, ZOOM_API_KEY, ZOOM_API_SECRET, ZOOM_USERNAME, PORT } =
  process.env;
const token = jwt.sign(
  { iss: ZOOM_API_KEY, exp: new Date().getTime() + 60000 },
  ZOOM_API_SECRET
);

const zoomRequest = axios.create({
  baseURL: ZOOM_API_URL,
  headers: { Authorization: `Bearer ${token}` },
});

app.get("/user", async (req, res) => {
  const results = await zoomRequest.get(`/users/${ZOOM_USERNAME}`);
  res.json(results.data);
});

app.get("/:userId/meetings", async (req, res) => {
  const { userId } = req.params;
  const results = await zoomRequest.get(`/users/${userId}/meetings`);
  const meetings = results.data.meetings.map((meeting) => ({
    duration: meeting.duration,
    startTime: meeting.start_time,
    topic: meeting.topic,
  }));
  res.json(meetings);
});

app.post("/:userId/meetings", async (req, res) => {
  const { userId } = req.params;
  const { topic, startTime, duration } = req.body;
  const results = await zoomRequest.post(
    `/users/${userId}/meetings`,
    {
      type: 2,
      topic,
      // Sending start_time to ISO 8601 non-extended format
      start_time: startTime.split(".")[0] + "Z",
      duration,
    },
    { headers: { "Content-Type": "application/json" } }
  );
  const meeting = results.data;
  res.json({
    duration: meeting.duration,
    startTime: meeting.start_time,
    topic: meeting.topic,
  });
});

app.listen(PORT, () => {
  console.log(`server is listening on ${PORT}`);
});
