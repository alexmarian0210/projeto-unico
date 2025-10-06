// Importações
const { input, select, checkbox, multiselect } = require('@inquirer/prompts');
const fs = require('fs').promises; // Usando promises para async/await

// ===================== Funções de transações =====================
async function salvarGastos() {
    try {
        const data = new Date().toISOString().split('T')[0];

        const tipo = await select({ 
            message: 'Tipo:', 
            choices: [{value: 'receita', name: 'Receita'}, {value: 'despesa', name: 'Despesa'}]
        });

        const valor = parseFloat(await input({ message: 'Valor:' }));
        if (isNaN(valor) || valor <= 0) {
            console.log('Valor inválido. Tente novamente.');
            return;
        }

        let categoria;
        if (tipo === 'receita') {
            categoria = await select({ 
                message: 'Categoria de Receita:', 
                choices: [
                    {value: 'salario', name: 'Salário'},
                    {value: 'freelance', name: 'Freelance'},
                    {value: 'outros', name: 'Outros'}
                ]
            });
        } else {
            categoria = await select({ 
                message: 'Categoria:', 
                choices: [
                    {value: 'alimentacao', name: 'Alimentação'},
                    {value: 'lazer', name: 'Lazer'},
                    {value: 'transporte', name: 'Transporte'},
                    {value: 'saude', name: 'Saúde'},
                    {value: 'outros', name: 'Outros'}
                ]
            });
        }

        const descricao = await input({ message: 'Descrição:' });
        const formaPagamento = await select({ 
            message: 'Forma de Pagamento:',
            choices: [{value: 'dinheiro', name: 'Dinheiro'}, {value: 'cartao', name: 'Cartão'}, {value: 'pix', name: 'Pix'}]
        });

        const recorrente = await select({
            message: 'Recorrente?',
            choices: [{value: true, name: 'Sim'}, {value: false, name: 'Não', checked: true}]
        });

        const transacao = { tipo, valor, categoria, descricao, data, formaPagamento, recorrente };

        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {}

        transacoes.push(transacao);
        await fs.writeFile('transacoes.json', JSON.stringify(transacoes, null, 2));
        console.log('Transação adicionada com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar gastos:', error);
    }
}

async function verTransacoes() {
    try {
        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {
            console.log('Nenhuma transação encontrada.');
            return;
        }

        if (!transacoes.length) {
            console.log('Nenhuma transação registrada.');
            return;
        }

        const mesAtual = new Date().toISOString().slice(0, 7);
        const transacoesDoMes = transacoes.filter(t => t.data.startsWith(mesAtual));

        console.log(`\n📋 Transações do mês ${mesAtual}:`);
        transacoesDoMes.forEach((t, i) => {
            const emoji = t.tipo === 'receita' ? '💰' : '💸';
            console.log(`${i+1}. ${emoji} ${t.descricao} - R$ ${t.valor.toFixed(2)} (${t.categoria}) - ${t.data}`);
        });
    } catch (error) {
        console.error('Erro ao ver transações:', error);
    }
}

// ===================== Funções de gastos (básicas, pois não estavam definidas) =====================
async function definirGastos() {
    console.log('Funcionalidade para definir metas/orçamentos mensais (em desenvolvimento).');
    // Exemplo: Poderia adicionar um JSON para metas de categorias
    const meta = await input({ message: 'Defina uma meta para uma categoria (ex: "alimentacao: 500"):' });
    console.log(`Meta definida: ${meta}`);
    // Aqui você poderia salvar em um arquivo 'metas.json'
}

async function verGastos() {
    try {
        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {
            console.log('Nenhuma transação encontrada.');
            return;
        }

        const hoje = new Date();
        const mesAtual = hoje.toISOString().slice(0, 7);
        const despesas = transacoes.filter(t => t.tipo === 'despesa' && t.data.startsWith(mesAtual));

        if (!despesas.length) {
            console.log('Nenhum gasto no mês atual.');
            return;
        }

        console.log(`\n💸 Gastos do mês ${mesAtual}:`);
        despesas.forEach((d, i) => {
            console.log(`${i+1}. ${d.descricao} - R$ ${d.valor.toFixed(2)} (${d.categoria}) - ${d.data}`);
        });

        const totalGastos = despesas.reduce((acc, d) => acc + d.valor, 0);
        console.log(`\nTotal de gastos: R$ ${totalGastos.toFixed(2)}`);
    } catch (error) {
        console.error('Erro ao ver gastos:', error);
    }
}

// ===================== Funções de gastos fixos =====================
async function inicializarGastosFixos() {
    try {
        let gastosFixos = [];
        try {
            const conteudo = await fs.readFile('gastosFixos.json', 'utf8');
            gastosFixos = JSON.parse(conteudo);
        } catch {
            gastosFixos = [
                {descricao: "Aluguel", valor: 900, categoria: "aluguel", pago: false, dataCriacao: new Date().toISOString().split('T')[0]},
                {descricao: "Luz", valor: 200, categoria: "luz", pago: false, dataCriacao: new Date().toISOString().split('T')[0]},
                {descricao: "Água", valor: 60, categoria: "agua", pago: false, dataCriacao: new Date().toISOString().split('T')[0]},
                {descricao: "Parcela Carro", valor: 1000, categoria: "transporte", pago: false, dataCriacao: new Date().toISOString().split('T')[0]},
                {descricao: "Gasolina", valor: 500, categoria: "transporte", pago: false, dataCriacao: new Date().toISOString().split('T')[0]}
            ];
            await fs.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
            console.log("Gastos fixos padrão inicializados.");
        }
        return gastosFixos;
    } catch (error) {
        console.error('Erro ao inicializar gastos fixos:', error);
        return [];
    }
}

async function adicionarGastoFixo() {
    try {
        const descricao = await input({ message: 'Descrição do gasto fixo:' });
        const valor = parseFloat(await input({ message: 'Valor mensal:' }));
        if (isNaN(valor) || valor <= 0) {
            console.log('Valor inválido.');
            return;
        }
        const categoria = await select({ 
            message: 'Categoria:', 
            choices: [
                {value: 'aluguel', name: 'Aluguel'}, 
                {value: 'luz', name: 'Luz'}, 
                {value: 'agua', name: 'Água'},
                {value: 'transporte', name: 'Transporte'}, 
                {value: 'outros', name: 'Outros'}
            ]
        });

        let gastosFixos = await inicializarGastosFixos(); // Garante que o arquivo existe

        gastosFixos.push({ 
            descricao, 
            valor, 
            categoria, 
            pago: false, 
            dataCriacao: new Date().toISOString().split('T')[0] 
        });
        await fs.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
        console.log('Gasto fixo adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar gasto fixo:', error);
    }
}

async function marcarGastoComoPago() {
    try {
        let gastosFixos = await inicializarGastosFixos();
        const pendentes = gastosFixos.filter(g => !g.pago);
        if (!pendentes.length) {
            console.log("Nenhum gasto pendente.");
            return;
        }

        const selIndices = await multiselect({
            message: 'Selecione os gastos a marcar como pagos:',
            choices: pendentes.map((g, i) => ({ 
                value: i, 
                name: `${g.descricao} - R$ ${g.valor.toFixed(2)} (${g.categoria})` 
            }))
        });

        for (const sel of selIndices) {
            const gasto = pendentes[sel];
            const idx = gastosFixos.findIndex(g => 
                g.descricao === gasto.descricao && g.valor === gasto.valor && !g.pago
            );
            if (idx !== -1) {
                gastosFixos[idx].pago = true;
                gastosFixos[idx].dataPagamento = new Date().toISOString().split('T')[0];
                console.log(`Gasto "${gastosFixos[idx].descricao}" marcado como pago!`);
            }
        }

        await fs.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
    } catch (error) {
        console.error("Erro ao marcar gasto como pago:", error);
    }
}

async function verGastosFixos() {
    try {
        let gastosFixos = await inicializarGastosFixos();
        if (!gastosFixos.length) {
            console.log("Nenhum gasto fixo encontrado.");
            return;
        }

        console.log('\n🔒 Gastos Fixos:');
        gastosFixos.forEach((g, i) => {
            const status = g.pago ? '✅ PAGO' : '❌ PENDENTE';
            console.log(`${i+1}. ${g.descricao} - R$ ${g.valor.toFixed(2)} - ${status} - Categoria: ${g.categoria}`);
        });
    } catch (error) {
        console.error("Erro ao ler gastos fixos:", error);
    }
}

// ===================== Menu de Gastos Fixos =====================
async function gerenciarGastosFixos() {
    const opcao = await select({
        message: 'Gerenciar Gastos Fixos:',
        choices: [
            {value: 'Adicionar Gasto Fixo', name: 'Adicionar Gasto Fixo'},
            {value: 'Ver Gastos Fixos', name: 'Ver Gastos Fixos'},
            {value: 'Marcar como Pago', name: 'Marcar como Pago'},
            {value: 'Voltar', name: 'Voltar ao Menu Principal'}
        ]
    });

    switch (opcao) {
        case 'Adicionar Gasto Fixo': await adicionarGastoFixo(); break;
        case 'Ver Gastos Fixos': await verGastosFixos(); break;
        case 'Marcar como Pago': await marcarGastoComoPago(); break;
        case 'Voltar': break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa para melhor UX
}

// ===================== Função de Resumo Financeiro =====================
async function gerarResumoFinanceiro() {
    try {
        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {
            console.log('Nenhuma transação encontrada.');
            return;
        }

        const hoje = new Date();
        const mesAtual = hoje.toISOString().slice(0, 7); // "YYYY-MM"

        const transacoesDoMes = transacoes.filter(t => t.data.startsWith(mesAtual));
        const receitas = transacoesDoMes.filter(t => t.tipo === 'receita');
        const despesas = transacoesDoMes.filter(t => t.tipo === 'despesa');

        const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
        const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
        const saldo = totalReceitas - totalDespesas;

        // Resumo por categoria (despesas)
        const gastosPorCategoria = {};
        despesas.forEach(d => {
            gastosPorCategoria[d.categoria] = (gastosPorCategoria[d.categoria] || 0) + d.valor;
        });

        console.log(`\n📅 Resumo Financeiro de ${mesAtual}`);
        console.log(`Receitas: R$ ${totalReceitas.toFixed(2)}`);
        console.log(`Despesas: R$ ${totalDespesas.toFixed(2)}`);
        console.log(`Saldo: R$ ${saldo.toFixed(2)}`);

        if (Object.keys(gastosPorCategoria).length > 0) {
            console.log('\nGastos por Categoria:');
            Object.entries(gastosPorCategoria).forEach(([cat, val]) => {
                console.log(`  - ${cat}: R$ ${val.toFixed(2)}`);
            });
        }
        console.log('');
    } catch (error) {
        console.error("Erro ao gerar resumo financeiro:", error);
    }
}

// ===================== Funções de menu principal =====================
async function executarMenu(opcao) {
    switch (opcao) {
        case 'Adicionar Transação': await salvarGastos(); break;
        case 'Ver Transações': await verTransacoes(); break;
        case 'Definir Gastos': await definirGastos(); break;
        case 'Ver Gastos': await verGastos(); break;
        case 'Gastos Fixos': await gerenciarGastosFixos(); break;
        case 'Resumo Financeiro': await gerarResumoFinanceiro(); break;
        case 'Sair': console.log("Saindo do sistema."); process.exit(0); break;
        default: console.log("Opção inválida"); break;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre ações
}

// ===================== Função principal =====================
async function iniciar() {
    console.log("Bem-vindo ao sistema de controle financeiro pessoal!");
    await inicializarGastosFixos();

    let sair = false;
    while (!sair) {
        const opcao = await select({
            message: 'Escolha uma opção:',
            choices: [
                {value: 'Adicionar Transação', name: '1. Adicionar Transação'},
                {value: 'Ver Transações', name: '2. Ver Transações'},
                {value: 'Definir Gastos', name: '3. Definir Gastos/Metas'},
                {value: 'Ver Gastos', name: '4. Ver Gastos'},
                {value: 'Gastos Fixos', name: '5. Gerenciar Gastos Fixos'},
                {value: 'Resumo Financeiro', name: '6. Resumo Financeiro'},
                {value: 'Sair', name: '7. Sair'}
            ]
        });

        await executarMenu(opcao);
        if (opcao === 'Sair') sair = true;
    }
}

// Executa o programa
iniciar().catch(console.error);