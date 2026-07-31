export function IniciarSesion() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Iniciar sesion</h1>
      <form className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Correo</span>
          <input className="mt-1 w-full border border-slate-300 px-3 py-2" type="email" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Contrasena</span>
          <input className="mt-1 w-full border border-slate-300 px-3 py-2" type="password" />
        </label>
        <button className="w-full bg-gradia-azul px-4 py-2 font-semibold text-white" type="button">
          Entrar
        </button>
      </form>
    </main>
  );
}
