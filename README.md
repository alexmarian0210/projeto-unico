# FinControl CLI

## Descrição
O FinControl CLI é um sistema de controle financeiro pessoal em linha de comando (CLI), desenvolvido em Node.js. Ele permite registrar transações diárias (receitas e despesas), gerenciar gastos fixos mensais, definir metas por categoria de gastos e gerar resumos financeiros com comparações automáticas entre gastos reais e metas, ajudando a organizar as finanças de forma simples e offline.

## Funcionalidades
- [x] Adicionar transações financeiras (receitas ou despesas) com categoria, descrição, valor, data e forma de pagamento.
- [x] Visualizar transações e gastos do mês atual.
- [x] Definir metas mensais para categorias de gastos (selecione a categoria e digite apenas o valor).
- [x] Visualizar gastos detalhados por categoria e data.
- [x] Gerenciar gastos fixos: adicionar novos, visualizar lista (com status pago/pendente) e marcar como pagos individualmente.
- [x] Gerar resumo financeiro mensal: total de receitas, despesas, saldo e comparação de gastos vs. metas (com alertas para excedentes).
- [x] Persistência automática em arquivos JSON para durar entre sessões.

## Como Executar
1. Clone o repositório
2. Execute `npm install`
3. Execute `node script.js`

## Tecnologias Utilizadas
- Node.js
- @inquirer/prompts
- File System (fs)

## Estrutura de Dados
Os dados são armazenados em arquivos JSON simples para persistência local:

- **transacoes.json**: Array de objetos com transações (tipo, valor, categoria, descrição, data, formaPagamento, recorrente).
- **gastosFixos.json**: Array de objetos com gastos recorrentes (descricao, valor, categoria, pago, dataCriacao, dataPagamento).
- **metas.json**: Objeto com metas por categoria (ex.: {"alimentacao": 300}).

Esses arquivos são criados automaticamente e filtrados por mês nos relatórios.



## Autor
Alex Marian  
GitHub: [github.com/alexmarian](https://github.com/alexmarian0210/projeto-unico.git)  
Email: alex_marian@estudante.sesisenai.org.br

## Aprendizados
Desenvolvendo este projeto, aprendi sobre async/await com fs.promises para operações de I/O assíncronas, criação de interfaces interativas com prompts, tratamento robusto de erros em loops async, validação de dados e modularidade de código para facilitar expansões futuras, como integração com gráficos ou bancos de dados.