export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Sistema de Préstamos de Equipos. Todos
          los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
