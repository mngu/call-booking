import supertest from "supertest";
import { Application } from "express";
import { mocked } from "ts-jest/utils";
import getServer from "./server";
import zoomRequest from "./zoomRequest";
import { AxiosInstance } from "axios";

jest.mock("./zoomRequest");
const mockedZoomRequest = mocked(zoomRequest, true);

describe("Server tests", () => {
  let app: Application;
  beforeAll(() => {
    app = getServer();
  });

  it("GET /user should returns user data", async () => {
    // Mocking Zoom Api response
    mockedZoomRequest.mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { id: "userId" } }),
    } as unknown as AxiosInstance);

    // Simulating Request
    const response = await supertest(app).get("/user").expect(200);

    // Inspecting response
    expect(response.body).toEqual({ id: "userId" });
  });

  it("GET /:user/meeting should returns a list of meetings", async () => {
    const startTime1 = new Date("2021-05-10T18:46:02.885Z");
    const startTime2 = new Date("2021-05-10T09:32:13.543Z");

    // Mocking Zoom Api response
    mockedZoomRequest.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: {
          meetings: [
            {
              duration: 60,
              start_time: startTime1.toISOString(),
              topic: "Test Meeting 1",
            },
            {
              duration: 60,
              start_time: startTime2.toISOString(),
              topic: "Test Meeting 2",
            },
          ],
        },
      }),
    } as unknown as AxiosInstance);

    // Simulating Request
    const response = await supertest(app).get("/userId/meetings").expect(200);

    // Inspecting response
    expect(response.body).toEqual([
      {
        duration: 60,
        startTime: startTime1.toISOString(),
        topic: "Test Meeting 1",
      },
      {
        duration: 60,
        startTime: startTime2.toISOString(),
        topic: "Test Meeting 2",
      },
    ]);
  });

  it("POST /:user/meeting should book a meeting", async () => {
    const payload = {
      topic: "Test Meeting 1",
      startTime: new Date("2021-05-10T18:46:02.885Z").toISOString(),
      duration: 240,
    };

    // Mocking Zoom Api response
    mockedZoomRequest.mockReturnValue({
      post: jest.fn().mockResolvedValue({
        data: {
          duration: payload.duration,
          start_time: "2021-05-10T18:46:02Z",
          topic: payload.topic,
        },
      }),
    } as unknown as AxiosInstance);

    // Simulating Request
    const response = await supertest(app)
      .post("/userId/meetings")
      .send(payload)
      .expect(200);

    // Inspecting response
    expect(response.body).toEqual({
      duration: payload.duration,
      startTime: "2021-05-10T18:46:02Z",
      topic: payload.topic,
    });
  });
});
