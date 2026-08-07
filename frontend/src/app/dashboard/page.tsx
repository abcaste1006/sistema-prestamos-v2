"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api/client";

interface DashboardStats {
  total_loans: number;
  pending_loans: number;
  active_loans: number;
  returned_loans: number;
  rejected_loans: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_loans: 0,
    pending_loans: 0,
    active_loans: 0,
    returned_loans: 0,
    rejected_loans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/loans/my/");
      const loans = res.data || [];

      setStats({
        total_loans: loans.length,
        pending_loans: loans.filter((l: any) => l.status === "PENDING").length,
        active_loans: loans.filter(
          (l: any) => l.status === "ACTIVE" || l.status === "DISPATCHED",
        ).length,
        returned_loans: loans.filter(
          (l: any) => l.status === "RETURNED" || l.status === "CLOSED",
        ).length,
        rejected_loans: loans.filter((l: any) => l.status === "REJECTED")
          .length,
      });
    } catch (error) {
      console.error("Error al cargar estadisticas:", error);
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

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.total_loans}</div>
          <div className="stat-label">Total Prestamos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pending_loans}</div>
          <div className="stat-label">Pendientes</div>
          {stats.pending_loans > 0 && (
            <span className="stat-badge up">
              +{stats.pending_loans} pendientes
            </span>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.active_loans}</div>
          <div className="stat-label">En uso</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.returned_loans}</div>
          <div className="stat-label">Completados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{stats.rejected_loans}</div>
          <div className="stat-label">Rechazados</div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="card mb-6">
        <div className="card-header">
          <h3>Acciones Rapidas</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/solicitar" className="btn btn-primary">
              Solicitar Prestamo
            </Link>
            <Link href="/dashboard/mis-prestamos" className="btn btn-outline">
              Ver Mis Prestamos
            </Link>
            <Link href="/catalogo" className="btn btn-outline">
              Explorar Catalogo
            </Link>
          </div>
        </div>
      </div>

      {/* Últimos préstamos - resumen */}
      <div className="card">
        <div className="card-header">
          <h3>Resumen de Prestamos</h3>
          <Link href="/dashboard/mis-prestamos" className="section-link">
            Ver todos →
          </Link>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">
                Pendientes de aprobacion
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending_loans}
              </div>
              {stats.pending_loans > 0 && (
                <Link
                  href="/dashboard/mis-prestamos?filter=PENDING"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Revisar solicitudes →
                </Link>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Equipos en tu poder</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.active_loans}
              </div>
              {stats.active_loans > 0 && (
                <Link
                  href="/dashboard/mis-prestamos?filter=ACTIVE"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver equipos activos →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
