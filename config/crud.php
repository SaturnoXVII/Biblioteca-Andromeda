<?php
require_once __DIR__ . '/../includes/notificacoes.php';

function garantirTabelaReservas($mysqli) {
    $sql = "CREATE TABLE IF NOT EXISTS reservas (
        id_reserva INT AUTO_INCREMENT PRIMARY KEY,
        id_livro INT NOT NULL,
        id_usuario INT NOT NULL,
        reserva_status ENUM('Aguardando', 'Notificado', 'Cancelado') DEFAULT 'Aguardando',
        data_reserva TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        KEY id_livro (id_livro),
        KEY id_usuario (id_usuario),
        UNIQUE KEY unique_reserva_ativa (id_livro, id_usuario, reserva_status),
        CONSTRAINT reservas_ibfk_1 FOREIGN KEY (id_livro) REFERENCES Livros(id_livro) ON DELETE CASCADE,
        CONSTRAINT reservas_ibfk_2 FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci";
    
    $ok = $mysqli->query($sql);

    
    $coluna = $mysqli->query("SHOW COLUMNS FROM reservas LIKE 'reserva_status'");
    if ($coluna && $coluna->num_rows === 0) {
        $mysqli->query("ALTER TABLE reservas ADD reserva_status ENUM('Aguardando', 'Notificado', 'Cancelado') DEFAULT 'Aguardando' AFTER id_usuario");
    }

    return $ok;
}


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
                Livros.sinopse,
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

function adicionarCategoria($mysqli, $nome) {
    $stmt = $mysqli->prepare(
        "INSERT INTO Categorias (nome)
         VALUES (?)
         ON DUPLICATE KEY UPDATE
            id_categoria = LAST_INSERT_ID(id_categoria)"
    );

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("s", $nome);
    $stmt->execute();
    return $mysqli->insert_id;
}


function adicionarLivro($mysqli, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa, $sinopse = '') {
    $stmt = $mysqli->prepare(
        "INSERT INTO Livros 
            (titulo, id_autor, ano_publicacao, id_categoria, id_editora, numero_paginas, origem_idioma, status, quantidade, capa, sinopse) 
         VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param(
        "siiiiississ",
        $titulo,
        $id_autor,
        $ano_publicacao,
        $id_categoria,
        $id_editora,
        $numero_paginas,
        $origem_idioma,
        $status,
        $quantidade,
        $capa,
        $sinopse
    );

    $stmt->execute();
    return $mysqli->insert_id;
}

function editarLivro($mysqli, $id_livro, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa, $sinopse = '') {
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
            capa           = ?,
            sinopse        = ?
         WHERE id_livro = ?"
    );

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param(
        "siiiiississi",
        $titulo,
        $id_autor,
        $ano_publicacao,
        $id_categoria,
        $id_editora,
        $numero_paginas,
        $origem_idioma,
        $status,
        $quantidade,
        $capa,
        $sinopse,
        $id_livro
    );

    return $stmt->execute();
}

function excluirLivro($mysqli, $id) {
    $stmt = $mysqli->prepare("DELETE FROM Livros WHERE id_livro = ?");
    $stmt->bind_param("i", $id);
    return $stmt->execute();
}

function excluirAutor($mysqli, $id_autor) {
    $stmt = $mysqli->prepare("DELETE FROM autores WHERE id_autor = ?");

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("i", $id_autor);
    $ok = $stmt->execute();
    return $ok && $stmt->affected_rows > 0;
}

function excluirEditora($mysqli, $id_editora) {
    $stmt = $mysqli->prepare("DELETE FROM editoras WHERE id_editora = ?");

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("i", $id_editora);
    $ok = $stmt->execute();
    return $ok && $stmt->affected_rows > 0;
}

function excluirCategoria($mysqli, $id_categoria) {
    $stmt = $mysqli->prepare("DELETE FROM Categorias WHERE id_categoria = ?");

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("i", $id_categoria);
    $ok = $stmt->execute();
    return $ok && $stmt->affected_rows > 0;
}

function adicionarEditora($mysqli, $nome, $descricao) {
    $stmt = $mysqli->prepare(
        "INSERT INTO editoras (nome, descricao)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE
            descricao = COALESCE(NULLIF(VALUES(descricao), ''), descricao),
            id_editora = LAST_INSERT_ID(id_editora)"
    );

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("ss", $nome, $descricao);
    $stmt->execute();
    return $mysqli->insert_id;
}

function adicionarAutor($mysqli, $nome, $descricao, $nacionalidade) {
    $stmt = $mysqli->prepare(
        "INSERT INTO autores (nome, descricao, nacionalidade)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
            descricao = COALESCE(NULLIF(VALUES(descricao), ''), descricao),
            nacionalidade = COALESCE(NULLIF(VALUES(nacionalidade), ''), nacionalidade),
            id_autor = LAST_INSERT_ID(id_autor)"
    );

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("sss", $nome, $descricao, $nacionalidade);
    $stmt->execute();
    return $mysqli->insert_id;
}


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
    
    $res = $mysqli->query("SELECT id_livro FROM emprestimos WHERE id_emprestimo = $id_emprestimo");
    $emp = $res->fetch_assoc();
    $id_livro = $emp['id_livro'];

    
    $data_hoje = date('Y-m-d');
    $mysqli->query("UPDATE emprestimos SET status_emprestimo = 'Devolvido', data_devolucao = '$data_hoje' WHERE id_emprestimo = $id_emprestimo");

    
  $mysqli->query("UPDATE Livros SET quantidade = quantidade + 1, status = 'Disponível' WHERE id_livro = $id_livro");


    $stmt = $mysqli->prepare("
        SELECT r.id_reserva,
               u.email,
               u.nome,
               l.titulo
        FROM reservas r
        JOIN usuarios u ON u.id_usuario = r.id_usuario
        JOIN Livros   l ON l.id_livro   = r.id_livro
        WHERE r.id_livro       = ?
          AND r.reserva_status = 'Aguardando'
        ORDER BY r.data_reserva ASC
        LIMIT 1
    ");
    $stmt->bind_param('i', $id_livro);
    $stmt->execute();
    $reserva = $stmt->get_result()->fetch_assoc();

    if ($reserva) {
        
        $emailEnviado = notificarLivroDisponivel(
            $reserva['email'],
            $reserva['nome'],
            $reserva['titulo']
        );

        
        $novoStatus = $emailEnviado ? 'Notificado' : 'Aguardando';
        $upd = $mysqli->prepare("
            UPDATE reservas SET reserva_status = ? WHERE id_reserva = ?
        ");
        $upd->bind_param('si', $novoStatus, $reserva['id_reserva']);
        $upd->execute();
    }


}

function listarUsuarios($mysqli) {
    return $mysqli->query("SELECT id_usuario, nome FROM usuarios ORDER BY nome ASC")->fetch_all(MYSQLI_ASSOC);
}


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
