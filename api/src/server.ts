import express from "express";
import cors from "cors";
import zoomRequest from "./zoomRequest";
import { ZoomMeeting, ZoomUser } from "./zoomTypes";

const { ZOOM_USERNAME } = process.env;

export default function getServer() {
  return express()
    .use(cors())
    .use(express.json())
    .get("/user", async (req, res) => {
      const results = await zoomRequest().get<ZoomUser>(
        `/users/${ZOOM_USERNAME}`
      );
      res.json(results.data);
    })
    .get("/:userId/meetings", async (req, res) => {
      const { userId } = req.params;
      const results = await zoomRequest().get<{ meetings: ZoomMeeting[] }>(
        `/users/${userId}/meetings`
      );
      const meetings = results.data.meetings.map((meeting) => ({
        duration: meeting.duration,
        startTime: meeting.start_time,
        topic: meeting.topic,
      }));
      res.json(meetings);
    })
    .post("/:userId/meetings", async (req, res) => {
      const { userId } = req.params;
      const { topic, startTime, duration } = req.body;
      const results = await zoomRequest().post<ZoomMeeting>(
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
}
