import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast } from "date-fns";

export function formatDate(date: Date | number): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: Date | number): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function formatTime(date: Date | number): string {
  return format(new Date(date), "h:mm a");
}

export function formatRelative(date: Date | number): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: Date | number): boolean {
  return isPast(new Date(date));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
