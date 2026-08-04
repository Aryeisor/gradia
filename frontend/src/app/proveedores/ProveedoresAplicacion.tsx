import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ProveedorAutenticacion } from '../../modulos/autenticacion/contexto/AutenticacionContexto';

type Props = {
  children: ReactNode;
};

export function ProveedoresAplicacion({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProveedorAutenticacion>{children}</ProveedorAutenticacion>
    </QueryClientProvider>
  );
}
