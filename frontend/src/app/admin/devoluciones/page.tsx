"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/client";

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

export default function AdminDevolucionesPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [returningEquipmentId, setReturningEquipmentId] = useState<
    string | null
  >(null);
  const [returnNotes, setReturnNotes] = useState("");

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/loans/dispatched/");
      setLoans(res.data);
    } catch (err: any) {
      console.error("Error:", err);
      if (err.response?.status === 403) {
        setError("No tienes permisos de administrador");
      } else {
        setError("Error al cargar préstamos activos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: string, equipmentId: string) => {
    if (!confirm(`¿Estás seguro de marcar este equipo como devuelto?`)) return;

    setProcessingId(loanId);
    setReturningEquipmentId(equipmentId);
    try {
      await api.post(`/admin/loans/${loanId}/return/`, {
        equipment_ids: [equipmentId],
        condition_notes: returnNotes || undefined,
      });
      await fetchLoans();
      setReturnNotes("");
      alert("✅ Equipo marcado como devuelto");
    } catch (err: any) {
      console.error("Error:", err);
      alert("Error al marcar el equipo como devuelto");
    } finally {
      setProcessingId(null);
      setReturningEquipmentId(null);
    }
  };

  const handleReturnAll = async (loanId: string) => {
    if (!confirm("¿Estás seguro de marcar TODOS los equipos como devueltos?"))
      return;

    setProcessingId(loanId);
    try {
      await api.post(`/admin/loans/${loanId}/return/`, {
        condition_notes: "Todos los equipos devueltos",
      });
      await fetchLoans();
      alert("✅ Todos los equipos marcados como devueltos");
    } catch (err: any) {
      console.error("Error:", err);
      alert("Error al marcar los equipos como devueltos");
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetail = async (loanId: string) => {
    try {
      const res = await api.get(`/loans/${loanId}/`);
      setSelectedLoan(res.data);
      setShowDetail(true);
    } catch (err) {
      console.error("Error:", err);
      alert("Error al cargar el detalle");
    }
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
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

  const getPendingItems = (loan: Loan): LoanItem[] => {
    return loan.items?.filter((item) => !item.is_returned) || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando préstamos activos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <button
          onClick={fetchLoans}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Devoluciones de Equipos</h1>
          <p className="text-gray-600 text-sm">
            {loans.length} préstamo(s) activo(s) con equipos pendientes de
            devolución
          </p>
        </div>
        <button
          onClick={fetchLoans}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Actualizar
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">
            ✅ No hay préstamos activos con equipos pendientes
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Todos los equipos han sido devueltos
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const pendingItems = getPendingItems(loan);
            const hasPendingItems = pendingItems.length > 0;
            return (
              <div
                key={loan.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        #{loan.id.slice(0, 8)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}
                      >
                        {getStatusLabel(loan.status)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {loan.user_name} ({loan.user_email})
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>
                        {loan.returned_items_count}/{loan.items_count} devueltos
                      </span>
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
                    {loan.notes && (
                      <div className="text-sm text-gray-500 mt-1 italic">
                        Notas: {loan.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(loan.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:underline"
                    >
                      Ver detalle
                    </button>
                    {hasPendingItems && (
                      <button
                        onClick={() => handleReturnAll(loan.id)}
                        disabled={processingId === loan.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {processingId === loan.id ? "..." : "✅ Devolver todos"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de equipos pendientes */}
                {hasPendingItems && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Equipos pendientes de devolución:
                    </div>
                    <div className="space-y-2">
                      {pendingItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                        >
                          <span className="text-sm">{item.equipment_name}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Notas de devolución"
                              className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                              value={returnNotes}
                              onChange={(e) => setReturnNotes(e.target.value)}
                              disabled={processingId === loan.id}
                            />
                            <button
                              onClick={() =>
                                handleReturn(loan.id, item.equipment_id)
                              }
                              disabled={processingId === loan.id}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                              {processingId === loan.id &&
                              returningEquipmentId === item.equipment_id
                                ? "..."
                                : "Devolver"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                    Detalle del Préstamo #{selectedLoan.id.slice(0, 8)}
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
                  <div className="text-sm text-gray-500">Solicitante</div>
                  <div className="font-medium">{selectedLoan.user_name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedLoan.user_email}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Equipos</div>
                  <div className="font-medium">
                    {selectedLoan.returned_items_count}/
                    {selectedLoan.items_count} devueltos
                  </div>
                </div>
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
                  <div className="text-sm text-gray-500">Despachado</div>
                  <div>{formatDateTime(selectedLoan.dispatched_at)}</div>
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
                                  {item.condition_notes && (
                                    <span className="text-xs text-gray-500 block">
                                      {item.condition_notes}
                                    </span>
                                  )}
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
