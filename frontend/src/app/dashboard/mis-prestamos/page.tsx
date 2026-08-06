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

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  DISPATCHED: "bg-purple-100 text-purple-800 border-purple-300",
  ACTIVE: "bg-green-100 text-green-800 border-green-300",
  RETURNED: "bg-gray-100 text-gray-800 border-gray-300",
  CLOSED: "bg-gray-200 text-gray-600 border-gray-400",
};

const statusLabels: Record<string, string> = {
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

  const getStatusColor = (status: string) => {
    return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando tus préstamos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Préstamos</h1>
        <Link
          href="/dashboard/solicitar"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nueva Solicitud
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === "PENDING"
              ? "bg-yellow-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter("APPROVED")}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === "APPROVED"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Aprobados
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === "ACTIVE"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          En uso
        </button>
        <button
          onClick={() => setFilter("RETURNED")}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === "RETURNED"
              ? "bg-gray-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Devueltos
        </button>
        <button
          onClick={() => setFilter("REJECTED")}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === "REJECTED"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Rechazados
        </button>
      </div>

      {/* Lista de préstamos */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No hay préstamos que mostrar.</p>
          <Link
            href="/dashboard/solicitar"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Solicitar mi primer préstamo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => handleViewDetail(loan.id)}
            >
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">
                      Préstamo #{loan.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}
                    >
                      {getStatusLabel(loan.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>{loan.items_count} equipos</span>
                    <span className="mx-2">•</span>
                    <span>
                      Retiro: {formatDate(loan.pickup_date)} {loan.pickup_time}
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
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Creado: {formatDateTime(loan.requested_at)}</div>
                  {loan.approved_at && (
                    <div>Aprobado: {formatDateTime(loan.approved_at)}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {showDetail && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Préstamo #{selectedLoan.id.slice(0, 8)}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedLoan.status)}`}
                    >
                      {getStatusLabel(selectedLoan.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedLoan(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Fecha de retiro</div>
                  <div>
                    {formatDate(selectedLoan.pickup_date)}{" "}
                    {selectedLoan.pickup_time}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">
                    Fecha de devolución
                  </div>
                  <div>
                    {formatDate(selectedLoan.return_date)}{" "}
                    {selectedLoan.return_time}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Solicitado</div>
                  <div>{formatDateTime(selectedLoan.requested_at)}</div>
                </div>
                {selectedLoan.approved_at && (
                  <div>
                    <div className="text-sm text-gray-500">Aprobado</div>
                    <div>{formatDateTime(selectedLoan.approved_at)}</div>
                  </div>
                )}
                {selectedLoan.rejected_at && (
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500">
                      Motivo del rechazo
                    </div>
                    <div className="text-red-600">
                      {selectedLoan.rejected_reason}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">Equipos</div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Equipo</th>
                        <th className="px-4 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoan.items && selectedLoan.items.length > 0 ? (
                        selectedLoan.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-2">{item.equipment_name}</td>
                            <td className="px-4 py-2">
                              {item.is_returned ? (
                                <span className="text-green-600">
                                  ✓ Devuelto
                                </span>
                              ) : (
                                <span className="text-yellow-600">
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
                            className="px-4 py-2 text-center text-gray-500"
                          >
                            No hay equipos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedLoan.notes && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Notas</div>
                  <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedLoan.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedLoan(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
