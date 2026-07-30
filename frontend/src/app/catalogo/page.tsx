"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api/client";

interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
}

export default function CatalogoPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  const normalizeEquipments = (payload: any): Equipment[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.results)) return payload.results;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const res = await api.get("/equipment/");
        setEquipments(normalizeEquipments(res.data));
      } catch (error) {
        console.error("Error al cargar equipos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipments();
  }, []);

  const filtered = equipments.filter((eq) => {
    const matchSearch =
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || eq.category === category;
    return matchSearch && matchCategory;
  });

  const categories = Array.from(new Set(equipments.map((eq) => eq.category)));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Catálogo de Equipos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar equipos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Grid de equipos */}
      {loading ? (
        <p>Cargando...</p>
      ) : filtered.length === 0 ? (
        <p>No se encontraron equipos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((eq) => (
            <Link
              key={eq.id}
              href={`/catalogo/${eq.id}`}
              className="block border rounded-lg p-4 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold">{eq.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{eq.category}</p>
              <p className="text-gray-500 text-sm mt-2">{eq.description}</p>
              <span
                className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                  eq.status === "AVAILABLE"
                    ? "bg-green-100 text-green-800"
                    : eq.status === "LOANED"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {eq.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
