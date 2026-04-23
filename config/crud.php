<!-- Página para o CRUD de livros, para criar, editar, e excluir livros e categorias -->


<?php

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
}

function listarUsuarios($mysqli) {
    return $mysqli->query("SELECT id_usuario, nome FROM usuarios ORDER BY nome ASC")->fetch_all(MYSQLI_ASSOC);
}
?>