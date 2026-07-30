export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Sistema de Préstamos de Equipos
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Gestiona eficientemente el préstamo de equipos tecnológicos para
          estudiantes y docentes.
        </p>
        <div className="space-x-4">
          <a
            href="/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Registrarse
          </a>
          <a
            href="/catalogo"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Ver Catálogo
          </a>
        </div>
      </div>

      {/* Características */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-2">📋 Solicitar Préstamo</h3>
          <p className="text-gray-600">
            Selecciona equipos, elige fechas y envía tu solicitud.
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-2">📊 Seguimiento</h3>
          <p className="text-gray-600">
            Consulta el estado de tus préstamos en tiempo real.
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-2">✅ Aprobación Rápida</h3>
          <p className="text-gray-600">
            Los administradores revisan y aprueban tus solicitudes.
          </p>
        </div>
      </div>
    </div>
  );
}
