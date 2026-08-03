"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setUserName(`${user.first_name} ${user.last_name}`);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-600">{userName}</p>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600"
          >
            📊 Panel de Control
          </Link>
          <Link
            href="/dashboard/solicitar"
            className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600"
          >
            📝 Solicitar Préstamo
          </Link>
          <Link
            href="/dashboard/mis-prestamos"
            className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600"
          >
            📋 Mis Préstamos
          </Link>
          <Link
            href="/catalogo"
            className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600"
          >
            🔍 Catálogo
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-red-600 rounded-lg hover:bg-red-50"
          >
            🚪 Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
