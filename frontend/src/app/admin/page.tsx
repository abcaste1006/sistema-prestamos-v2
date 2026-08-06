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
  verified_users: number;
  pending_users: number;
}

interface RecentLoan {
  id: string;
  user_name: string;
  user_email: string;
  status: string;
  status_display: string;
  items_count: number;
  requested_at: string;
  pickup_date: string;
  return_date: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  DISPATCHED: "bg-purple-100 text-purple-800",
  ACTIVE: "bg-green-100 text-green-800",
  RETURNED: "bg-gray-100 text-gray-800",
  CLOSED: "bg-gray-200 text-gray-600",
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Obtener estadísticas de equipos
      const equipmentsRes = await api.get("/equipment/");
      const equipments = equipmentsRes.data.results || equipmentsRes.data || [];

      // Obtener estadísticas de préstamos
      const loansRes = await api.get("/loans/my/");
      const loans = loansRes.data || [];

      // Obtener préstamos recientes (últimos 10)
      const recentRes = await api.get("/admin/loans/pending/");
      const recent = recentRes.data || [];

      // Calcular estadísticas
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

      // Obtener usuarios (simulado por ahora)
      const totalUsers = 0;
      const verifiedUsers = 0;
      const pendingUsers = 0;

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
        total_users: totalUsers,
        verified_users: verifiedUsers,
        pending_users: pendingUsers,
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <button
          onClick={fetchDashboardData}
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
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="all">Todo el tiempo</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* KPIs - Equipos */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Equipos</div>
          <div className="text-2xl font-bold text-gray-800">
            {stats?.total_equipments || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Disponibles</div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.available_equipments || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">En Préstamo</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.loaned_equipments || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Mantenimiento</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.maintenance_equipments || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Dañados</div>
          <div className="text-2xl font-bold text-red-600">
            {stats?.damaged_equipments || 0}
          </div>
        </div>
      </div>

      {/* KPIs - Préstamos */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Préstamos</div>
          <div className="text-2xl font-bold text-gray-800">
            {stats?.total_loans || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.pending_loans || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Aprobados</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.approved_loans || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Activos</div>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.active_loans || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Devueltos</div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.returned_loans || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Rechazados</div>
          <div className="text-2xl font-bold text-red-600">
            {stats?.rejected_loans || 0}
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Link
          href="/admin/aprobaciones"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center"
        >
          <div className="text-3xl mb-2">✅</div>
          <div className="font-semibold">Aprobaciones</div>
          <div className="text-sm text-gray-500">
            {stats?.pending_loans || 0} pendientes
          </div>
        </Link>
        <Link
          href="/admin/despacho"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center"
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-semibold">Despacho</div>
          <div className="text-sm text-gray-500">
            {stats?.approved_loans || 0} por despachar
          </div>
        </Link>
        <Link
          href="/admin/devoluciones"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center"
        >
          <div className="text-3xl mb-2">🔄</div>
          <div className="font-semibold">Devoluciones</div>
          <div className="text-sm text-gray-500">
            {stats?.active_loans || 0} activos
          </div>
        </Link>
        <Link
          href="/admin/equipos"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center"
        >
          <div className="text-3xl mb-2">🖥️</div>
          <div className="font-semibold">Equipos</div>
          <div className="text-sm text-gray-500">
            {stats?.total_equipments || 0} registrados
          </div>
        </Link>
      </div>

      {/* Préstamos Recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Solicitudes Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Equipos
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Retiro
                </th>
              </tr>
            </thead>
            <tbody>
              {recentLoans.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No hay solicitudes recientes
                  </td>
                </tr>
              ) : (
                recentLoans.map((loan) => (
                  <tr key={loan.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">
                      #{loan.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{loan.user_name}</div>
                      <div className="text-xs text-gray-500">
                        {loan.user_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${statusColors[loan.status] || "bg-gray-100"}`}
                      >
                        {statusLabels[loan.status] || loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {loan.items_count}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDateTime(loan.requested_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
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
  );
}
