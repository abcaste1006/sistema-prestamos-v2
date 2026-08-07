"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils/formatDate";

interface Loan {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  status: string;
  items_count: number;
  returned_items_count: number;
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  dispatched_at: string | null;
  returned_at: string | null;
  pickup_date: string;
  return_date: string;
  pickup_time: string;
  return_time: string;
  notes: string | null;
  items?: any[];
}

const statusBadge: Record<string, string> = {
  PENDING: "badge-yellow",
  APPROVED: "badge-blue",
  REJECTED: "badge-red",
  ACTIVE: "badge-green",
  RETURNED: "badge-gray",
  CLOSED: "badge-gray",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  ACTIVE: "Activo",
  RETURNED: "Devuelto",
  CLOSED: "Cerrado",
};

export default function AdminHistorialPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [page, startDate, endDate, statusFilter, search]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });

      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await api.get(`/admin/loans/history/?${params.toString()}`);
      setLoans(res.data.results || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err: any) {
      console.error("Error:", err);
      setError("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setSearch("");
    setPage(1);
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Historial de Préstamos
          </h2>
          <p className="text-sm text-gray-500">{total} préstamos en total</p>
        </div>
        <button onClick={fetchHistory} className="btn btn-outline">
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="form-group">
              <label className="form-label">Buscar</label>
              <input
                type="text"
                placeholder="Usuario o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
              >
                <option value="">Todos</option>
                {Object.entries(statusLabel).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                max={today}
                className="form-control"
              />
            </div>
            <div className="form-group flex items-end gap-2">
              <button onClick={clearFilters} className="btn btn-outline w-full">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {loans.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay préstamos que mostrar
            </h3>
            <p className="text-gray-400 text-sm">
              {search || statusFilter || startDate || endDate
                ? "Prueba con otros filtros"
                : "Aún no hay préstamos registrados"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-body p-0">
              <div className="table-wrap">
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Estado</th>
                      <th>Equipos</th>
                      <th>Solicitado</th>
                      <th>Retiro</th>
                      <th>Devolución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => (
                      <tr key={loan.id}>
                        <td className="font-mono text-sm">
                          #{loan.id.slice(0, 8)}
                        </td>
                        <td>
                          <div className="font-medium text-sm">
                            {loan.user_name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {loan.user_email}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${statusBadge[loan.status] || "badge-gray"}`}
                          >
                            {statusLabel[loan.status] || loan.status}
                          </span>
                        </td>
                        <td className="text-center">{loan.items_count}</td>
                        <td className="text-sm">
                          {formatDateTime(loan.requested_at)}
                        </td>
                        <td className="text-sm">
                          {formatDate(loan.pickup_date)} {loan.pickup_time}
                        </td>
                        <td className="text-sm">
                          {formatDate(loan.return_date)} {loan.return_time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Mostrando {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, total)} de {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                  className="btn btn-outline btn-sm"
                >
                  Anterior
                </button>
                <span className="flex items-center px-3 text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page >= totalPages}
                  className="btn btn-outline btn-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
