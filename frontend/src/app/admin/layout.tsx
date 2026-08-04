"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (!user.is_admin) {
        router.push("/dashboard");
        return;
      }
      setUserName(`${user.first_name} ${user.last_name}`);
      setIsAdmin(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!isAdmin) {
    return null; // Redirige mientras verifica
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-gray-800 text-white shadow-md">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <p className="text-sm text-gray-400">{userName}</p>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            📊 Dashboard Admin
          </Link>
          <Link
            href="/admin/aprobaciones"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            ✅ Aprobaciones
          </Link>
          <Link
            href="/admin/despacho"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            📦 Despacho
          </Link>
          <Link
            href="/admin/devoluciones"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            🔄 Devoluciones
          </Link>
          <Link
            href="/admin/disponibilidad"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            📅 Disponibilidad
          </Link>
          <Link
            href="/admin/equipos"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            🖥️ Equipos
          </Link>
          <Link
            href="/admin/usuarios"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            👤 Usuarios
          </Link>
          <hr className="border-gray-700 my-2" />
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-700 text-blue-400"
          >
            ← Volver al Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-red-400 rounded-lg hover:bg-gray-700"
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
