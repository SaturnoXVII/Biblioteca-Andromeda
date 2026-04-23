<?php

declare(strict_types=1);

namespace App\Repository;

use mysqli;
use Exception;

/**
 * Repositório de Livros - Biblioteca Andromeda
 * Versão otimizada para PHP 8.0+ e MySQLi
 */
class LivroRepository 
{ 
   
private mysqli $db; // 1. Declara explicitamente

    public function __construct(mysqli $conexao) {
        $this->db = $conexao; // 2. Atribui manualmente
    }
    /**
     * Busca o catálogo completo com nomes de autores e categorias.
     * @return array
     * @throws Exception
     */
    public function listarTodos(): array 
    {
      $sql = "SELECT 
            l.id_livro, 
            l.titulo, 
            a.nome AS autor_nome, 
            l.ano_publicacao, 
            c.nome AS categoria_nome,
            e.nome AS editora_nome,
            l.sinopse,       -- ← linha nova
            l.status,
            l.capa          -- ← linha nova
        FROM Livros l
        LEFT JOIN autores a ON l.id_autor = a.id_autor
        LEFT JOIN Categorias c ON l.id_categoria = c.id_categoria
        LEFT JOIN editoras e ON l.id_editora = e.id_editora
        ORDER BY l.titulo ASC";

        // Executa a query de forma direta (mais rápida para SELECTs sem inputs de usuário)
        $result = $this->db->query($sql);

        if (!$result) {
            throw new Exception("Falha na consulta Andromeda: " . $this->db->error);
        }

        // Transforma o resultado em um array associativo de uma vez só
        $livros = $result->fetch_all(MYSQLI_ASSOC);
        
        // Libera os recursos do MySQL imediatamente
        $result->free();

        return $livros ?: [];
    }

    
}