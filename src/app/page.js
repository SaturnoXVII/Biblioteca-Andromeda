'use client';
import { useState, useEffect } from 'react';
import IntroCinematica from '../components/IntroCinematica';

export default function Home() {
  const [acervo, setAcervo] = useState([]);
  const [introFinalizada, setIntroFinalizada] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__ASTRAL_DATA__) {
      setAcervo(window.__ASTRAL_DATA__);
    }
  }, []);

  return (
    <main className="min-h-screen bg-obsidian text-white">
      {/* A Abertura roda no topo de tudo até terminar */}
      {!introFinalizada && (
        <IntroCinematica onPortalOpen={() => setIntroFinalizada(true)} />
      )}

      {/* O Acervo só aparece quando o portal se abre e a intro some */}
      {introFinalizada && (
        <div className="container mx-auto px-6 py-20 animate-fade-in">
           {/* Seu grid de livros de luxo aqui */}
        </div>
      )}
    </main>
  );
}