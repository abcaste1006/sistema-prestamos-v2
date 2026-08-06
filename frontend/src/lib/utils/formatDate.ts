export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "—";

  // Si es una fecha ISO con T, extraer solo la fecha
  if (dateStr.includes("T")) {
    const parts = dateStr.split("T")[0].split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Si ya es una fecha simple YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return dateStr;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
