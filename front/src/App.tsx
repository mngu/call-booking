import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import FullCalendar, { EventDropArg, EventInput } from "@fullcalendar/react";
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

type Meeting = {
  duration: number;
  startTime: Date;
  topic: string;
};

function App() {
  const dragElement = useRef<HTMLSpanElement>(null);
  const calendar = useRef<FullCalendar>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEventDraggable, setIsEventDraggable] = useState(true);
  const [plannedMeetings, setPlannedMeetings] = useState<EventInput[]>([]);
  const [topic, setTopic] = useState("Meeting");
  const [isModalVisible, setIsModalVisible] = useState(false);
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
        const results: AxiosResponse<Meeting[]> = await axios.get(
          `${API_URL}/${userId}/meetings`
        );
        setPlannedMeetings(
          results.data.map((meeting: Meeting) => ({
            title: meeting.topic,
            start: meeting.startTime,
            end: addMinutes(new Date(meeting.startTime), meeting.duration),
            editable: false,
          }))
        );
      });
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
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
          start: meeting.startTime,
          end: addMinutes(new Date(meeting.startTime), meeting.duration),
          editable: false,
        },
      ]);
      setIsModalVisible(false);
      cancelNewEvent();
    }
  };

  const cancelNewEvent = () => {
    const calendarApi = calendar.current?.getApi();
    calendarApi?.getEventById("newMeeting")?.remove();
    setTimeslot({ start: null, end: null });
    setIsEventDraggable(true);
  };

  const onDrop = (info: DropArg) => {
    setIsEventDraggable(false);
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
      <h1>Call Booking</h1>
      <div className="drag-section">
        <span
          id={isEventDraggable ? "draggable" : ""}
          className={`drag-element ${!isEventDraggable && "disabled"}`}
          ref={dragElement}
        >
          DRAG ME
        </span>
        {isModalVisible && (
          <>
            <div className="backdrop" onClick={hideModal} />
            <div className="modal center">
              <h3>Confirm booking</h3>
              <TimeslotDisplay timeslot={timeslot} />
              <div className="topic-form">
                <label htmlFor="topic">Topic</label>
                <input id="topic" type="text" placeholder={topic} onChange={onTopicChange} />
              </div>
              <div className="actions">
                <button onClick={hideModal}>Cancel</button>
                <button onClick={book}>Book</button>
              </div>
            </div>
          </>
        )}
        <TimeslotDisplay timeslot={timeslot} />
        {timeslot.start && timeslot.end && (
          <div className="actions">
            <button onClick={cancelNewEvent}>Cancel</button>
            <button onClick={showModal}>Confirm</button>
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

type TimeslotDisplayProps = {
  timeslot: Timeslot;
};

function TimeslotDisplay({ timeslot }: TimeslotDisplayProps) {
  return (
    timeslot.start &&
    timeslot.end && (
      <div className="timeslot">
        <span>
          From <strong>{dateFormat(timeslot.start)}</strong>
        </span>
        <br />
        <span>
          To <strong>{dateFormat(timeslot.end)}</strong>
        </span>
      </div>
    )
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
