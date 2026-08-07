"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils/formatDate";

interface DashboardStats {
  total_equipments: number;
  available_equipments: number;
  loaned_equipments: number;
  maintenance_equipments: number;
  damaged_equipments: number;
  total_loans: number;
  pending_loans: number;
  approved_loans: number;
  active_loans: number;
  returned_loans: number;
  rejected_loans: number;
  total_users: number;
}

interface RecentLoan {
  id: string;
  user_name: string;
  user_email: string;
  status: string;
  items_count: number;
  requested_at: string;
  pickup_date: string;
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const equipmentsRes = await api.get("/equipment/");
      const equipments = equipmentsRes.data.results || equipmentsRes.data || [];

      const loansRes = await api.get("/loans/my/");
      const loans = loansRes.data || [];

      const recentRes = await api.get("/admin/loans/pending/");
      const recent = recentRes.data || [];

      const totalEquipments = equipments.length;
      const availableEquipments = equipments.filter(
        (e: any) => e.status === "AVAILABLE",
      ).length;
      const loanedEquipments = equipments.filter(
        (e: any) => e.status === "LOANED",
      ).length;
      const maintenanceEquipments = equipments.filter(
        (e: any) => e.status === "MAINTENANCE",
      ).length;
      const damagedEquipments = equipments.filter(
        (e: any) => e.status === "DAMAGED",
      ).length;

      const totalLoans = loans.length;
      const pendingLoans = loans.filter(
        (l: any) => l.status === "PENDING",
      ).length;
      const approvedLoans = loans.filter(
        (l: any) => l.status === "APPROVED",
      ).length;
      const activeLoans = loans.filter(
        (l: any) => l.status === "ACTIVE" || l.status === "DISPATCHED",
      ).length;
      const returnedLoans = loans.filter(
        (l: any) => l.status === "RETURNED" || l.status === "CLOSED",
      ).length;
      const rejectedLoans = loans.filter(
        (l: any) => l.status === "REJECTED",
      ).length;

      setStats({
        total_equipments: totalEquipments,
        available_equipments: availableEquipments,
        loaned_equipments: loanedEquipments,
        maintenance_equipments: maintenanceEquipments,
        damaged_equipments: damagedEquipments,
        total_loans: totalLoans,
        pending_loans: pendingLoans,
        approved_loans: approvedLoans,
        active_loans: activeLoans,
        returned_loans: returnedLoans,
        rejected_loans: rejectedLoans,
        total_users: 0,
      });

      setRecentLoans(recent.slice(0, 10));
    } catch (err: any) {
      console.error("Error:", err);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
        <button
          onClick={fetchDashboardData}
          className="ml-4 btn btn-sm btn-danger"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* KPIs - Equipos */}
      <div className="section-header">
        <h2>Inventario de Equipos</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🖥️</div>
          <div className="stat-value">{stats?.total_equipments || 0}</div>
          <div className="stat-label">Total Equipos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {stats?.available_equipments || 0}
          </div>
          <div className="stat-label">Disponibles</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {stats?.loaned_equipments || 0}
          </div>
          <div className="stat-label">En Prestamo</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-value" style={{ color: "var(--gray-500)" }}>
            {stats?.maintenance_equipments || 0}
          </div>
          <div className="stat-label">Mantenimiento</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {stats?.damaged_equipments || 0}
          </div>
          <div className="stat-label">Dañados</div>
        </div>
      </div>

      {/* KPIs - Préstamos */}
      <div className="section-header">
        <h2>Gestion de Prestamos</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats?.total_loans || 0}</div>
          <div className="stat-label">Total Prestamos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {stats?.pending_loans || 0}
          </div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {stats?.approved_loans || 0}
          </div>
          <div className="stat-label">Aprobados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {stats?.active_loans || 0}
          </div>
          <div className="stat-label">Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: "var(--gray-500)" }}>
            {stats?.returned_loans || 0}
          </div>
          <div className="stat-label">Devueltos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {stats?.rejected_loans || 0}
          </div>
          <div className="stat-label">Rechazados</div>
        </div>
      </div>

      {/* Acciones Rápidas Admin */}
      <div className="card mb-6">
        <div className="card-header">
          <h3>Acciones Rapidas</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/aprobaciones" className="btn btn-primary">
              Ver Aprobaciones
              {stats?.pending_loans && stats.pending_loans > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                  {stats.pending_loans}
                </span>
              )}
            </Link>
            <Link href="/admin/despacho" className="btn btn-outline">
              Ir a Despacho
            </Link>
            <Link href="/admin/devoluciones" className="btn btn-outline">
              Ir a Devoluciones
            </Link>
            <Link href="/admin/equipos" className="btn btn-outline">
              Gestionar Equipos
            </Link>
          </div>
        </div>
      </div>

      {/* Solicitudes Recientes */}
      <div className="card">
        <div className="card-header">
          <h3>Solicitudes Recientes</h3>
          <Link href="/admin/aprobaciones" className="section-link">
            Ver todas →
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-wrap">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Estado</th>
                  <th>Equipos</th>
                  <th>Fecha</th>
                  <th>Retiro</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-6">
                      No hay solicitudes recientes
                    </td>
                  </tr>
                ) : (
                  recentLoans.map((loan) => (
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
                        {formatDate(loan.pickup_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
