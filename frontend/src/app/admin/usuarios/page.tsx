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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(`✅ ${res.data.imported} usuarios importados correctamente`);

      if (res.data.errors && res.data.errors.length > 0) {
        setMessage((prev) => prev + `\n⚠️ Errores: ${res.data.errors.length}`);
        console.warn("Errores de importación:", res.data.errors);
      }

      // Si el backend indica que se requiere logout
      if (res.data.requires_logout) {
        // Mostrar mensaje adicional
        setMessage(
          (prev) =>
            prev +
            "\n\n🔄 La lista de usuarios ha cambiado. Todos los usuarios serán desconectados.",
        );

        // Forzar logout después de 3 segundos
        setTimeout(() => {
          // Limpiar cookies y localStorage
          document.cookie = "auth_token=; path=/; max-age=0";
          localStorage.removeItem("user");
          // Redirigir a login
          window.location.href = "/login";
        }, 3000);
      }

      // Recargar la lista
      await fetchUsers();

      // Resetear formulario
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios Autorizados</h1>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Información de la lista actual */}
      {listInfo && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            <strong>Lista activa:</strong> {listInfo.semester}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Subida por:</strong> {listInfo.uploaded_by} el{" "}
            {formatDate(listInfo.uploaded_at)}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Total usuarios:</strong> {users.length}
          </p>
        </div>
      )}

      {/* Formulario de carga CSV */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Subir nueva lista de usuarios (CSV)
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
            {message}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Semestre / Periodo *
            </label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="Ej: 2026-1, Agosto-Diciembre 2026"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Archivo CSV *
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              El CSV debe tener las columnas: identification, email, first_name,
              last_name
            </p>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "📤 Subir CSV"}
          </button>
        </form>
      </div>

      {/* Lista de usuarios autorizados */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            Usuarios Autorizados ({users.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay usuarios autorizados. Sube un archivo CSV para empezar.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Cédula
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Correo
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.identification}</td>
                    <td className="px-4 py-3 text-sm">{user.full_name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
