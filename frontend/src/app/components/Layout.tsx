"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setIsAdmin(parsed.is_admin || false);
      } catch {
        // Ignorar
      }
    }
  }, []);

  // Cerrar sidebar al cambiar de ruta (móvil)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  // Si está en rutas públicas, no mostrar el layout
  const publicRoutes = ["/login", "/register", "/verify"];
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Si no está logueado, solo mostrar contenido básico
  if (!user) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ marginLeft: 0 }}>
          <header className="top-header">
            <div className="header-left">
              <span className="text-xl font-bold text-blue-600">
                Sistema de Prestamos
              </span>
            </div>
            <div className="header-right">
              <Link href="/login" className="btn btn-primary">
                Iniciar Sesion
              </Link>
            </div>
          </header>
          <div className="page-content">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Overlay para móvil */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <h1>Sistema de Prestamos</h1>
          <span>Gestion de equipos tecnologicos</span>
        </div>

        {/* Botón de cierre para móvil */}
        <button
          className="sidebar-close"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar menu"
        >
          ✕
        </button>

        <nav className="sidebar-nav">
          <div className="nav-label">Navegacion</div>
          <Link
            href="/dashboard"
            className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link
            href="/catalogo"
            className={`nav-item ${isActive("/catalogo") ? "active" : ""}`}
          >
            <span className="nav-icon">📦</span>
            Catalogo
          </Link>
          <Link
            href="/dashboard/solicitar"
            className={`nav-item ${isActive("/dashboard/solicitar") ? "active" : ""}`}
          >
            <span className="nav-icon">📝</span>
            Solicitar Prestamo
          </Link>
          <Link
            href="/dashboard/mis-prestamos"
            className={`nav-item ${isActive("/dashboard/mis-prestamos") ? "active" : ""}`}
          >
            <span className="nav-icon">📋</span>
            Mis Prestamos
          </Link>

          {isAdmin && (
            <>
              <div className="nav-label" style={{ marginTop: 16 }}>
                Administracion
              </div>
              <Link
                href="/admin"
                className={`nav-item ${isActive("/admin") ? "active" : ""}`}
              >
                <span className="nav-icon">📊</span>
                Dashboard Admin
              </Link>
              <Link
                href="/admin/aprobaciones"
                className={`nav-item ${isActive("/admin/aprobaciones") ? "active" : ""}`}
              >
                <span className="nav-icon">✅</span>
                Aprobaciones
                <span className="nav-badge">0</span>
              </Link>
              <Link
                href="/admin/despacho"
                className={`nav-item ${isActive("/admin/despacho") ? "active" : ""}`}
              >
                <span className="nav-icon">📦</span>
                Despacho
              </Link>
              <Link
                href="/admin/devoluciones"
                className={`nav-item ${isActive("/admin/devoluciones") ? "active" : ""}`}
              >
                <span className="nav-icon">🔄</span>
                Devoluciones
              </Link>
              <Link
                href="/admin/disponibilidad"
                className={`nav-item ${isActive("/admin/disponibilidad") ? "active" : ""}`}
              >
                <span className="nav-icon">📅</span>
                Disponibilidad
              </Link>
              <Link
                href="/admin/equipos"
                className={`nav-item ${isActive("/admin/equipos") ? "active" : ""}`}
              >
                <span className="nav-icon">🖥️</span>
                Equipos
              </Link>
              <Link
                href="/admin/usuarios"
                className={`nav-item ${isActive("/admin/usuarios") ? "active" : ""}`}
              >
                <span className="nav-icon">👤</span>
                Usuarios
              </Link>
              <Link
                href="/admin/historial"
                className={`nav-item ${isActive("/admin/historial") ? "active" : ""}`}
              >
                <span className="nav-icon">📜</span>
                Historial
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {user?.first_name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="user-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="user-role">
                {isAdmin ? "Administrador" : "Usuario"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <span className="header-title">
              {pathname === "/dashboard" && "Panel de Control"}
              {pathname === "/catalogo" && "Catalogo de Equipos"}
              {pathname === "/dashboard/solicitar" && "Solicitar Prestamo"}
              {pathname === "/dashboard/mis-prestamos" && "Mis Prestamos"}
              {pathname === "/admin" && "Dashboard Administrativo"}
              {pathname === "/admin/aprobaciones" && "Aprobaciones"}
              {pathname === "/admin/despacho" && "Despacho"}
              {pathname === "/admin/devoluciones" && "Devoluciones"}
              {pathname === "/admin/disponibilidad" && "Disponibilidad"}
              {pathname === "/admin/equipos" && "Gestion de Equipos"}
              {pathname === "/admin/usuarios" && "Gestion de Usuarios"}
            </span>
          </div>

          <div className="header-nav">
            <Link
              href="/catalogo"
              className={isActive("/catalogo") ? "active" : ""}
            >
              Catalogo
            </Link>
            <Link
              href="/dashboard"
              className={isActive("/dashboard") ? "active" : ""}
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={isActive("/admin") ? "active" : ""}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="header-right">
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesion
            </button>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
