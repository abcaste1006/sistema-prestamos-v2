"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

export default function CartFloating() {
  const [isMounted, setIsMounted] = useState(false);
  const { items, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // No renderizar nada en el servidor para evitar hidratación
  if (!isMounted) return null;
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/dashboard/solicitar"
        className="flex items-center gap-3 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <span className="text-lg">🛒</span>
        <span className="font-semibold">{totalItems} equipo(s)</span>
        <span className="text-sm opacity-75">→</span>
      </Link>
    </div>
  );
}
