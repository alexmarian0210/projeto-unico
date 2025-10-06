/*

const transacao = {
    id: 1,
    tipo: "despesa", // receita, despesa
    valor: 45.90,
    categoria: "alimentação",
    descricao: "Almoço no restaurante",
    data: "2024-01-20",
    formaPagamento: "cartão",
    recorrente: false
};

const meta = {
    categoria: "lazer",
    valorLimite: 300,
    valorGasto: 150,
    mes: "2024-01"
};
*/

// Importações necessárias para o sistema
const {input, select, checkbox } = require('@inquirer/prompts'); // Biblioteca para prompts interativos
const fs = require('fs'); // Biblioteca para manipulação de arquivos

/**
 * Função para salvar uma nova transação financeira
 * Coleta dados do usuário via prompts e salva no arquivo transacoes.json
 * Usa a data atual automaticamente no formato YYYY-MM-DD
 * @returns {Promise<string>} Data da transação
 */
async function salvarGastos() {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const data = `${year}-${month}-${day}`;
        const tipo = await select({ message: 'Tipo:', choices: [{value: 'receita', name: 'Receita'}, {value: 'despesa', name: 'Despesa'}] });
        const valor = parseFloat(await input({ message: 'Valor:' }));
        const categoria = await select({ 
            message: 'Categoria:', 
            choices: [{value: 'alimentação', name: 'Alimentação'}, {value: 'lazer', name: 'Lazer'}, {value: 'transporte', name: 'Transporte'}] 
        });
        const descricao = await input({ message: 'Descrição:' });
        const formaPagamento = await select({ message: 'Forma de Pagamento:', choices: [{value: 'dinheiro', name: 'Dinheiro'}, {value: 'cartão', name: 'Cartão'}, {value: 'pix', name: 'Pix'}] });
        const recorrenteChoices = await checkbox({ message: 'Recorrente?', choices: [{value: 'Sim', name: 'Sim', checked: false}, {value: 'Não', name: 'Não', checked: true}] });
        const recorrente = recorrenteChoices.includes('Sim');
        
        const transacao = { tipo, valor, categoria, descricao, data, formaPagamento, recorrente };
        
        // Ler transações existentes
        let transacoes = [];
        try {
            const transacoesData = await fs.promises.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(transacoesData);
        } catch (error) {
            // Arquivo não existe, usar array vazio
        }
        
        // Adicionar nova transação
        transacoes.push(transacao);
        
        // Salvar transações
        await fs.promises.writeFile('transacoes.json', JSON.stringify(transacoes, null, 2));
        console.log('Transação adicionada com sucesso!');
        
        return data;
    } catch (error) {
        console.error('Erro ao salvar gastos:', error);
    }
}

/**
 * Função para limpar o console/tela
 * Usa console.clear() para limpar a tela do terminal
 */
function limparTela() {
     console.clear(); // limpando o console
}

/**
 * Função para executar a opção selecionada no menu
 * Recebe a opção escolhida pelo usuário e chama a função correspondente
 * @param {string} opcao - Opção selecionada pelo usuário
 */
async function executarMenu(opcao) {
    switch (opcao) {
        case 'Adicionar Transação':
            await salvarGastos();
            break;
        case 'Ver Transações':
            await verTransacoes();
            break;
        case 'Definir Gastos':
            await definirGastos();
            break;
        case 'Ver Gastos':
            await verGastos();
            break;
        case 'Sair':
            console.log("Saindo do sistema Obrigado pela preferencia")
            break
        default :
            console.log("Opção inválida");
            break;
    }
}

/**
 * Função principal que inicia o sistema de controle financeiro
 * Exibe menu interativo e gerencia o loop principal do programa
 */
async function iniciar() {
    console.log("Bem-vindo ao sistema de controle financeiro pessoal!");

    let sair = false;

    while (!sair) {
        const opcao = await select({
            message: 'Escolha uma opção:',
            choices: [
                { value: 'Adicionar Transação', name: 'Adicionar Transação' },
            ]
        });

        await executarMenu(opcao);

        if (opcao === 'Sair') {
            limparTela();
            console.log("Até mais tarde 👋");
            sair = true;
        }
    }
}


async function verTransacoes() {
    console.log("=== Transações Salvas ===");
    try {
        const transacoesData = await fs.promises.readFile('transacoes.json', 'utf8');
        const transacoes = JSON.parse(transacoesData);
        
        if (transacoes.length === 0) {
            console.log("Nenhuma transação encontrada.");
            return;
        }

        transacoes.forEach((transacao, index) => {
            console.log(`\nTransação ${index + 1}:`);
            console.log(`  Tipo: ${transacao.tipo}`);
            console.log(`  Valor: R$ ${transacao.valor}`);
            console.log(`  Categoria: ${transacao.categoria}`);
            console.log(`  Descrição: ${transacao.descricao}`);
            console.log(`  Data: ${transacao.data}`);
            console.log(`  Forma de Pagamento: ${transacao.formaPagamento}`);
            console.log(`  Recorrente: ${transacao.recorrente ? 'Sim' : 'Não'}`);
        });
    } catch (error) {
        console.log("Nenhuma transação encontrada ou erro ao ler arquivo.");
    }
}

async function definirGastos() {
    console.log("=== Definir Limites de Gastos ===");
    try {
        const categoria = await select({
            message: 'Categoria:',
            choices: [
                {value: 'alimentação', name: 'Alimentação'},
                {value: 'lazer', name: 'Lazer'},
                {value: 'transporte', name: 'Transporte'}
            ]
        });
        const valorLimite = parseFloat(await input({ message: 'Valor Limite Mensal:' }));
        
        let gastos = [];
        try {
            const gastosData = await fs.promises.readFile('gastos.json', 'utf8');
            gastos = JSON.parse(gastosData);
        } catch (error) {
            // Arquivo não existe, usar array vazio
        }
        
        // Atualizar ou adicionar limite
        const index = gastos.findIndex(g => g.categoria === categoria);
        if (index !== -1) {
            gastos[index].valorLimite = valorLimite;
        } else {
            gastos.push({ categoria, valorLimite, valorGasto: 0 });
        }
        
        await fs.promises.writeFile('gastos.json', JSON.stringify(gastos, null, 2));
        console.log(`Limite definido para ${categoria}: R$ ${valorLimite}`);
    } catch (error) {
        console.error('Erro ao definir gastos:', error);
    }
}
async function verGastos() {
    console.log("=== Resumo de Gastos ===");
    try {
        // Ler limites de gastos
        let gastos = [];
        try {
            const gastosData = await fs.promises.readFile('gastos.json', 'utf8');
            gastos = JSON.parse(gastosData);
        } catch (error) {
            console.log("Nenhum limite de gastos definido.");
            return;
        }

        // Ler transações
        let transacoes = [];
        try {
            const transacoesData = await fs.promises.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(transacoesData);
        } catch (error) {
            // Não há transações, usar array vazio
        }

        // Calcular gastos reais por categoria
        const gastosAtuais = {};
        transacoes.forEach(transacao => {
            if (transacao.tipo === 'despesa') {
                if (!gastosAtuais[transacao.categoria]) {
                    gastosAtuais[transacao.categoria] = 0;
                }
                gastosAtuais[transacao.categoria] += transacao.valor;
            }
        });

        // Exibir resumo
        if (gastos.length === 0) {
            console.log("Nenhum limite de gastos definido.");
            return;
        }

        gastos.forEach(gasto => {
            const valorGasto = gastosAtuais[gasto.categoria] || 0;
            const saldo = gasto.valorLimite - valorGasto;
            console.log(`\nCategoria: ${gasto.categoria}`);
            console.log(`  Limite: R$ ${gasto.valorLimite.toFixed(2)}`);
            console.log(`  Gasto: R$ ${valorGasto.toFixed(2)}`);
            console.log(`  Saldo: R$ ${saldo.toFixed(2)}`);
            if (saldo < 0) {
                console.log("  ❌ Limite excedido!");
            } else if (saldo < gasto.valorLimite * 0.1) {
                console.log("  ⚠️  Limite quase atingido!");
            } else {
                console.log("  ✅ Dentro do limite");
            }
        });
    } catch (error) {
        console.error('Erro ao ver gastos:', error);
    }
}

iniciar();
