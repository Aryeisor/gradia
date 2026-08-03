let tokenAcceso: string | null = null;

export function obtenerTokenAcceso(): string | null {
  return tokenAcceso;
}

export function guardarTokenAcceso(token: string): void {
  tokenAcceso = token;
}

export function limpiarTokenAcceso(): void {
  tokenAcceso = null;
}
