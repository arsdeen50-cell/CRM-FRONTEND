import React, { useEffect } from "react";
import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

// Midday local time, so the stored date doesn't shift to the previous day when converted to UTC
const atMidday = (date) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
};
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/* Date field with a calendar popup. onChange receives { target: { name, value } } where value is an
   ISO string ("" when cleared), so it plugs straight into form handlers.
   minDate: dates before it can't be picked (e.g. an end date before the start date). */
const DatePickerField = ({ label, name, value, onChange, minDate, placeholder = "Select date", required }) => {
  const [open, setOpen] = useState(false);
  const parsedValue = value ? new Date(value) : undefined;
  const [selectedDate, setSelectedDate] = useState(isValidDate(parsedValue) ? parsedValue : undefined);
  const [month, setMonth] = useState(isValidDate(parsedValue) ? parsedValue : undefined);

  // Follow the parent's value, including when it is cleared
  useEffect(() => {
    const parsed = value ? new Date(value) : undefined;
    if (isValidDate(parsed)) {
      setSelectedDate(parsed);
      setMonth(parsed);
    } else {
      setSelectedDate(undefined);
    }
  }, [value]);

  const min = minDate && isValidDate(new Date(minDate)) ? startOfDay(minDate) : undefined;

  return (
    <div className="grid gap-2 items-center">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex gap-2 cursor-pointer">
            <Input
              id={name}
              readOnly
              value={formatDate(selectedDate)}
              placeholder={placeholder}
              aria-required={required}
              className="bg-background pr-10 cursor-pointer"
            />
            <Button type="button" variant="ghost" tabIndex={-1} className="absolute top-1/2 right-2 size-6 -translate-y-1/2">
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="end" alignOffset={-8} sideOffset={10}>
          <Calendar
            mode="single"
            selected={selectedDate}
            month={month || min}
            onMonthChange={setMonth}
            disabled={min ? { before: min } : undefined}
            onSelect={(date) => {
              const picked = date ? atMidday(date) : undefined;
              setSelectedDate(picked);
              onChange?.({ target: { name, value: picked ? picked.toISOString() : "" } });
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerField;
