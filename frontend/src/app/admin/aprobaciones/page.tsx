"use client";

import { useState, useEffect } from "react";
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

export default function AdminAprobacionesPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectLoanId, setRejectLoanId] = useState<string | null>(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/loans/pending/");
      setLoans(res.data);
    } catch (err: any) {
      console.error("Error:", err);
      if (err.response?.status === 403) {
        setError("No tienes permisos de administrador");
      } else {
        setError("Error al cargar solicitudes pendientes");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId: string) => {
    if (!confirm("¿Estás seguro de aprobar esta solicitud?")) return;

    setProcessingId(loanId);
    try {
      const response = await api.post(`/admin/loans/${loanId}/approve/`, {});
      if (response.status === 200) {
        alert("✅ Solicitud aprobada exitosamente");
        await fetchLoans();
      }
    } catch (err: any) {
      console.error("Error:", err);
      alert(
        "❌ " + (err.response?.data?.detail || "Error al aprobar la solicitud"),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (loanId: string) => {
    setRejectLoanId(loanId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert("Debes ingresar un motivo para el rechazo");
      return;
    }

    const loanId = rejectLoanId;
    setShowRejectModal(false);
    setProcessingId(loanId!);

    try {
      await api.post(`/admin/loans/${loanId}/reject/`, {
        reason: rejectReason,
      });
      await fetchLoans();
      alert("✅ Solicitud rechazada");
    } catch (err: any) {
      console.error("Error:", err);
      alert("❌ Error al rechazar la solicitud");
    } finally {
      setProcessingId(null);
      setRejectLoanId(null);
      setRejectReason("");
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando solicitudes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
        <button onClick={fetchLoans} className="ml-4 btn btn-sm btn-danger">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Aprobaciones</h2>
          <p className="text-sm text-gray-500">
            {loans.length} solicitud(es) pendiente(s)
          </p>
        </div>
        <button onClick={fetchLoans} className="btn btn-outline">
          Actualizar
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay solicitudes pendientes
            </h3>
            <p className="text-gray-400 text-sm">
              Todas las solicitudes han sido procesadas
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="card hover:border-blue-300 transition-all duration-200"
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
                        {loan.user_name} ({loan.user_email})
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
                    {loan.notes && (
                      <div className="text-sm text-gray-400 mt-1 italic">
                        Notas: {loan.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetail(loan.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver detalle
                    </button>
                    <button
                      onClick={() => handleApprove(loan.id)}
                      disabled={processingId === loan.id}
                      className="btn btn-sm btn-success"
                    >
                      {processingId === loan.id ? "..." : "Aprobar"}
                    </button>
                    <button
                      onClick={() => handleRejectClick(loan.id)}
                      disabled={processingId === loan.id}
                      className="btn btn-sm btn-danger"
                    >
                      {processingId === loan.id ? "..." : "Rechazar"}
                    </button>
                  </div>
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
                    Solicitante
                  </div>
                  <div className="font-medium">{selectedLoan.user_name}</div>
                  <div className="text-sm text-gray-500">
                    {selectedLoan.user_email}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Equipos
                  </div>
                  <div className="font-medium">{selectedLoan.items_count}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Fecha de retiro
                  </div>
                  <div>
                    {formatDate(selectedLoan.pickup_date)}{" "}
                    {selectedLoan.pickup_time}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Fecha de devolución
                  </div>
                  <div>
                    {formatDate(selectedLoan.return_date)}{" "}
                    {selectedLoan.return_time}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Solicitado
                  </div>
                  <div>{formatDateTime(selectedLoan.requested_at)}</div>
                </div>
              </div>

              {selectedLoan.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Notas
                  </div>
                  <div className="text-gray-700">{selectedLoan.notes}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
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

      {/* Modal de rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Rechazar Solicitud
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                ¿Por qué estás rechazando esta solicitud?
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Escribe el motivo del rechazo..."
                className="form-control w-full min-h-[100px]"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setRejectLoanId(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="btn btn-danger"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
