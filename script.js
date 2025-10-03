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

const {input, select, checkbox } = require('@inquirer/prompts');
const fs = require('fs');

async function salvarGastos() {
    try {
        let metas = []; // Inicializa metas para evitar undefined
        await fs.promises.writeFile('metas.json', JSON.stringify(metas, null, 2));
        console.log ("Salvo com Sucesso!")
    }catch (error){
        console.log("Erro ao Salvar")
    }

    try {
        const data = await input({ message: 'Data (YYYY-MM-DD):' });
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
        
        console.log('Transação adicionada:', {tipo, valor, categoria, descricao, data, formaPagamento, recorrente});
        
        return data;
    } catch (error) {
        console.error('Erro ao salvar gastos:', error);
    }
}

function limparTela() {
     console.clear(); // limpando o console
}

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

async function iniciar() {
    console.log("Bem-vindo ao sistema de controle financeiro pessoal!");

    let sair = false;

    while (!sair) {
        const opcao = await select({
            message: 'Escolha uma opção:',
            choices: [
                { value: 'Adicionar Transação', name: 'Adicionar Transação' },
                { value: 'Ver Transações', name: 'Ver Transações' },
                { value: 'Definir Gastos', name: 'Definir Gastos' },
                { value: 'Ver Gastos', name: 'Ver Gastos' },
                { value: 'Sair', name: 'Sair' }
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
    console.log("Ver Transações");
    // Lógica para ver transações
    const transacoes = await input({ message: 'Transações salvas:' });
    console.log(transacoes);
}
async function definirGastos() {
    console.log("Definir Gastos");
    // Lógica para definir gastos
    const gastos = await input({ message: 'Definir Gastos:' });
    console.log(gastos);
}
async function verGastos() {
    console.log("Ver Gastos");
    // Lógica para ver gastos
    const verGastos = await input({ message: 'Gastos salvos:' });
    console.log(verGastos);
}

async function totaoContas() {
    console.log("Total de Contas");
    // Lógica para ver total de contas
    const totalContas = await input({ message: 'Total de Contas:' });
    console.log(totalContas);
}

iniciar();
