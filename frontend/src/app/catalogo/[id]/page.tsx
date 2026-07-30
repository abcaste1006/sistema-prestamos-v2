"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api/client";

interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  serial_number?: string;
  specifications?: string;
}

export default function EquipmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await api.get(`/equipment/${params.id}/`);
        setEquipment(res.data);
      } catch (error) {
        console.error("Error al cargar equipo:", error);
        router.push("/catalogo");
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [params.id, router]);

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!equipment) return <div className="p-8">Equipo no encontrado</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/catalogo"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Volver al catálogo
      </Link>

      <div className="border rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">{equipment.name}</h1>
        <p className="text-gray-600 mb-4">{equipment.category}</p>

        <div className="space-y-2 mb-6">
          <p>
            <strong>Estado:</strong> {equipment.status}
          </p>
          {equipment.serial_number && (
            <p>
              <strong>Número de serie:</strong> {equipment.serial_number}
            </p>
          )}
          {equipment.specifications && (
            <p>
              <strong>Especificaciones:</strong> {equipment.specifications}
            </p>
          )}
        </div>

        <p className="text-gray-700 mb-6">{equipment.description}</p>

        <div className="flex gap-4">
          <Link
            href={`/solicitar?equipment=${equipment.id}`}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Solicitar Préstamo
          </Link>
          <Link
            href="/catalogo"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Ver otros equipos
          </Link>
        </div>
      </div>
    </div>
  );
}
