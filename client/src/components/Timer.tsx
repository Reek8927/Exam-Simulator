import { useState, useEffect } from "react";
import { clsx } from "clsx";

interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
}

export function Timer({ initialSeconds, onTimeUp }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    // If timer was already at 0 when loaded
    if (initialSeconds <= 0) {
      setSecondsLeft(0);
      return;
    }
    
    setSecondsLeft(initialSeconds); // Reset if prop changes
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [secondsLeft, onTimeUp]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsLeft < 300; // Less than 5 mins

  return (
    <div className={clsx(
      "font-mono text-xl font-bold px-4 py-2 rounded-lg border",
      isLowTime ? "bg-red-50 text-red-600 border-red-200 timer-warning" : "bg-blue-50 text-blue-700 border-blue-200"
    )}>
      Time Left: {formatTime(secondsLeft)}
    </div>
  );
}
