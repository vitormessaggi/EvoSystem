# 🔧 GESTÃO DE EQUIPAMENTOS PARA MANUNTENÇÃO V1.0 - EVOSTSTEM

## 📝 Visão Geral do Projeto

Este é um sistema Full-Stack moderno desenvolvido para otimizar o fluxo de trabalho de um estabelecimento de manutenção. Ele permite o registro de entrada de equipamentos, acompanhamento de status, alocação de técnicos (OM), controle de Notas Fiscais e gestão de usuários.

---

## ✨ Principais Funcionalidades

| Ícone | Funcionalidade | Descrição |
| :---: | :--- | :--- |
| ➕ | **Registro Rápido de OS** | Cadastro de itens em manutenção com campos para **Nota Fiscal de Entrada (NF)** e **OM (Ordem de Manutenção)**. |
| 🔍 | **Acompanhamento em Tempo Real** | Visualização do status (`Em Aberto`, `Em Manutenção`, `Concluído`) via cards e tabela. |
| 🧑‍💻 | **Atribuição de Técnico** | O técnico logado pode **"Assumir Serviço"**, mudando o status da OS e registrando seu nome. |
| 🧾 | **Gestão de Saída** | Finalização da OS com registro obrigatório da **Nota Fiscal de Saída (NFS)**. |
| ⚙️ | **Área Admin** | Gestão de usuários (Cadastro e Visualização de Credenciais) e permissão para **Excluir OS**. |

---

## 💻 Tecnologias de Desenvolvimento

Este projeto utiliza uma arquitetura RESTful com separação clara de responsabilidades:

| Camada | Tecnologia | Pacotes Chave |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | JavaScript, CSS Module-Style |
| **Backend (API)** | Python (Flask) | Flask-CORS, Flask-SQLAlchemy |
| **Banco de Dados**| SQLite | Persistência de dados leve e eficiente. |

---

## 🚀 Como Executar o Sistema (Passos Rápidos)

### 1. 🐍 Backend (API REST)

Na pasta `/backend-api/`:

```bash
# Instalar dependências (Se necessário)
pip install Flask Flask-CORS Flask-SQLAlchemy

# ⚠️ O comando abaixo cria ou atualiza o banco de dados (manutencao.db)
python app.py
