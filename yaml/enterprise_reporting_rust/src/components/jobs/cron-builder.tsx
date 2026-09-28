"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { HelpTopicButton } from "@/components/help/help-toaster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
}

/**
 * The cron field reference, as a help topic.
 *
 * Hoisted out of the JSX so the object is created once rather than on every
 * keystroke in the builder — a new `topic` identity each render would make
 * `showHelp` replace the open panel while someone was reading it.
 */
const CRON_SYNTAX_HELP = {
  key: "cron-syntax",
  title: "Cron expression — Help",
  body: (
    <div className="space-y-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="font-semibold">Minute</dt>
        <dd className="text-muted-foreground">0-59 or *</dd>
        <dt className="font-semibold">Hour</dt>
        <dd className="text-muted-foreground">0-23 or *</dd>
        <dt className="font-semibold">Day</dt>
        <dd className="text-muted-foreground">1-31 or *</dd>
        <dt className="font-semibold">Month</dt>
        <dd className="text-muted-foreground">1-12 or *</dd>
        <dt className="font-semibold">Weekday</dt>
        <dd className="text-muted-foreground">0-6 (0=Sunday) or *</dd>
      </dl>
      <div className="space-y-1 text-xs">
        <p className="font-semibold">Examples</p>
        <p className="font-mono text-muted-foreground">*/5 = every 5</p>
        <p className="font-mono text-muted-foreground">1-5 = 1 to 5</p>
        <p className="font-mono text-muted-foreground">1,3,5 = 1, 3, and 5</p>
      </div>
    </div>
  ),
};

export function CronBuilder({ value, onChange }: CronBuilderProps) {
  const [mode, setMode] = useState<"ui" | "manual">("ui");
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [manualCron, setManualCron] = useState(value);

  const commonSchedules = [
    { label: "Every minute", cron: "* * * * *" },
    { label: "Every hour", cron: "0 * * * *" },
    { label: "Every day at midnight", cron: "0 0 * * *" },
    { label: "Every day at 6 AM", cron: "0 6 * * *" },
    { label: "Every week (Monday 9 AM)", cron: "0 9 * * 1" },
    { label: "Every month (1st at midnight)", cron: "0 0 1 * *" },
    { label: "Every 5 minutes", cron: "*/5 * * * *" },
    { label: "Every 30 minutes", cron: "*/30 * * * *" },
    { label: "Weekdays at 9 AM", cron: "0 9 * * 1-5" },
    { label: "Weekends at midnight", cron: "0 0 * * 6,0" },
  ];

  const getCronExpression = () => {
    if (mode === "manual") return manualCron;
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  };

  const updateCron = () => {
    onChange(getCronExpression());
  };

  const handlePresetClick = (cron: string) => {
    const parts = cron.split(" ");
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
      setMode("ui");
      onChange(cron);
    }
  };

  const handleManualChange = (val: string) => {
    setManualCron(val);
    onChange(val);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Schedule</Label>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "ui" | "manual")}>
          <TabsList>
            <TabsTrigger value="ui" className="text-xs">
              UI Builder
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs">
              Manual Cron
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === "manual" ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={manualCron}
              onChange={(e) => handleManualChange(e.target.value)}
              placeholder="* * * * *"
              className="font-mono"
            />
            <Button type="button" variant="outline" size="icon" onClick={updateCron} title="Apply">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-tremor-label text-tremor-content">
            Format: minute hour day month weekday (0-6, Sunday = 0)
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Minute</Label>
              <Input
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                onBlur={updateCron}
                placeholder="*"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hour</Label>
              <Input
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                onBlur={updateCron}
                placeholder="*"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Day</Label>
              <Input
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                onBlur={updateCron}
                placeholder="*"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                onBlur={updateCron}
                placeholder="*"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Weekday</Label>
              <Input
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                onBlur={updateCron}
                placeholder="*"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-medium">Current: {getCronExpression()}</span>
            {/* A `?` into the help toaster, not a tooltip.
                This was a `Tooltip` on a `HelpCircle`: cron syntax — the one
                thing on this screen nobody remembers — appeared on hover,
                after a delay, and never at all on a phone. It is the same
                surface every other piece of help in this platform uses now. */}
            <HelpTopicButton label="Cron expression" topic={CRON_SYNTAX_HELP} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {commonSchedules.map((schedule) => (
                <Badge
                  key={schedule.cron}
                  variant={getCronExpression() === schedule.cron ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handlePresetClick(schedule.cron)}
                >
                  {schedule.label}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
