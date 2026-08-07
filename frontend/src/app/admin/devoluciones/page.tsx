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
  items_count: number;
  returned_items_count: number;
  requested_at: string;
  approved_at: string | null;
  dispatched_at: string | null;
  pickup_date: string;
  return_date: string;
  pickup_time: string;
  return_time: string;
  notes: string | null;
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

export default function AdminDevolucionesPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [returningEquipmentId, setReturningEquipmentId] = useState<
    string | null
  >(null);
  const [returnStatus, setReturnStatus] = useState<string>("OK");
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

  const handleReceive = async (loanId: string, equipmentId: string) => {
    if (
      !confirm(
        `¿Estás seguro de recepcionar este equipo como "${returnStatus}"?`,
      )
    )
      return;

    setProcessingId(loanId);
    setReturningEquipmentId(equipmentId);
    try {
      await api.post(`/admin/loans/${loanId}/receive/`, {
        equipment_id: equipmentId,
        return_status: returnStatus,
        return_notes: returnNotes || undefined,
      });
      await fetchLoans();
      setReturnNotes("");
      setReturnStatus("OK");
      alert("✅ Equipo recepcionado exitosamente");
    } catch (err: any) {
      console.error("Error:", err);
      alert("❌ Error al recepcionar el equipo");
    } finally {
      setProcessingId(null);
      setReturningEquipmentId(null);
    }
  };

  const handleReceiveAll = async (loanId: string) => {
    if (!confirm("¿Estás seguro de recepcionar TODOS los equipos como OK?"))
      return;

    setProcessingId(loanId);
    try {
      const loan = loans.find((l) => l.id === loanId);
      if (!loan) return;

      const pendingItems =
        loan.items?.filter((item) => !item.is_returned) || [];

      for (const item of pendingItems) {
        await api.post(`/admin/loans/${loanId}/receive/`, {
          equipment_id: item.equipment_id,
          return_status: "OK",
          return_notes: "Todos los equipos recepcionados OK",
        });
      }

      await fetchLoans();
      alert("✅ Todos los equipos recepcionados exitosamente");
    } catch (err: any) {
      console.error("Error:", err);
      alert("❌ Error al recepcionar los equipos");
    } finally {
      setProcessingId(null);
    }
  };

  const getPendingItems = (loan: Loan): LoanItem[] => {
    if (!loan.items || !Array.isArray(loan.items)) return [];
    return loan.items.filter((item) => !item.is_returned);
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
          <h2 className="text-xl font-semibold text-gray-800">
            Recepción de Equipos
          </h2>
          <p className="text-sm text-gray-500">
            {loans.length} préstamo(s) activo(s) con equipos pendientes
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
              No hay préstamos activos con equipos pendientes
            </h3>
            <p className="text-gray-400 text-sm">
              Todos los equipos han sido recepcionados
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const pendingItems = getPendingItems(loan);
            const hasPendingItems = pendingItems.length > 0;
            const isFullyReturned =
              loan.returned_items_count === loan.items_count;

            return (
              <div
                key={loan.id}
                className={`card ${isFullyReturned ? "border-l-4 border-l-green-500" : "border-l-4 border-l-yellow-500"}`}
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
                        {isFullyReturned && (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                            Recepción completa
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>
                          {loan.returned_items_count}/{loan.items_count}{" "}
                          recepcionados
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
                        <div className="text-sm text-gray-400 mt-1 italic">
                          Notas: {loan.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasPendingItems && (
                        <button
                          onClick={() => handleReceiveAll(loan.id)}
                          disabled={processingId === loan.id}
                          className="btn btn-sm btn-success"
                        >
                          {processingId === loan.id ? "..." : "Recibir todos"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de equipos pendientes */}
                  {hasPendingItems && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm font-medium text-gray-600 mb-2">
                        Equipos pendientes de recepción:
                      </div>
                      <div className="space-y-2">
                        {pendingItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-3 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {item.equipment_name}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <select
                                value={returnStatus}
                                onChange={(e) =>
                                  setReturnStatus(e.target.value)
                                }
                                className="form-control w-32 text-sm"
                                disabled={processingId === loan.id}
                              >
                                <option value="OK">✅ OK</option>
                                <option value="DAMAGED">⚠️ Dañado</option>
                                <option value="MISSING">❌ Faltante</option>
                                <option value="LATE">⏰ Tarde</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Notas"
                                className="form-control w-28 text-sm"
                                value={returnNotes}
                                onChange={(e) => setReturnNotes(e.target.value)}
                                disabled={processingId === loan.id}
                              />
                              <button
                                onClick={() =>
                                  handleReceive(loan.id, item.equipment_id)
                                }
                                disabled={processingId === loan.id}
                                className="btn btn-sm btn-primary"
                              >
                                {processingId === loan.id &&
                                returningEquipmentId === item.equipment_id
                                  ? "..."
                                  : "Recibir"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
