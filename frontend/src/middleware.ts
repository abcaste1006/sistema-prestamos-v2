import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas públicas (no requieren autenticación)
const publicRoutes = ["/", "/login", "/register", "/verify", "/catalogo"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Verificar si el token es válido (no expirado)
  let tokenValid = true;
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          tokenValid = false;
        }
      }
    } catch {
      tokenValid = false;
    }
  }

  // Si el token no es válido, limpiar y redirigir a login
  if (!tokenValid) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  // Si está autenticado y va a ruta pública, redirigir a dashboard
  if (
    token &&
    tokenValid &&
    (pathname === "/" || pathname === "/login" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si NO está autenticado y va a ruta protegida (dashboard o admin)
  if (
    !token &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|api/auth/login).*)"],
};
