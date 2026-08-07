"use client";

import { useState, useEffect } from "react";
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

const statusBadge: Record<string, string> = {
  AVAILABLE: "badge-green",
  LOANED: "badge-yellow",
  MAINTENANCE: "badge-gray",
  DAMAGED: "badge-red",
};

const statusLabel: Record<string, string> = {
  AVAILABLE: "Disponible",
  LOANED: "En préstamo",
  MAINTENANCE: "Mantenimiento",
  DAMAGED: "Dañado",
};

export default function AdminEquiposPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
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

  const fetchEquipments = async () => {
    try {
      const res = await api.get("/equipment/");
      const data = res.data.results || res.data || [];
      setEquipments(data);
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

  if (loading && !showForm) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando equipos...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Gestión de Equipos
          </h2>
          <p className="text-sm text-gray-500">
            {equipments.length} equipos registrados
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          disabled={loading}
        >
          + Nuevo Equipo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3>{editingId ? "Editar Equipo" : "Nuevo Equipo"}</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="form-control"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="form-control"
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="LOANED">En préstamo</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="DAMAGED">Dañado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Número de serie</label>
                  <input
                    type="text"
                    value={form.serial_number}
                    onChange={(e) =>
                      setForm({ ...form, serial_number: e.target.value })
                    }
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Especificaciones</label>
                <textarea
                  value={form.specifications}
                  onChange={(e) =>
                    setForm({ ...form, specifications: e.target.value })
                  }
                  className="form-control"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL de imagen</label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="form-control"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listado de equipos */}
      {equipments.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4">🖥️</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay equipos registrados
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Comienza agregando tu primer equipo
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              Crear el primer equipo
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-wrap">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((eq) => (
                    <tr key={eq.id}>
                      <td>
                        <div className="font-medium text-gray-800">
                          {eq.name}
                        </div>
                        {eq.description && (
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {eq.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {eq.category}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${statusBadge[eq.status] || "badge-gray"}`}
                        >
                          {statusLabel[eq.status] || eq.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(eq)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(eq.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
