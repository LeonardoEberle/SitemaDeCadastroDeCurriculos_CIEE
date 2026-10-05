Desafio técnico — Cadastro de currículos

Queremos conhecer sua forma de resolver problemas, organizar o código e utilizar as ferramentas disponíveis.

O uso de inteligência artificial é permitido, desde que você documente como ela participou do desenvolvimento e consiga explicar a solução entregue.

Imagine que nossa equipe de recrutamento precisa cadastrar e consultar candidatos. Sua aplicação deve oferecer duas formas de cadastro:

    Cadastro manual: a pessoa preenche o formulário e salva os dados, sem precisar enviar um documento.
    Cadastro com PDF: a pessoa envia um currículo, e a aplicação extrai o texto e tenta identificar nome, e-mail e telefone. As informações encontradas preenchem o formulário e podem ser corrigidas ou complementadas antes de salvar.

Nos dois caminhos, utilize o mesmo formulário e as mesmas regras de validação. Depois de salvar, o candidato deve aparecer em uma listagem, com acesso a uma tela de detalhes.

O PDF é opcional. A ausência do arquivo ou uma falha na leitura não pode impedir o cadastro manual.

Dados do cadastro

    Nome completo — obrigatório.
    E-mail — obrigatório.
    Telefone.
    Área ou cargo de interesse.
    Resumo profissional.

Tecnologias obrigatórias

    Frontend: Angular ou React.
    Backend: ASP.NET Core (.NET) ou Node.js.
    Banco de dados: SQL Server.

Escolha uma das opções de frontend e uma de backend. As demais bibliotecas ficam a seu critério. Informe no README as tecnologias e versões utilizadas.

Requisitos da aplicação

    Interface simples e funcional, integrada ao backend.
    Leitura do PDF realizada pelo backend.
    Cadastro e consulta dos dados por meio do backend, com persistência no SQL Server.
    Scripts ou migrations para criar a estrutura do banco.
    Validação dos campos obrigatórios e do formato do e-mail.
    Validação do arquivo enviado, aceitando PDF de até 5 MB.
    Mensagens claras para situações como arquivo inválido, falha na leitura e cadastro salvo.

    ---

## Tecnologias e versões utilizadas

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + Vite | React 19, Vite 8 |
| Backend | ASP.NET Core Web API | .NET 10 (SDK 10.0.x) |
| Banco de dados | SQL Server Express | 2022 (Docker `mcr.microsoft.com/mssql/server:2022-latest`) |
| ORM | Entity Framework Core | 10.0 |
| Web Server (produção) | Nginx (alpine) | ~1.27 (container do frontend) |
| Containerização | Docker + Docker Compose | v2 |

---

## 1. Comandos SQL para criar o banco de dados

> **Observação**: Em ambiente Docker a aplicação já cria o banco automaticamente via `EnsureCreatedAsync` no startup. Use os comandos abaixo se quiser criar **manualmente** ou conectar em um SQL Server existente (ex: DBeaver, SSMS, `sqlcmd` local).

### 1.1. Criar o banco (conectado como `sa` ou admin, no banco `master`)

```sql
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'DesafioCIEE_Curriculos')
BEGIN
    CREATE DATABASE [DesafioCIEE_Curriculos]
     COLLATE Latin1_General_CI_AS;
END
GO
```

> Caso queira confirmar:
> ```sql
> SELECT name, state_desc FROM sys.databases WHERE name = 'DesafioCIEE_Curriculos';
> ```

### 1.2. Conexão / use o banco antes de criar as tabelas

```sql
USE [DesafioCIEE_Curriculos];
GO
```

### 1.3. Criar as 4 tabelas (Pessoa → Habilidade / Experiencias_profissionais / Graduacao com FK cascade)

```sql
USE [DesafioCIEE_Curriculos];
GO

/* ****************************************
   Tabela: Pessoa
**************************************** */
IF OBJECT_ID(N'dbo.Pessoa', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Pessoa (
        pes_id                INT IDENTITY(1,1) NOT NULL,
        pes_nome              VARCHAR(255)      NOT NULL,
        pes_nascimento        DATE              NULL,
        pes_telefone          VARCHAR(20)       NULL,
        pes_email             VARCHAR(255)      NOT NULL,
        pes_endereco          VARCHAR(255)      NULL,
        pes_cidade            VARCHAR(100)      NULL,
        pes_estado            VARCHAR(20)       NULL,
        pes_nacionalidade     VARCHAR(100)      NOT NULL,
        pes_data_inscricao    DATETIME2         NOT NULL DEFAULT (GETDATE()),
        pes_cargo_interesse   VARCHAR(100)      NOT NULL,
        pes_resumo_profissional  VARCHAR(MAX)   NULL,

        CONSTRAINT PK_Pessoa
            PRIMARY KEY CLUSTERED (pes_id ASC),

        CONSTRAINT AK_Pessoa_email
            UNIQUE NONCLUSTERED (pes_email)
    );
END
GO

/* ****************************************
   Tabela: Habilidade
**************************************** */
IF OBJECT_ID(N'dbo.Habilidade', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Habilidade (
        hab_id     INT IDENTITY(1,1) NOT NULL,
        hab_pes_id INT               NOT NULL,
        hab_nome   VARCHAR(255)      NULL,

        CONSTRAINT PK_Habilidade
            PRIMARY KEY CLUSTERED (hab_id ASC),

        CONSTRAINT FK_Habilidade_Pessoa
            FOREIGN KEY (hab_pes_id) REFERENCES dbo.Pessoa (pes_id)
                ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_Habilidade_hab_pes_id
        ON dbo.Habilidade (hab_pes_id);
END
GO

/* ****************************************
   Tabela: Experiencias_profissionais
**************************************** */
IF OBJECT_ID(N'dbo.Experiencias_profissionais', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Experiencias_profissionais (
        exp_id         INT IDENTITY(1,1) NOT NULL,
        exp_pes_id     INT               NOT NULL,
        exp_cargo      VARCHAR(255)      NULL,
        exp_descricao  VARCHAR(MAX)      NULL,
        exp_data_inicio DATE             NULL,
        exp_data_fim    DATE             NULL,

        CONSTRAINT PK_Experiencias_profissionais
            PRIMARY KEY CLUSTERED (exp_id ASC),

        CONSTRAINT FK_Experiencias_profissionais_Pessoa
            FOREIGN KEY (exp_pes_id) REFERENCES dbo.Pessoa (pes_id)
                ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_Experiencias_profissionais_exp_pes_id
        ON dbo.Experiencias_profissionais (exp_pes_id);
END
GO

/* ****************************************
   Tabela: Graduacao
**************************************** */
IF OBJECT_ID(N'dbo.Graduacao', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Graduacao (
        gra_id           INT IDENTITY(1,1) NOT NULL,
        gra_pes_id       INT               NOT NULL,
        gra_nome         VARCHAR(255)      NULL,
        gra_data_inicio  DATE              NULL,
        gra_data_fim     DATE              NULL,
        gra_instituicao  VARCHAR(255)      NULL,

        CONSTRAINT PK_Graduacao
            PRIMARY KEY CLUSTERED (gra_id ASC),

        CONSTRAINT FK_Graduacao_Pessoa
            FOREIGN KEY (gra_pes_id) REFERENCES dbo.Pessoa (pes_id)
                ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_Graduacao_gra_pes_id
        ON dbo.Graduacao (gra_pes_id);
END
GO
```
---

## 2. String de conexão (mesmo do Docker / appsettings)

```
Server=localhost,1433;
Database=DesafioCIEE_Curriculos;
User Id=sa;
Password=Desafio@CIEE;
TrustServerCertificate=True;
Encrypt=False;
MultipleActiveResultSets=True;
```
