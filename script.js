// Importações
const { input, select, checkbox, multiselect } = require('@inquirer/prompts');
const fs = require('fs');

// ===================== Funções de transações =====================
async function salvarGastos() {
    try {
        const data = new Date().toISOString().split('T')[0];

        const tipo = await select({ 
            message: 'Tipo:', 
            choices: [{value: 'receita', name: 'Receita'}, {value: 'despesa', name: 'Despesa'}]
        });

        const valor = parseFloat(await input({ message: 'Valor:' }));

        let categoria;
        if (tipo === 'receita') categoria = 'Depósito';
        else categoria = await select({ 
            message: 'Categoria:', 
            choices: [
                {value: 'alimentação', name: 'Alimentação'},
                {value: 'lazer', name: 'Lazer'},
                {value: 'transporte', name: 'Transporte'}
            ]
        });

        const descricao = await input({ message: 'Descrição:' });
        const formaPagamento = await select({ 
            message: 'Forma de Pagamento:',
            choices: [{value: 'dinheiro', name: 'Dinheiro'}, {value: 'cartão', name: 'Cartão'}, {value: 'pix', name: 'Pix'}]
        });

        const recorrenteChoices = await checkbox({ 
            message: 'Recorrente?',
            choices: [{value: 'Sim', name: 'Sim'}, {value: 'Não', name: 'Não', checked: true}]
        });
        const recorrente = recorrenteChoices.includes('Sim');

        const transacao = { tipo, valor, categoria, descricao, data, formaPagamento, recorrente };

        let transacoes = [];
        try { transacoes = JSON.parse(await fs.promises.readFile('transacoes.json','utf8')); } catch {}

        transacoes.push(transacao);
        await fs.promises.writeFile('transacoes.json', JSON.stringify(transacoes,null,2));
        console.log('Transação adicionada com sucesso!');
        return data;

    } catch (error) { console.error('Erro ao salvar gastos:', error); }
}

// ===================== Funções de gastos fixos =====================
async function inicializarGastosFixos() {
    try {
        let gastosFixos = [];
        try { gastosFixos = JSON.parse(await fs.promises.readFile('gastosFixos.json','utf8')); } 
        catch {
            gastosFixos = [
                {descricao:"Aluguel", valor:900, categoria:"aluguel", pago:false, dataCriacao:new Date().toISOString().split('T')[0]},
                {descricao:"Luz", valor:200, categoria:"luz", pago:false, dataCriacao:new Date().toISOString().split('T')[0]},
                {descricao:"Água", valor:60, categoria:"água", pago:false, dataCriacao:new Date().toISOString().split('T')[0]},
                {descricao:"Parcela Carro", valor:1000, categoria:"transporte", pago:false, dataCriacao:new Date().toISOString().split('T')[0]},
                {descricao:"Gasolina", valor:500, categoria:"transporte", pago:false, dataCriacao:new Date().toISOString().split('T')[0]}
            ];
            await fs.promises.writeFile('gastosFixos.json', JSON.stringify(gastosFixos,null,2));
            console.log("Gastos fixos padrão inicializados.");
        }
        return gastosFixos;
    } catch (error) { console.error('Erro ao inicializar gastos fixos:',error); return []; }
}

async function adicionarGastoFixo() {
    try {
        const descricao = await input({ message:'Descrição do gasto fixo:' });
        const valor = parseFloat(await input({ message:'Valor mensal:' }));
        const categoria = await select({ message:'Categoria:', choices:[
            {value:'aluguel', name:'Aluguel'}, {value:'luz', name:'Luz'}, {value:'água', name:'Água'},
            {value:'transporte', name:'Transporte'}, {value:'outros', name:'Outros'}
        ]});

        let gastosFixos = [];
        try { gastosFixos = JSON.parse(await fs.promises.readFile('gastosFixos.json','utf8')); } 
        catch { gastosFixos = await inicializarGastosFixos(); }

        gastosFixos.push({ descricao, valor, categoria, pago:false, dataCriacao:new Date().toISOString().split('T')[0] });
        await fs.promises.writeFile('gastosFixos.json', JSON.stringify(gastosFixos,null,2));
        console.log('Gasto fixo adicionado com sucesso!');
    } catch (error) { console.error('Erro ao adicionar gasto fixo:',error); }
}

async function marcarGastoComoPago() {
    try {
        const gastosFixos = JSON.parse(await fs.promises.readFile('gastosFixos.json','utf8'));
        const pendentes = gastosFixos.filter(g => !g.pago);
        if (!pendentes.length) { console.log("Nenhum gasto pendente."); return; }

        const selIndices = await multiselect({
            message: 'Selecione os gastos a marcar como pagos:',
            choices: pendentes.map((g,i) => ({ value:i, name:`${g.descricao} - R$ ${g.valor.toFixed(2)}` }))
        });

        for (const sel of selIndices) {
            const idx = gastosFixos.findIndex(g => g.descricao === pendentes[sel].descricao && g.valor === pendentes[sel].valor && !g.pago);
            if (idx !== -1) {
                gastosFixos[idx].pago = true;
                gastosFixos[idx].dataPagamento = new Date().toISOString().split('T')[0];
                console.log(`Gasto "${gastosFixos[idx].descricao}" marcado como pago!`);
            }
        }

        await fs.promises.writeFile('gastosFixos.json', JSON.stringify(gastosFixos,null,2));

    } catch (error) { console.error("Erro ao marcar gasto como pago:", error); }
}

async function verGastosFixos() {
    try {
        const gastosFixos = JSON.parse(await fs.promises.readFile('gastosFixos.json','utf8'));
        if (!gastosFixos.length) { console.log("Nenhum gasto fixo encontrado."); return; }

        gastosFixos.forEach((g,i) => {
            const status = g.pago ? '✅ PAGO' : '❌ PENDENTE';
            console.log(`${i+1}. ${g.descricao} - R$ ${g.valor.toFixed(2)} - ${status} - Categoria: ${g.categoria}`);
        });

    } catch { console.log("Erro ao ler gastos fixos."); }
}

// ===================== Menu de Gastos Fixos =====================
async function gerenciarGastosFixos() {
    const opcao = await select({
        message: 'Gerenciar Gastos Fixos:',
        choices:[
            {value:'Adicionar Gasto Fixo',name:'Adicionar Gasto Fixo'},
            {value:'Ver Gastos Fixos',name:'Ver Gastos Fixos'},
            {value:'Marcar como Pago',name:'Marcar como Pago'},
            {value:'Voltar',name:'Voltar ao Menu Principal'}
        ]
    });

    switch(opcao){
        case 'Adicionar Gasto Fixo': await adicionarGastoFixo(); break;
        case 'Ver Gastos Fixos': await verGastosFixos(); break;
        case 'Marcar como Pago': await marcarGastoComoPago(); break;
        case 'Voltar': break;
    }
}

// ===================== Funções de menu principal =====================
async function executarMenu(opcao) {
    switch(opcao){
        case 'Adicionar Transação': await salvarGastos(); break;
        case 'Ver Transações': await verTransacoes(); break;
        case 'Definir Gastos': await definirGastos(); break;
        case 'Ver Gastos': await verGastos(); break;
        case 'Gastos Fixos': await gerenciarGastosFixos(); break;
        case 'Sair': console.log("Saindo do sistema."); break;
        default: console.log("Opção inválida"); break;
    }
}

// ===================== Função principal =====================
async function iniciar() {
    console.log("Bem-vindo ao sistema de controle financeiro pessoal!");
    await inicializarGastosFixos();

    let sair = false;
    while(!sair){
        const opcao = await select({
            message:'Escolha uma opção:',
            choices:[
                {value:'Adicionar Transação',name:'Adicionar Transação'},
                {value:'Ver Transações',name:'Ver Transações'},
                {value:'Definir Gastos',name:'Definir Gastos'},
                {value:'Ver Gastos',name:'Ver Gastos'},
                {value:'Gastos Fixos',name:'Gastos Fixos'},
                {value:'Sair',name:'Sair'}
            ]
        });

        await executarMenu(opcao);
        if(opcao==='Sair') sair = true;
    }
}

iniciar();
