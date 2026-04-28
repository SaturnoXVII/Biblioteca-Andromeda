<!-- Página para o CRUD de livros, para criar, editar, e excluir livros e categorias -->


<?php

// Função para garantir que a tabela de reservas existe
function garantirTabelaReservas($mysqli) {
    $sql = "CREATE TABLE IF NOT EXISTS reservas (
        id_reserva INT AUTO_INCREMENT PRIMARY KEY,
        id_livro INT NOT NULL,
        id_usuario INT NOT NULL,
        data_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Ativa',
        FOREIGN KEY (id_livro) REFERENCES Livros(id_livro) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        INDEX idx_usuario (id_usuario),
        INDEX idx_livro (id_livro),
        UNIQUE KEY unique_reserva (id_livro, id_usuario, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    return $mysqli->query($sql);
}

// Garantir que a tabela existe ao incluir este arquivo
if (isset($mysqli)) {
    garantirTabelaReservas($mysqli);
}

function listarLivros($mysqli) {
    $sql = "SELECT 
                Livros.id_livro,
                Livros.titulo,
                Livros.ano_publicacao,
                Livros.numero_paginas,
                Livros.origem_idioma,
                Livros.status,
                Livros.quantidade,
                Livros.capa,
                autores.nome       AS autor,
                Categorias.nome    AS categoria,
                editoras.nome      AS editora
            FROM Livros
            LEFT JOIN autores     ON Livros.id_autor     = autores.id_autor
            LEFT JOIN Categorias  ON Livros.id_categoria = Categorias.id_categoria
            LEFT JOIN editoras    ON Livros.id_editora   = editoras.id_editora
            ORDER BY Livros.titulo ASC";

    return $mysqli->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function buscarLivroPorId($mysqli, $id) {
    $stmt = $mysqli->prepare("SELECT * FROM Livros WHERE id_livro = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function listarCategorias($mysqli) {
    return $mysqli->query("SELECT id_categoria, nome FROM Categorias ORDER BY nome ASC")->fetch_all(MYSQLI_ASSOC);
}

function listarAutores($mysqli) {
    return $mysqli->query("SELECT id_autor, nome FROM autores ORDER BY nome ASC")->fetch_all(MYSQLI_ASSOC);
}

function listarEditoras($mysqli) {
    return $mysqli->query("SELECT id_editora, nome FROM editoras ORDER BY nome ASC")->fetch_all(MYSQLI_ASSOC);
}


function adicionarLivro($mysqli, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa) {
    $stmt = $mysqli->prepare(
        "INSERT INTO Livros 
            (titulo, id_autor, ano_publicacao, id_categoria, id_editora, numero_paginas, origem_idioma, status, quantidade, capa) 
         VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
   $stmt->bind_param("siiiiissis",
    $titulo, $id_autor, $ano_publicacao, $id_categoria,
    $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa
);
}

function editarLivro($mysqli, $id_livro, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa) {
    $stmt = $mysqli->prepare(
        "UPDATE Livros SET
            titulo         = ?,
            id_autor       = ?,
            ano_publicacao = ?,
            id_categoria   = ?,
            id_editora     = ?,
            numero_paginas = ?,
            origem_idioma  = ?,
            status         = ?,
            quantidade     = ?,
            capa           = ?
         WHERE id_livro = ?"
    );
    $stmt->bind_param("siiiisssisi",
        $titulo, $id_autor, $ano_publicacao, $id_categoria,
        $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa,
        $id_livro
    );
    return $stmt->execute();
}

function excluirLivro($mysqli, $id) {
    $stmt = $mysqli->prepare("DELETE FROM Livros WHERE id_livro = ?");
    $stmt->bind_param("i", $id);
    return $stmt->execute();
}

function adicionarEditora($mysqli, $nome, $descricao) {
    $stmt = $mysqli->prepare("INSERT INTO editoras (nome, descricao) VALUES (?, ?)");
    $stmt->bind_param("ss", $nome, $descricao);
    $stmt->execute();
    return $mysqli->insert_id;
}

function adicionarAutor($mysqli, $nome, $descricao, $nacionalidade) {
    $stmt = $mysqli->prepare("INSERT INTO autores (nome, descricao, nacionalidade) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $nome, $descricao, $nacionalidade);
    $stmt->execute();
    return $mysqli->insert_id;
}



// --- FUNÇÕES DE EMPRÉSTIMO ---

function listarEmprestimos($mysqli) {
    $sql = "SELECT E.*, L.titulo, U.nome as usuario 
            FROM emprestimos E
            JOIN Livros L ON E.id_livro = L.id_livro
            JOIN usuarios U ON E.id_usuario = U.id_usuario
            ORDER BY E.data_emprestimo DESC";

    $rows = $mysqli->query($sql)->fetch_all(MYSQLI_ASSOC);
    $hoje = strtotime(date('Y-m-d'));
    foreach ($rows as &$row) {
        if ($row['status_emprestimo'] === 'Pendente' && !empty($row['data_devolucao'])) {
            $due = strtotime($row['data_devolucao']);
            if ($due !== false && $due < $hoje) {
                $row['status_emprestimo'] = 'Atrasado';
            }
        }
    }

    return $rows;
}

function registrarEmprestimo($mysqli, $id_livro, $id_usuario, $data_devolucao_prevista) {
    $livro = buscarLivroPorId($mysqli, $id_livro);
    if ($livro['quantidade'] <= 0) return false;

    $stmt = $mysqli->prepare(
        "INSERT INTO emprestimos (id_livro, id_usuario, data_emprestimo, data_devolucao, status_emprestimo) 
         VALUES (?, ?, NOW(), ?, 'Pendente')"
    );

    $stmt->bind_param("iis", $id_livro, $id_usuario, $data_devolucao_prevista);

 if ($stmt->execute()) {

    $nova_qtd = $livro['quantidade'] - 1;
    $status = $nova_qtd == 0 ? 'Indisponível' : 'Disponível';
    $mysqli->query("UPDATE Livros SET quantidade = $nova_qtd, status = '$status' WHERE id_livro = $id_livro");
    return true;
}

    return false;
}

function devolverLivro($mysqli, $id_emprestimo) {
    // 1. Busca info do empréstimo
    $res = $mysqli->query("SELECT id_livro FROM emprestimos WHERE id_emprestimo = $id_emprestimo");
    $emp = $res->fetch_assoc();
    $id_livro = $emp['id_livro'];

    // 2. Atualiza status e data de devolução real
    $data_hoje = date('y-m-d');
    $mysqli->query("UPDATE emprestimos SET status_emprestimo = 'Devolvido', data_devolucao = '$data_hoje' WHERE id_emprestimo = $id_emprestimo");

    // 3. Devolve 1 unidade ao estoque
  $mysqli->query("UPDATE Livros SET quantidade = quantidade + 1, status = 'Disponível' WHERE id_livro = $id_livro");

  $stmt = $mysqli -> prepare 
  (
    'SELECT r.id_reserva, u.nome, u.email 
        FROM reservas r 
        JOIN usuarios u ON r.id_usuario = u.id_usuario 
        WHERE r.id_livro = ? AND r.status = "Aguardando" 
        ORDER BY r.data_reserva ASC LIMIT 1'
  );

  $stmt->bind_param("i", $id_livro);
    $stmt->execute();
    $proximo = $stmt->get_result()->fetch_assoc();

   if ($proximo) {
     
     
        $id_reserva = $proximo['id_reserva'];
        $mysqli->query("UPDATE reservas SET reserva_status = 'Notificado' WHERE id_reserva = $id_reserva");
        
        // Se tiver sistema de e-mail configurado:
         mail($proximo['email'], "Livro Disponível", "Olá {$proximo['nome']}, o livro já está disponível!");
    }
}

function listarUsuarios($mysqli) {
    return $mysqli->query("SELECT id_usuario, nome FROM usuarios ORDER BY nome ASC")->fetch_all(MYSQLI_ASSOC);
}







function reservarLivro ($mysqli, $id_livro, $id_usuario) {
// Verifica se o usuário já tem alguma reserva para o livro
   $stmt = $mysqli->prepare("SELECT id_reserva FROM reservas WHERE id_livro = ? AND id_usuario = ? AND status = 'Aguardando'");
// definir o tipo dessas variaveis
 $stmt->bind_param("ii", $id_livro, $id_usuario);
 $stmt->execute();

 if ($stmt->get_result()->num_rows > 0) {
    return 'Você já tem uma reserva ativa para esse livro.';
 }
 else{
     $stmt = $mysqli->prepare( 'INSERT INTO reservas (id_livro, id_usuario) VALUES (?, ?)' );
     $stmt->bind_param("ii", $id_livro, $id_usuario);

     if ($stmt-> execute()) {
         return 'Reserva realizada com sucesso!';
     } else {
            return 'Erro ao realizar reserva.';
     }
 }
}