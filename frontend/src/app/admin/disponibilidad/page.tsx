"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/client";

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface Schedule {
  id: string;
  equipment: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  is_active: boolean;
}

interface AvailabilityDay {
  date: string;
  available: boolean;
  blocked: boolean;
  reserved: boolean;
}

const daysOfWeek = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function AdminDisponibilidadPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<AvailabilityDay[]>(
    [],
  );
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showBlockedForm, setShowBlockedForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 0,
    start_time: "08:00",
    end_time: "17:00",
    is_active: true,
  });
  const [blockedForm, setBlockedForm] = useState({
    date: "",
    reason: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      fetchAvailability();
    }
  }, [selectedEquipment, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Obtener equipos
      const equipmentsRes = await api.get("/equipment/");
      const equipmentsData =
        equipmentsRes.data.results || equipmentsRes.data || [];
      setEquipments(equipmentsData);

      if (equipmentsData.length > 0) {
        setSelectedEquipment(equipmentsData[0].id);
      }

      // Obtener horarios (simulado - pendiente implementar endpoint)
      // Por ahora usamos datos de ejemplo
      setSchedules([]);

      // Obtener fechas bloqueadas (simulado)
      setBlockedDates([]);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedEquipment) return;

    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const params = new URLSearchParams({
        equipment_id: selectedEquipment,
        start_date: startDateStr,
        end_date: endDateStr,
      });

      const res = await api.get(
        `/equipment/availability/?${params.toString()}`,
      );

      if (res.data.availability) {
        const availability: AvailabilityDay[] = [];
        for (const [date, data] of Object.entries(res.data.availability)) {
          availability.push({
            date,
            available: (data as any).available,
            blocked: (data as any).blocked,
            reserved: (data as any).reserved,
          });
        }
        setAvailabilityData(availability);
      }
    } catch (err) {
      console.error("Error al obtener disponibilidad:", err);
    }
  };

  const handleMonthChange = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Pendiente implementar endpoint POST /admin/schedules/
      alert("Funcionalidad en desarrollo - POST /admin/schedules/");
      setShowScheduleForm(false);
      setScheduleForm({
        day_of_week: 0,
        start_time: "08:00",
        end_time: "17:00",
        is_active: true,
      });
    } catch (err) {
      console.error("Error:", err);
      alert("Error al crear horario");
    }
  };

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Pendiente implementar endpoint POST /admin/blocked-dates/
      alert("Funcionalidad en desarrollo - POST /admin/blocked-dates/");
      setShowBlockedForm(false);
      setBlockedForm({ date: "", reason: "", is_active: true });
    } catch (err) {
      console.error("Error:", err);
      alert("Error al crear fecha bloqueada");
    }
  };

  const getDayStatus = (day: AvailabilityDay) => {
    if (day.blocked) return "bg-red-100 text-red-800 border-red-300";
    if (day.reserved) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (day.available) return "bg-green-100 text-green-800 border-green-300";
    return "bg-gray-100 text-gray-500 border-gray-300";
  };

  const getDayLabel = (day: AvailabilityDay) => {
    if (day.blocked) return "🚫 Bloqueado";
    if (day.reserved) return "📅 Reservado";
    if (day.available) return "✅ Disponible";
    return "❓ No disponible";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Generar días del mes para mostrar
  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Ajustar para que Lunes sea el primer día (0=Lunes, 6=Domingo)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const availability = availabilityData.find((d) => d.date === dateStr);
      days.push({
        day: i,
        date: dateStr,
        availability: availability || null,
      });
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando panel de disponibilidad...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <button
          onClick={fetchData}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const days = getDaysInMonth();
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Disponibilidad</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScheduleForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Agregar Horario
          </button>
          <button
            onClick={() => setShowBlockedForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            + Bloquear Fecha
          </button>
        </div>
      </div>

      {/* Selector de equipo y mes */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Equipo</label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.category})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => handleMonthChange(-1)}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              ◀
            </button>
            <span className="text-lg font-semibold">
              {monthNames[selectedMonth.getMonth()]}{" "}
              {selectedMonth.getFullYear()}
            </span>
            <button
              onClick={() => handleMonthChange(1)}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              ▶
            </button>
            <button
              onClick={() => setSelectedMonth(new Date())}
              className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-sm">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span className="text-sm">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-sm">Bloqueado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-sm">Sin información</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700"
            >
              {day}
            </div>
          ))}

          {days.map((day, index) => (
            <div
              key={index}
              className={`bg-white p-2 min-h-[80px] border-b border-r ${
                day?.availability
                  ? getDayStatus(day.availability)
                  : "bg-gray-50"
              }`}
            >
              {day ? (
                <>
                  <div className="text-sm font-medium">{day.day}</div>
                  {day.availability && (
                    <div className="text-xs mt-1">
                      {getDayLabel(day.availability)}
                      {day.availability.blocked && day.availability.date && (
                        <div className="text-xs text-red-600 mt-1">
                          {blockedDates.find(
                            (b) => b.date === day.availability?.date,
                          )?.reason || "Bloqueado"}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-300 text-center text-sm">-</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Horarios configurados */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Horarios Configurados</h3>
        </div>
        <div className="p-4">
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No hay horarios configurados para este equipo
            </p>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div>
                    <span className="font-medium">
                      {daysOfWeek[schedule.day_of_week]}
                    </span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span>
                      {schedule.start_time} - {schedule.end_time}
                    </span>
                    <span
                      className={`ml-2 text-xs px-2 py-1 rounded ${schedule.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}
                    >
                      {schedule.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar horario */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Agregar Horario</h2>
              <form onSubmit={handleAddSchedule}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Día de la semana
                    </label>
                    <select
                      value={scheduleForm.day_of_week}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          day_of_week: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {daysOfWeek.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          start_time: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          end_time: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="schedule_active"
                      checked={scheduleForm.is_active}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="schedule_active" className="text-sm">
                      Activo
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para bloquear fecha */}
      {showBlockedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Bloquear Fecha</h2>
              <form onSubmit={handleAddBlockedDate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={blockedForm.date}
                      onChange={(e) =>
                        setBlockedForm({ ...blockedForm, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Motivo
                    </label>
                    <input
                      type="text"
                      value={blockedForm.reason}
                      onChange={(e) =>
                        setBlockedForm({
                          ...blockedForm,
                          reason: e.target.value,
                        })
                      }
                      placeholder="Ej: Feriado, Mantenimiento..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="blocked_active"
                      checked={blockedForm.is_active}
                      onChange={(e) =>
                        setBlockedForm({
                          ...blockedForm,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="blocked_active" className="text-sm">
                      Activo
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowBlockedForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Bloquear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
