'use client';
import { useState, useEffect } from 'react';
import IntroCinematica from '../components/IntroCinematica';

export default function BibliotecaAndromeda() {
  const [acervo, setAcervo] = useState([]);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__ASTRAL_DATA__) {
      setAcervo(window.__ASTRAL_DATA__);
    }
  }, []);

  return (
    <main className="min-vh-100" style={{ backgroundColor: '#0B0D0F' }}>
      
      {!mostrarBiblioteca && (
        <IntroCinematica onPortalOpen={() => setMostrarBiblioteca(true)} />
      )}

      {mostrarBiblioteca && (
        <div className="container py-5">
          <header className="mb-5 border-bottom border-gold pb-4">
            <h1 className="text-gold font-serif text-uppercase display-4">
              Acervo Andromeda
            </h1>
            <p className="text-muted font-sans text-uppercase small tracking-widest mt-2">
              Tratados Científicos e Conhecimento Astral
            </p>
          </header>

          {acervo.length === 0 ? (
            <div className="alert alert-dark border-gold text-white bg-glass" role="alert">
              O acervo encontra-se vazio de momento. Adicione livros à base de dados.
            </div>
          ) : (
            <div className="row g-4">
              {acervo.map((livro, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border-gold bg-glass text-white transition">
                    <div className="card-body d-flex flex-column">
                      
                      <span className="text-gold text-uppercase font-sans" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                        {livro.genero || 'Desconhecido'}
                      </span>
                      
                      <h3 className="card-title font-serif mt-3 mb-4">
                        {livro.titulo}
                      </h3>
                      
                      <div className="mt-auto d-flex justify-content-between text-muted small">
                        <span>Por {livro.autor_nome || 'Autor Desconhecido'}</span>
                        <span>{livro.ano_publicacao}</span>
                      </div>
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}