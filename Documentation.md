Tabelas/Classes

Pessoa

    pes_id - unico, autoincremento, chave primaria, int;
    pes_nome - varchar notnull (255);
    pes_nascimento - date;
    pes_telefone - varchar (20);
    pes_email - varchar (255) notnull unique;
    pes_endereco - varchar (255);
    pes_cidade - varchar (100);
    pes_estado - varchar (20);
    pes_nacionalidade - varchar (100)not null;
    pes_data_inscricao - timestamp notnull;
    pes_cargo_interesse - varchar (100) notnull;
    pes_resumo_profissional - varchar (MAX);


Habilidade

    hab_id - unico, autoincremento, chave primaria, int;
    hab_pes_id - int, foreign key (pes_id);
    hab_nome - varchar (255);

Experiencias_profissionais

    exp_id - unico, autoincremento, chave primaria, int;
    exp_pes_id - int, foreign key (pes_id);
    exp_cargo - varchar (255);
    exp_descricao - varchar (MAX);
    exp_data_inicio - date;
    exp_data_fim - date;

Graduacao

    gra_id - unico, autoincremento, chave primaria, int;
    gra_pes_id - int, foreign key (pes_id);
    gra_nome - varchar (255);
    gra_data_inicio - date;
    gra_data_fim - date;
    gra_instituicao - varchar (255);

