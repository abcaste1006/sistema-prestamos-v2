"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/client";

interface ValidUser {
  id: string;
  identification: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_admin?: boolean;
}

interface UserListInfo {
  id: string;
  semester: string;
  uploaded_at: string;
  uploaded_by: string;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<ValidUser[]>([]);
  const [listInfo, setListInfo] = useState<UserListInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [semester, setSemester] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/users/valid/");
      setUsers(res.data.users || []);
      setListInfo(res.data.list || null);
    } catch (err: any) {
      console.error("Error:", err);
      setError("Error al cargar usuarios autorizados");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Selecciona un archivo CSV");
      return;
    }

    if (!semester.trim()) {
      setError("Ingresa el semestre/periodo");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("semester", semester);

    try {
      const res = await api.post("/admin/users/import/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let msg = `✅ ${res.data.imported} usuarios importados correctamente`;
      if (res.data.errors && res.data.errors.length > 0) {
        msg += `\n⚠️ Errores: ${res.data.errors.length}`;
        console.warn("Errores de importación:", res.data.errors);
      }

      if (res.data.requires_logout) {
        msg +=
          "\n\n🔄 La lista de usuarios ha cambiado. Todos los usuarios serán desconectados.";
        setTimeout(() => {
          document.cookie = "auth_token=; path=/; max-age=0";
          localStorage.removeItem("user");
          window.location.href = "/login";
        }, 3000);
      }

      setMessage(msg);
      await fetchUsers();

      setFile(null);
      setSemester("");
      const fileInput = document.getElementById("csv-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.response?.data?.detail || "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-gray-500">
            {users.length} usuarios autorizados
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="btn btn-outline"
          disabled={loading}
        >
          Actualizar
        </button>
      </div>

      {/* Información de la lista actual */}
      {listInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Lista activa:</span>
              <span className="font-medium text-gray-700 ml-1">
                {listInfo.semester}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Subida por:</span>
              <span className="font-medium text-gray-700 ml-1">
                {listInfo.uploaded_by}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Fecha:</span>
              <span className="font-medium text-gray-700 ml-1">
                {formatDate(listInfo.uploaded_at)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="font-medium text-gray-700 ml-1">
                {users.length} usuarios
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de carga CSV */}
      <div className="card mb-6">
        <div className="card-header">
          <h3>Subir nueva lista de usuarios</h3>
        </div>
        <div className="card-body">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 whitespace-pre-line">
              {message}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Semestre / Periodo *</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Ej: 2026-1, Agosto-Diciembre 2026"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Archivo CSV *</label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="form-control p-2"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                El CSV debe tener las columnas: identification, email,
                first_name, last_name
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn btn-primary"
            >
              {uploading ? "Subiendo..." : "Subir CSV"}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de usuarios autorizados */}
      <div className="card">
        <div className="card-header">
          <h3>Usuarios Autorizados ({users.length})</h3>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No hay usuarios autorizados. Sube un archivo CSV para empezar.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="font-mono text-sm">
                        {user.identification}
                      </td>
                      <td>
                        <div className="font-medium text-gray-800">
                          {user.full_name}
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{user.email}</td>
                      <td>
                        {user.is_admin ? (
                          <span className="badge badge-blue">Admin</span>
                        ) : (
                          <span className="badge badge-gray">Usuario</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
