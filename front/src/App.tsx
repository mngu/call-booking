import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import FullCalendar, { EventDropArg } from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  Draggable,
  DropArg,
  EventDragStopArg,
  EventResizeDoneArg,
} from "@fullcalendar/interaction";
import intervalToDuration from "date-fns/intervalToDuration";
import addMinutes from "date-fns/addMinutes";
import intlFormat from "date-fns/intlFormat";
import axios, { AxiosResponse } from "axios";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL;

type Timeslot = {
  start: Date | null;
  end: Date | null;
};

function App() {
  const dragElement = useRef<HTMLSpanElement>(null);
  const calendar = useRef<FullCalendar>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventDraggable, setEventDraggable] = useState(true);
  const [plannedMeetings, setPlannedMeetings] = useState<any>([]);
  const [topic, setTopic] = useState("Meeting");
  const [showModal, setShowModal] = useState(false);
  const [timeslot, setTimeslot] = useState<Timeslot>({
    start: null,
    end: null,
  });

  useEffect(() => {
    if (dragElement.current) {
      new Draggable(dragElement.current, {
        itemSelector: "#draggable",
        eventData: () => ({
          id: "newMeeting",
          title: topic,
          color: "green",
        }),
      });
    }
  }, [dragElement]);

  useEffect(() => {
    axios
      .get(`${API_URL}/user`)
      .then((results: AxiosResponse<{ id: string }>) => {
        setUserId(results.data.id);

        return results.data.id;
      })
      .then(async (userId) => {
        const meetings: AxiosResponse = await axios.get(
          `${API_URL}/${userId}/meetings`
        );
        setPlannedMeetings(
          meetings.data.meetings.map((meeting: any) => ({
            title: meeting.topic,
            start: meeting.start_time,
            end: addMinutes(new Date(meeting.start_time), meeting.duration),
            editable: false,
          }))
        );
      });
  }, []);

  const confirm = () => {
    setShowModal(true);
  };

  const cancel = () => {
    setShowModal(false);
  };

  const book = async () => {
    if (timeslot?.start && timeslot?.end) {
      const duration = intervalToDuration({
        start: timeslot.start,
        end: timeslot.end,
      });
      const response: AxiosResponse = await axios.post(
        `${API_URL}/${userId}/meetings`,
        {
          topic,
          startTime: timeslot.start,
          duration: durationToMinutes(duration),
        }
      );
      const meeting = response.data;
      setPlannedMeetings([
        ...plannedMeetings,
        {
          title: meeting.topic,
          start: meeting.start_time,
          end: addMinutes(new Date(meeting.start_time), meeting.duration),
          editable: false,
        },
      ]);
      setShowModal(false);
      setEventDraggable(true);
      const calendarApi = calendar.current?.getApi();
      calendarApi?.getEventById("newMeeting")?.remove();
    }
  };

  const onDrop = (info: DropArg) => {
    setEventDraggable(false);
    setTimeslot({ start: info.date, end: addMinutes(info.date, 60) });
  };

  const onEventResize = (
    eventResizeInfo: EventResizeDoneArg | EventDragStopArg
  ) => {
    setTimeslot({
      start: eventResizeInfo.event.start,
      end: eventResizeInfo.event.end,
    });
  };

  const onEventDrop = (eventDrop: EventDropArg) => {
    const { start, end } = eventDrop.event;
    if (start) {
      setTimeslot({
        start,
        end: end || addMinutes(start, 60),
      });
    }
  };

  const onTopicChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setTopic(evt.target.value);
  };

  return (
    <div>
      <div>
        <span id={eventDraggable ? "draggable" : ""} ref={dragElement}>
          DRAG ME
        </span>
        {showModal && (
          <>
            <div className="backdrop" onClick={cancel} />
            <div className="modal center">
              <h3>Confirm booking</h3>
              {timeslot.start && timeslot.end && (
                <p>
                  <strong>{dateFormat(timeslot.start)}</strong>
                  <br />
                  <strong>{dateFormat(timeslot.end)}</strong>
                </p>
              )}
              <div>
                <input type="text" onChange={onTopicChange} />
              </div>
              <button onClick={cancel}>Cancel</button>
              <button onClick={book}>Book</button>
            </div>
          </>
        )}
        {timeslot.start && timeslot.end && (
          <div>
            <span>From {dateFormat(timeslot.start)}</span>
            <br />
            <span>to {dateFormat(timeslot.end)}</span>
            <br />
            <button onClick={confirm}>Confirm</button>
          </div>
        )}
      </div>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        ref={calendar}
        editable={true}
        initialView="timeGridWeek"
        drop={onDrop}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        events={plannedMeetings}
      />
    </div>
  );
}

function durationToMinutes(duration: Duration): number {
  return (
    (duration.days || 0) * 1440 +
    (duration.hours || 0) * 60 +
    (duration.minutes || 0)
  );
}

function dateFormat(date: Date): string {
  return intlFormat(date, {
    year: "numeric",
    month: "numeric",
    weekday: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

export default App;
