import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, CalendarX, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import timetableJson from "@/data/timetable.json";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatRemaining,
  formatServiceDate,
  getDepartureOccurrence,
  getNextDeparture,
  getSuspensionReason,
  type DepartureOccurrence,
  type RouteId,
  type Timetable,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

const timetable = timetableJson as Timetable;

const groupDeparturesByHour = (departures: string[]) =>
  departures.reduce<Array<{ hour: string; times: string[] }>>((groups, time) => {
    const [hour] = time.split(":");
    const currentGroup = groups[groups.length - 1];

    if (currentGroup?.hour === hour) {
      currentGroup.times.push(time);
      return groups;
    }

    groups.push({ hour, times: [time] });
    return groups;
  }, []);

function App() {
  const [now, setNow] = useState(() => new Date());
  const [activeRouteId, setActiveRouteId] = useState<RouteId>(
    timetable.routes[0].id,
  );
  const [selectedDeparture, setSelectedDeparture] =
    useState<DepartureOccurrence | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeRoute = useMemo(
    () => timetable.routes.find((route) => route.id === activeRouteId)!,
    [activeRouteId],
  );

  const nextDeparture = useMemo(
    () => getNextDeparture(timetable, activeRoute, now),
    [activeRoute, now],
  );

  const suspensionReason = getSuspensionReason(timetable, now);
  const isSuspended = suspensionReason !== null;

  const handleSelectTime = (time: string) => {
    setSelectedDeparture(getDepartureOccurrence(timetable, activeRoute, time, now));
  };

  return (
    <main className="min-h-screen">
      <section className="border-b bg-card">
        <div className="container flex flex-col gap-5 py-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {timetable.stops.apartment}
            </div>
            <div>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                シャトルバス時刻表
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {timetable.stops.apartment} と {timetable.stops.station} を結ぶ便
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">現在時刻</p>
              <p className="text-xl font-semibold tabular-nums">
                {format(now, "HH:mm:ss")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container grid gap-5 py-5 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>次の便</CardTitle>
              <CardDescription>
                終バス後や運休日は次の運行日の始発を表示します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSuspended ? (
                <div className="flex items-start gap-3 rounded-lg border border-secondary/40 bg-secondary/15 p-3">
                  <CalendarX className="mt-0.5 h-5 w-5 text-secondary-foreground" />
                  <div>
                    <p className="font-medium">本日は運休です</p>
                    <p className="text-sm text-muted-foreground">
                      {suspensionReason}
                    </p>
                  </div>
                </div>
              ) : null}

              {nextDeparture ? (
                <div className="rounded-lg bg-primary p-4 text-primary-foreground">
                  <p className="text-sm opacity-90">{nextDeparture.route.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-4xl font-bold tabular-nums">
                      {nextDeparture.time}
                    </p>
                    <p className="text-right text-sm font-medium">
                      {formatServiceDate(nextDeparture.date)}
                      <br />
                      {formatRemaining(nextDeparture.minutesUntil)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  表示できる便がありません。
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>運行案内</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {timetable.notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>選択した時刻</CardTitle>
              <CardDescription>
                時刻表のボタンをタップすると残り時間を表示します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDeparture ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedDeparture.route.from} から {selectedDeparture.route.to}
                  </p>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-3xl font-bold tabular-nums">
                      {selectedDeparture.time}
                    </p>
                    <p className="text-right font-semibold text-accent">
                      {formatRemaining(selectedDeparture.minutesUntil)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatServiceDate(selectedDeparture.date)} の便
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  まだ時刻が選択されていません。
                </p>
              )}
            </CardContent>
          </Card>
        </aside>

        <section>
          <Tabs
            value={activeRouteId}
            onValueChange={(value) => {
              setActiveRouteId(value as RouteId);
              setSelectedDeparture(null);
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                {timetable.routes.map((route) => (
                  <TabsTrigger key={route.id} value={route.id}>
                    {route.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                方向を切り替え
              </div>
            </div>

            {timetable.routes.map((route) => (
              <TabsContent key={route.id} value={route.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{route.label}</CardTitle>
                    <CardDescription>
                      {route.from} 発、{route.to} 行き
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border">
                      <div className="grid grid-cols-[4rem_1fr] border-b bg-muted text-sm font-semibold text-muted-foreground">
                        <div className="border-r px-4 py-3 text-center">時</div>
                        <div className="px-4 py-3">分</div>
                      </div>
                      <div className="divide-y">
                        {groupDeparturesByHour(route.departures).map((group) => (
                          <div
                            key={group.hour}
                            className="grid grid-cols-[4rem_1fr] bg-card"
                          >
                            <div className="flex items-center justify-center border-r bg-muted/45 px-3 py-3 text-xl font-semibold tabular-nums">
                              {Number(group.hour)}
                            </div>
                            <div className="flex flex-wrap gap-2 px-3 py-3">
                              {group.times.map((time) => {
                                const minute = time.split(":")[1];
                                const isNext =
                                  nextDeparture?.route.id === route.id &&
                                  nextDeparture.time === time;
                                const isSelected =
                                  selectedDeparture?.route.id === route.id &&
                                  selectedDeparture.time === time;

                                return (
                                  <Button
                                    key={time}
                                    type="button"
                                    variant={isNext ? "secondary" : "outline"}
                                    className={cn(
                                      "h-11 w-14 text-lg font-semibold tabular-nums",
                                      isNext &&
                                        "border-secondary shadow-[0_0_0_2px_hsl(var(--secondary)/0.35)]",
                                      isSelected && "ring-2 ring-accent",
                                    )}
                                    onClick={() => handleSelectTime(time)}
                                    aria-label={`${route.label} ${time} 発`}
                                  >
                                    {minute}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </main>
  );
}

export default App;
