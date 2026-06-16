const DOT: Record<string, string> = {
  gray: "bg-gray-400",
  green: "bg-green-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  teal: "bg-teal-500",
  purple: "bg-purple-500",
};

/** Tailwind class for a status color dot. */
export function statusDot(color?: string | null) {
  return DOT[color ?? "gray"] ?? "bg-gray-400";
}
