export function getColorForName(name: string): string {
  const palette = [
    "#7c3aed",
    "#2563eb",
    "#0ea5e9",
    "#10b981",
    "#f97316",
    "#ec4899",
    "#6366f1",
    "#14b8a6"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % 2147483647;
  }
  const index = hash % palette.length;
  return palette[index];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
