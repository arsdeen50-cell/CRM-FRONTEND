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

const DatePickerField = ({ label, name, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const parsedValue = value ? new Date(value) : undefined;
  const [selectedDate, setSelectedDate] = useState(parsedValue);
  const [month, setMonth] = useState(parsedValue);

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (isValidDate(parsed)) {
        setSelectedDate(parsed);
        setMonth(parsed);
      }
    }
  }, [value]);

  return (
    <div className="grid gap-2 items-center">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative flex gap-2">
        <Input
          id={name}
          value={formatDate(selectedDate)}
          placeholder="Select date"
          className="bg-background pr-10"
          onChange={(e) => {
            const inputDate = new Date(e.target.value);
            if (isValidDate(inputDate)) {
              setSelectedDate(inputDate);
              setMonth(inputDate);
              onChange({ target: { name, value: inputDate.toISOString() } });
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="absolute top-1/2 right-2 size-6 -translate-y-1/2">
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end" alignOffset={-8} sideOffset={10}>
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                setSelectedDate(date);
                onChange({ target: { name, value: date?.toISOString() } });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};


export default DatePickerField;