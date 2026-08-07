"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserName(`${user.first_name} ${user.last_name}`);
        setIsAdmin(user.is_admin || false);
      } catch {
        // Ignorar
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">
              Sistema de Préstamos
            </span>
          </Link>

          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 transition"
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className="text-gray-600 hover:text-blue-600 transition"
            >
              Catálogo
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-blue-600 transition"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Usuario y Logout */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-sm text-gray-700 font-medium">
                  {userName}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
