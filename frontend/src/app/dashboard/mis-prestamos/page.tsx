"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils/formatDate";

interface LoanItem {
  id: string;
  equipment_id: string;
  equipment_name: string;
  is_returned: boolean;
  returned_at: string | null;
  condition_notes: string | null;
}

interface Loan {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  status: string;
  status_display: string;
  items_count: number;
  returned_items_count: number;
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  dispatched_at: string | null;
  returned_at: string | null;
  pickup_date: string;
  return_date: string;
  pickup_time: string;
  return_time: string;
  notes: string | null;
  terms_accepted: boolean;
  items?: LoanItem[];
}

const statusBadge: Record<string, string> = {
  PENDING: "badge-yellow",
  APPROVED: "badge-blue",
  REJECTED: "badge-red",
  DISPATCHED: "badge-gray",
  ACTIVE: "badge-green",
  RETURNED: "badge-gray",
  CLOSED: "badge-gray",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  DISPATCHED: "Despachado",
  ACTIVE: "Activo",
  RETURNED: "Devuelto",
  CLOSED: "Cerrado",
};

export default function MisPrestamosPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/loans/my/");
      setLoans(res.data);
    } catch (err: any) {
      console.error("Error al cargar préstamos:", err);
      setError("Error al cargar tus préstamos");
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans =
    filter === "all" ? loans : loans.filter((loan) => loan.status === filter);

  const handleViewDetail = async (loanId: string) => {
    try {
      const res = await api.get(`/loans/${loanId}/`);
      setSelectedLoan(res.data);
      setShowDetail(true);
    } catch (err) {
      console.error("Error al cargar detalle:", err);
      setError("Error al cargar el detalle del préstamo");
    }
  };

  const getFilterCount = (status: string) => {
    if (status === "all") return loans.length;
    return loans.filter((l) => l.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando tus préstamos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Mis Préstamos</h2>
          <p className="text-sm text-gray-500">
            {loans.length} préstamos en total
          </p>
        </div>
        <Link href="/dashboard/solicitar" className="btn btn-primary">
          + Nueva Solicitud
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos ({getFilterCount("all")})
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "PENDING"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pendientes ({getFilterCount("PENDING")})
        </button>
        <button
          onClick={() => setFilter("APPROVED")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "APPROVED"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Aprobados ({getFilterCount("APPROVED")})
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "ACTIVE"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          En uso ({getFilterCount("ACTIVE")})
        </button>
        <button
          onClick={() => setFilter("RETURNED")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "RETURNED"
              ? "bg-gray-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Devueltos ({getFilterCount("RETURNED")})
        </button>
        <button
          onClick={() => setFilter("REJECTED")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === "REJECTED"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Rechazados ({getFilterCount("REJECTED")})
        </button>
      </div>

      {/* Lista de préstamos */}
      {filteredLoans.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay préstamos que mostrar
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Aún no has realizado ninguna solicitud
            </p>
            <Link href="/dashboard/solicitar" className="btn btn-primary">
              Solicitar mi primer préstamo
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div
              key={loan.id}
              className="card hover:border-blue-300 transition-all duration-200 cursor-pointer"
              onClick={() => handleViewDetail(loan.id)}
            >
              <div className="card-body">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-medium text-gray-700">
                        #{loan.id.slice(0, 8)}
                      </span>
                      <span
                        className={`badge ${statusBadge[loan.status] || "badge-gray"}`}
                      >
                        {statusLabel[loan.status] || loan.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {loan.user_name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>{loan.items_count} equipos</span>
                      <span className="mx-2">•</span>
                      <span>
                        Retiro: {formatDate(loan.pickup_date)}{" "}
                        {loan.pickup_time}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Devolución: {formatDate(loan.return_date)}{" "}
                        {loan.return_time}
                      </span>
                    </div>
                    {loan.rejected_reason && (
                      <div className="text-sm text-red-600 mt-1">
                        Motivo: {loan.rejected_reason}
                      </div>
                    )}
                    {loan.notes && (
                      <div className="text-sm text-gray-400 mt-1 italic">
                        Notas: {loan.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-400 flex-shrink-0">
                    <div>Creado: {formatDateTime(loan.requested_at)}</div>
                    {loan.approved_at && (
                      <div>Aprobado: {formatDateTime(loan.approved_at)}</div>
                    )}
                    {loan.returned_at && (
                      <div>Devuelto: {formatDateTime(loan.returned_at)}</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-blue-600 font-medium">
                    Ver detalles →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {showDetail && selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Préstamo #{selectedLoan.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedLoan(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`badge ${statusBadge[selectedLoan.status] || "badge-gray"}`}
                >
                  {statusLabel[selectedLoan.status] || selectedLoan.status}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedLoan.user_name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Fecha de retiro
                  </div>
                  <div className="font-medium">
                    {formatDate(selectedLoan.pickup_date)}{" "}
                    {selectedLoan.pickup_time}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Fecha de devolución
                  </div>
                  <div className="font-medium">
                    {formatDate(selectedLoan.return_date)}{" "}
                    {selectedLoan.return_time}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Solicitado
                  </div>
                  <div className="font-medium">
                    {formatDateTime(selectedLoan.requested_at)}
                  </div>
                </div>
                {selectedLoan.approved_at && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      Aprobado
                    </div>
                    <div className="font-medium">
                      {formatDateTime(selectedLoan.approved_at)}
                    </div>
                  </div>
                )}
                {selectedLoan.rejected_at && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      Motivo del rechazo
                    </div>
                    <div className="text-red-600 font-medium">
                      {selectedLoan.rejected_reason}
                    </div>
                  </div>
                )}
              </div>

              {selectedLoan.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Notas
                  </div>
                  <div className="text-gray-700">{selectedLoan.notes}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  Equipos
                </div>
                <div className="table-wrap">
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoan.items && selectedLoan.items.length > 0 ? (
                        selectedLoan.items.map((item) => (
                          <tr key={item.id}>
                            <td className="font-medium">
                              {item.equipment_name}
                            </td>
                            <td>
                              {item.is_returned ? (
                                <span className="text-green-600 text-sm font-medium">
                                  ✓ Devuelto
                                  {item.condition_notes && (
                                    <span className="block text-xs text-gray-400 font-normal">
                                      {item.condition_notes}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-yellow-600 text-sm font-medium">
                                  ⏳ Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center text-gray-400 py-4"
                          >
                            No hay equipos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedLoan(null);
                  }}
                  className="btn btn-outline"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
