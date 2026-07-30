"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/client";

interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  serial_number?: string;
  specifications?: string;
  image_url?: string;
}

export default function AdminEquiposPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  const normalizeEquipments = (payload: any): Equipment[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.results)) return payload.results;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    status: "AVAILABLE",
    serial_number: "",
    specifications: "",
    image_url: "",
  });

  // Cargar equipos
  const fetchEquipments = async () => {
    try {
      const res = await api.get("/equipment/");
      setEquipments(normalizeEquipments(res.data));
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar equipos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  // Guardar equipo (crear o editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/equipment/${editingId}/`, form);
      } else {
        await api.post("/equipment/", form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        name: "",
        description: "",
        category: "",
        status: "AVAILABLE",
        serial_number: "",
        specifications: "",
        image_url: "",
      });
      fetchEquipments();
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.response?.data?.detail || "Error al guardar equipo");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar equipo
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este equipo?")) return;
    try {
      await api.delete(`/equipment/${id}/`);
      fetchEquipments();
    } catch (err: any) {
      console.error("Error:", err);
      alert("Error al eliminar equipo");
    }
  };

  // Editar equipo (cargar datos en el formulario)
  const handleEdit = (eq: Equipment) => {
    setForm({
      name: eq.name,
      description: eq.description || "",
      category: eq.category,
      status: eq.status,
      serial_number: eq.serial_number || "",
      specifications: eq.specifications || "",
      image_url: eq.image_url || "",
    });
    setEditingId(eq.id);
    setShowForm(true);
  };

  // Cancelar formulario
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      category: "",
      status: "AVAILABLE",
      serial_number: "",
      specifications: "",
      image_url: "",
    });
  };

  const statusLabels: Record<string, string> = {
    AVAILABLE: "Disponible",
    LOANED: "En préstamo",
    MAINTENANCE: "En mantenimiento",
    DAMAGED: "Dañado",
  };

  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    LOANED: "bg-yellow-100 text-yellow-800",
    MAINTENANCE: "bg-blue-100 text-blue-800",
    DAMAGED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          + Nuevo Equipo
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Editar Equipo" : "Nuevo Equipo"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Categoría *
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="LOANED">En préstamo</option>
                  <option value="MAINTENANCE">En mantenimiento</option>
                  <option value="DAMAGED">Dañado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Número de serie
                </label>
                <input
                  type="text"
                  value={form.serial_number}
                  onChange={(e) =>
                    setForm({ ...form, serial_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Especificaciones
              </label>
              <textarea
                value={form.specifications}
                onChange={(e) =>
                  setForm({ ...form, specifications: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                URL de imagen
              </label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de equipos */}
      {loading && !showForm ? (
        <p className="text-gray-500">Cargando equipos...</p>
      ) : equipments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">No hay equipos registrados.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crear el primer equipo
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {equipments.map((eq) => (
                <tr key={eq.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{eq.name}</td>
                  <td className="px-4 py-3 text-sm">{eq.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${statusColors[eq.status] || "bg-gray-100"}`}
                    >
                      {statusLabels[eq.status] || eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(eq)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
