import {
  addDays,
  differenceInMinutes,
  format,
  isWithinInterval,
  parseISO,
  set,
  startOfDay,
} from "date-fns";

export type RouteId = "apartment-to-station" | "station-to-apartment";

export type SuspendedDate = {
  date: string;
  label: string;
};

export type SuspendedRange = {
  start: string;
  end: string;
  label: string;
};

export type ShuttleRoute = {
  id: RouteId;
  label: string;
  from: string;
  to: string;
  departures: string[];
};

export type Timetable = {
  serviceName: string;
  stops: {
    apartment: string;
    station: string;
  };
  notices: string[];
  calendar: {
    suspendedWeekdays: number[];
    suspendedDates: SuspendedDate[];
    suspendedRanges: SuspendedRange[];
  };
  routes: ShuttleRoute[];
};

export type DepartureOccurrence = {
  route: ShuttleRoute;
  time: string;
  date: Date;
  minutesUntil: number;
};

const dateKey = (date: Date) => format(date, "yyyy-MM-dd");

const departureDate = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
};

export const getSuspensionReason = (
  timetable: Timetable,
  date: Date,
): string | null => {
  const target = startOfDay(date);
  const weekday = target.getDay();

  if (timetable.calendar.suspendedWeekdays.includes(weekday)) {
    return weekday === 0 ? "日曜運休" : "土曜運休";
  }

  const fixedDate = timetable.calendar.suspendedDates.find(
    (item) => item.date === dateKey(target),
  );
  if (fixedDate) {
    return fixedDate.label;
  }

  const range = timetable.calendar.suspendedRanges.find((item) =>
    isWithinInterval(target, {
      start: parseISO(item.start),
      end: parseISO(item.end),
    }),
  );

  return range?.label ?? null;
};

export const isServiceDay = (timetable: Timetable, date: Date) =>
  getSuspensionReason(timetable, date) === null;

export const isSelectableDepartureToday = (
  timetable: Timetable,
  time: string,
  now: Date,
) => {
  const today = startOfDay(now);
  return (
    isServiceDay(timetable, today) &&
    departureDate(today, time).getTime() >= now.getTime()
  );
};

export const getNextServiceDate = (timetable: Timetable, from: Date) => {
  for (let offset = 0; offset < 370; offset += 1) {
    const candidate = startOfDay(addDays(from, offset));
    if (isServiceDay(timetable, candidate)) {
      return candidate;
    }
  }

  return null;
};

export const getNextDeparture = (
  timetable: Timetable,
  route: ShuttleRoute,
  now: Date,
): DepartureOccurrence | null => {
  const today = startOfDay(now);

  if (isServiceDay(timetable, today)) {
    const upcomingTime = route.departures.find(
      (time) => departureDate(today, time).getTime() >= now.getTime(),
    );

    if (upcomingTime) {
      const date = departureDate(today, upcomingTime);
      return {
        route,
        time: upcomingTime,
        date,
        minutesUntil: differenceInMinutes(date, now),
      };
    }
  }

  const nextServiceDate = getNextServiceDate(timetable, addDays(today, 1));
  const time = route.departures[0];

  if (!nextServiceDate || !time) {
    return null;
  }

  const date = departureDate(nextServiceDate, time);
  return {
    route,
    time,
    date,
    minutesUntil: differenceInMinutes(date, now),
  };
};

export const getDepartureOccurrence = (
  timetable: Timetable,
  route: ShuttleRoute,
  time: string,
  now: Date,
): DepartureOccurrence | null => {
  const today = startOfDay(now);
  const todayDeparture = departureDate(today, time);
  const canUseToday =
    isServiceDay(timetable, today) && todayDeparture.getTime() >= now.getTime();
  const serviceDate = canUseToday
    ? today
    : getNextServiceDate(timetable, addDays(today, 1));

  if (!serviceDate) {
    return null;
  }

  const date = departureDate(serviceDate, time);
  return {
    route,
    time,
    date,
    minutesUntil: differenceInMinutes(date, now),
  };
};

export const formatRemaining = (minutes: number) => {
  if (minutes <= 0) {
    return "まもなく出発";
  }

  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const restMinutes = minutes % 60;
  const parts = [
    days > 0 ? `${days}日` : null,
    hours > 0 ? `${hours}時間` : null,
    `${restMinutes}分`,
  ].filter(Boolean);

  return `あと${parts.join("")}`;
};

export const formatServiceDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
