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

    $stmt->execute();
    return $mysqli->insert_id;
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
    $stmt->bind_param("siiiisisisi",
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
    $data_hoje = date('Y-m-d');
    $mysqli->query("UPDATE emprestimos SET status_emprestimo = 'Devolvido', data_devolucao = '$data_hoje' WHERE id_emprestimo = $id_emprestimo");

    // 3. Devolve 1 unidade ao estoque
  $mysqli->query("UPDATE Livros SET quantidade = quantidade + 1, status = 'Disponível' WHERE id_livro = $id_livro");


  
}

function listarUsuarios($mysqli) {
    return $mysqli->query("SELECT id_usuario, nome FROM usuarios ORDER BY nome ASC")->fetch_all(MYSQLI_ASSOC);
}

// --- FUNÇÕES DE RESERVA ---

function criarReserva($mysqli, $id_livro, $id_usuario) {
    $livro = buscarLivroPorId($mysqli, $id_livro);
    if (!$livro || $livro['quantidade'] > 0) {
        return false;
    }

    if (jaReservado($mysqli, $id_livro, $id_usuario)) {
        return false;
    }

    $stmt = $mysqli->prepare(
        "INSERT INTO reservas (id_livro, id_usuario, data_reserva, reserva_status) 
         VALUES (?, ?, NOW(), 'Aguardando')"
    );
    
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("ii", $id_livro, $id_usuario);
    return $stmt->execute();
}

function jaReservado($mysqli, $id_livro, $id_usuario) {
    $stmt = $mysqli->prepare(
        "SELECT id_reserva FROM reservas 
         WHERE id_livro = ? AND id_usuario = ? AND reserva_status = 'Aguardando'"
    );
    
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("ii", $id_livro, $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result->num_rows > 0;
}

function listarReservasUsuario($mysqli, $id_usuario) {
    $sql = "SELECT R.id_reserva, R.id_livro, R.data_reserva, R.reserva_status, 
            L.titulo, L.status AS status_livro, A.nome AS autor, C.nome AS categoria
            FROM reservas R
            JOIN Livros L ON R.id_livro = L.id_livro
            LEFT JOIN autores A ON L.id_autor = A.id_autor
            LEFT JOIN Categorias C ON L.id_categoria = C.id_categoria
            WHERE R.id_usuario = ? AND R.reserva_status = 'Aguardando'
            ORDER BY R.data_reserva DESC";
    
    $stmt = $mysqli->prepare($sql);
    
    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC) ?? [];
}


function listarTodasReservas($mysqli) {
    $sql = "SELECT R.id_reserva, R.id_livro, R.id_usuario, R.data_reserva, R.reserva_status,
            L.titulo, U.nome AS usuario, L.status AS status_livro
            FROM reservas R
            JOIN Livros L ON R.id_livro = L.id_livro
            JOIN usuarios U ON R.id_usuario = U.id_usuario
            WHERE R.reserva_status = 'Aguardando'
            ORDER BY R.data_reserva DESC";
    
    return $mysqli->query($sql)->fetch_all(MYSQLI_ASSOC) ?? [];
}

function listarReservasPorLivro($mysqli, $id_livro) {
    $sql = "SELECT R.id_reserva, R.id_livro, R.id_usuario, R.data_reserva, R.reserva_status,
            L.titulo, U.nome AS usuario, U.id_usuario
            FROM reservas R
            JOIN Livros L ON R.id_livro = L.id_livro
            JOIN usuarios U ON R.id_usuario = U.id_usuario
            WHERE R.id_livro = ? AND R.reserva_status = 'Aguardando'
            ORDER BY R.data_reserva ASC";
    
    $stmt = $mysqli->prepare($sql);
    
    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("i", $id_livro);
    $stmt->execute();
    
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC) ?? [];
}

function listarEmprestimosPorLivro($mysqli, $id_livro) {
    $sql = "SELECT E.id_emprestimo, E.id_livro, E.id_usuario, E.data_emprestimo, 
            E.data_devolucao, E.status_emprestimo, L.titulo, U.nome AS usuario, U.id_usuario
            FROM emprestimos E
            JOIN Livros L ON E.id_livro = L.id_livro
            JOIN usuarios U ON E.id_usuario = U.id_usuario
            WHERE E.id_livro = ? AND E.status_emprestimo IN ('Pendente', 'Atrasado')
            ORDER BY E.data_emprestimo ASC";
    
    $stmt = $mysqli->prepare($sql);
    
    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("i", $id_livro);
    $stmt->execute();
    
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC) ?? [];
}
?>
