import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaginaNoEncontrada } from './PaginaNoEncontrada';

describe('PaginaNoEncontrada', () => {
  it('muestra el mensaje de ruta inexistente', () => {
    render(<PaginaNoEncontrada />);
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });
});
