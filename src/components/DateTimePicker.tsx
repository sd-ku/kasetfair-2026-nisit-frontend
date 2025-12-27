"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Select date and time",
    disabled = false
}: DateTimePickerProps) {
    function handleDateSelect(date: Date | undefined) {
        if (date) {
            // If there's an existing value, preserve the time
            if (value) {
                const newDate = new Date(date);
                newDate.setHours(value.getHours());
                newDate.setMinutes(value.getMinutes());
                newDate.setSeconds(value.getSeconds());
                onChange(newDate);
            } else {
                // Set default time to current time
                const newDate = new Date(date);
                const now = new Date();
                newDate.setHours(now.getHours());
                newDate.setMinutes(now.getMinutes());
                newDate.setSeconds(now.getSeconds());
                onChange(newDate);
            }
        }
    }

    function handleTimeChange(type: "hour" | "minute" | "second", timeValue: string) {
        const currentDate = value || new Date();
        const newDate = new Date(currentDate);

        if (type === "hour") {
            const hour = parseInt(timeValue, 10);
            newDate.setHours(hour);
        } else if (type === "minute") {
            newDate.setMinutes(parseInt(timeValue, 10));
        } else if (type === "second") {
            newDate.setSeconds(parseInt(timeValue, 10));
        }

        onChange(newDate);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground"
                    )}
                >
                    {value ? (
                        format(value, "MM/dd/yyyy HH:mm:ss")
                    ) : (
                        <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="sm:flex">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 24 }, (_, i) => i)
                                    .reverse()
                                    .map((hour) => (
                                        <Button
                                            key={hour}
                                            size="icon"
                                            variant={
                                                value &&
                                                    value.getHours() === hour
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() =>
                                                handleTimeChange("hour", hour.toString())
                                            }
                                        >
                                            {hour}
                                        </Button>
                                    ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 60 }, (_, i) => i).map(
                                    (minute) => (
                                        <Button
                                            key={minute}
                                            size="icon"
                                            variant={
                                                value &&
                                                    value.getMinutes() === minute
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() =>
                                                handleTimeChange("minute", minute.toString())
                                            }
                                        >
                                            {minute.toString().padStart(2, '0')}
                                        </Button>
                                    )
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 60 }, (_, i) => i).map(
                                    (second) => (
                                        <Button
                                            key={second}
                                            size="icon"
                                            variant={
                                                value &&
                                                    value.getSeconds() === second
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() =>
                                                handleTimeChange("second", second.toString())
                                            }
                                        >
                                            {second.toString().padStart(2, '0')}
                                        </Button>
                                    )
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
