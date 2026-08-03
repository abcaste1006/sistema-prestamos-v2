"use client";

import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

interface AddToCartButtonProps {
  equipmentId: string;
  name: string;
  category: string;
}

export default function AddToCartButton({
  equipmentId,
  name,
  category,
}: AddToCartButtonProps) {
  const { addItem, items } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

  const isAlreadyInCart = items.some(
    (item) => item.equipmentId === equipmentId,
  );

  const handleAdd = () => {
    if (isAlreadyInCart) {
      alert("Este equipo ya está en tu carrito");
      return;
    }
    addItem({ equipmentId, name, category });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={isAlreadyInCart}
      className={`px-4 py-2 rounded-lg transition ${
        isAlreadyInCart
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isAlreadyInCart
        ? "✓ En carrito"
        : isAdded
          ? "✓ Agregado"
          : "Agregar al carrito"}
    </button>
  );
}
