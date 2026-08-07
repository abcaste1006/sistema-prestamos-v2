"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils/formatDate";

interface Loan {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  status: string;
  items_count: number;
  requested_at: string;
  approved_at: string | null;
  pickup_date: string;
  return_date: string;
  pickup_time: string;
  return_time: string;
  notes: string | null;
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

export default function AdminDespachoPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/loans/approved/");
      setLoans(res.data);
    } catch (err: any) {
      console.error("Error:", err);
      if (err.response?.status === 403) {
        setError("No tienes permisos de administrador");
      } else {
        setError("Error al cargar préstamos aprobados");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (loanId: string) => {
    if (!confirm("¿Estás seguro de despachar los equipos de este préstamo?"))
      return;

    setProcessingId(loanId);
    try {
      await api.post(`/admin/loans/${loanId}/dispatch/`, {});
      await fetchLoans();
      alert("✅ Equipos despachados exitosamente");
    } catch (err: any) {
      console.error("Error:", err);
      alert("❌ Error al despachar los equipos");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando préstamos aprobados...</div>
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
            Despacho de Equipos
          </h2>
          <p className="text-sm text-gray-500">
            {loans.length} préstamo(s) listos para despachar
          </p>
        </div>
        <button onClick={fetchLoans} className="btn btn-outline">
          Actualizar
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay préstamos pendientes de despacho
            </h3>
            <p className="text-gray-400 text-sm">
              Todos los préstamos aprobados ya han sido despachados
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
                      onClick={() => handleDispatch(loan.id)}
                      disabled={processingId === loan.id}
                      className="btn btn-primary"
                    >
                      {processingId === loan.id ? "..." : "📦 Despachar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
