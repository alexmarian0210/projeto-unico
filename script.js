// Importações
const { input, select } = require('@inquirer/prompts'); // Removido multiselect e checkbox para evitar erros
const fs = require('fs').promises; // Usando promises para async/await
const chalk = require('chalk');
const boxen = require('boxen');

// ===================== Funções Auxiliares =====================
/**
 * @description Exibe um título formatado no console.
 * @param {string} titulo O texto do título.
 */
function exibirTitulo(titulo) {
    console.log(boxen(chalk.cyan.bold(titulo), {padding: 1, margin: 1, borderStyle: 'double'}));
}

// ===================== Funções de transações =====================

/**
 * @description Salva uma nova transação (receita ou despesa) no arquivo `transacoes.json`.
 *              Solicita ao usuário o tipo, valor, categoria, descrição, forma de pagamento e se a transação é recorrente.
 *              Valida o valor inserido para garantir que seja um número positivo.
 *              Lê as transações existentes, adiciona a nova e salva o arquivo atualizado.
 * @returns {Promise<void>}
 */
async function salvarGastos() {
    console.clear();
    exibirTitulo("Adicionar Nova Transação");
    try {
        const data = new Date().toISOString().split('T')[0];

        const tipo = await select({ 
            message: 'Tipo:', 
            choices: [{value: 'receita', name: 'Receita'}, {value: 'despesa', name: 'Despesa'}]
        });

        const valorInput = await input({ message: 'Valor:' });
        const valor = parseFloat(valorInput);
        if (isNaN(valor) || valor <= 0) {
            console.log(chalk.red('Valor inválido. Tente novamente.'));
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
            choices: [{value: true, name: 'Sim'}, {value: false, name: 'Não'}]
        });

        const transacao = { tipo, valor, categoria, descricao, data, formaPagamento, recorrente };

        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {}

        transacoes.push(transacao);
        await fs.writeFile('transacoes.json', JSON.stringify(transacoes, null, 2));
        console.log(chalk.green('Transação adicionada com sucesso!'));
    } catch (error) {
        console.error(chalk.red('Erro ao salvar gastos:'), error);
    }
}

/**
 * @description Exibe as transações (receitas e despesas) do mês atual.
 *              Lê o arquivo `transacoes.json`, filtra as transações para o mês corrente e as exibe no console.
 *              Se não houver transações, exibe uma mensagem informativa.
 * @returns {Promise<void>}
 */
async function verTransacoes() {
    console.clear();
    exibirTitulo("Visualizar Transações");
    try {
        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {
            console.log(chalk.yellow('Nenhuma transação encontrada.'));
            return;
        }

        if (!transacoes.length) {
            console.log(chalk.yellow('Nenhuma transação registrada.'));
            return;
        }

        const mesAtual = new Date().toISOString().slice(0, 7);
        const transacoesDoMes = transacoes.filter(t => t.data.startsWith(mesAtual));

        console.log(chalk.blue(`\n📋 Transações do mês ${mesAtual}:`));
        transacoesDoMes.forEach((t, i) => {
            const emoji = t.tipo === 'receita' ? '💰' : '💸';
            const cor = t.tipo === 'receita' ? chalk.green : chalk.red;
            console.log(cor(`${i+1}. ${emoji} ${t.descricao} - R$ ${t.valor.toFixed(2)} (${t.categoria}) - ${t.data}`));
        });
    } catch (error) {
        console.error(chalk.red('Erro ao ver transações:'), error);
    }
}

/**
 * @description Deleta uma transação específica do arquivo `transacoes.json`.
 *              Mostra uma lista de transações para o usuário escolher qual deletar.
 *              Pede confirmação antes de remover a transação permanentemente.
 * @returns {Promise<void>}
 */
async function deletarTransacao() {
    console.clear();
    exibirTitulo("Deletar Transação");
    try {
        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {
            console.log(chalk.yellow('Nenhuma transação encontrada para deletar.'));
            return;
        }

        if (!transacoes.length) {
            console.log(chalk.yellow('Nenhuma transação registrada para deletar.'));
            return;
        }

        const escolhas = transacoes.map((t, i) => ({
            name: `${i + 1}. ${t.descricao} - R$ ${t.valor.toFixed(2)} (${t.data})`,
            value: i
        }));

        const indiceParaDeletar = await select({
            message: 'Qual transação você deseja deletar?',
            choices: [...escolhas, { name: 'Cancelar', value: -1 }]
        });

        if (indiceParaDeletar === -1) {
            console.log(chalk.gray('Operação de exclusão cancelada.'));
            return;
        }

        const transacaoSelecionada = transacoes[indiceParaDeletar];
        console.log(chalk.yellow(`Você selecionou para deletar:`));
        console.log(chalk.yellow(`  - Descrição: ${transacaoSelecionada.descricao}`));
        console.log(chalk.yellow(`  - Valor: R$ ${transacaoSelecionada.valor.toFixed(2)}`));
        console.log(chalk.yellow(`  - Data: ${transacaoSelecionada.data}`));


        const confirmacao = await select({
            message: 'Você tem certeza que deseja deletar esta transação? Esta ação não pode ser desfeita.',
            choices: [
                { value: 'sim', name: 'Sim, deletar' },
                { value: 'nao', name: 'Não, cancelar' }
            ]
        });

        if (confirmacao === 'sim') {
            transacoes.splice(indiceParaDeletar, 1);
            await fs.writeFile('transacoes.json', JSON.stringify(transacoes, null, 2));
            console.log(chalk.green('Transação deletada com sucesso!'));
        } else {
            console.log(chalk.gray('Operação de exclusão cancelada.'));
        }

    } catch (error) {
        console.error(chalk.red('Erro ao deletar transação:'), error);
    }
}

// ===================== Funções de gastos =====================

/**
 * @description Define uma meta de gasto mensal para uma categoria específica.
 *              Solicita ao usuário a categoria e o valor da meta.
 *              Salva a meta no arquivo `metas.json`.
 * @returns {Promise<void>}
 */
async function definirGastos() {
    console.clear();
    exibirTitulo("Definir Metas de Gastos");
    try {
        // Seleciona a categoria primeiro
        const categoria = await select({ 
            message: 'Qual categoria de gasto você quer definir a meta?', 
            choices: [
                {value: 'alimentacao', name: 'Alimentação'},
                {value: 'lazer', name: 'Lazer'},
                {value: 'transporte', name: 'Transporte'},
                {value: 'saude', name: 'Saúde'},
                {value: 'outros', name: 'Outros'}
            ]
        });

        // Agora, só pede o valor!
        const valorInput = await input({ message: `Digite o valor mensal da meta para ${categoria} (ex: 500):` });
        const valor = parseFloat(valorInput);
        if (isNaN(valor) || valor <= 0) {
            console.log(chalk.red('Valor inválido. Tente novamente.'));
            return;
        }

        // Salva em metas.json
        let metas = {};
        try {
            const conteudo = await fs.readFile('metas.json', 'utf8');
            metas = JSON.parse(conteudo);
        } catch {}

        metas[categoria] = valor;
        await fs.writeFile('metas.json', JSON.stringify(metas, null, 2));
        console.log(chalk.green(`✅ Meta de R$ ${valor.toFixed(2)} para "${categoria}" definida com sucesso!`));
    } catch (error) {
        console.error(chalk.red('Erro ao definir meta:'), error);
    }
}

/**
 * @description Exibe os gastos (despesas) do mês atual.
 *              Lê o arquivo `transacoes.json`, filtra as despesas do mês corrente e as exibe no console.
 *              Calcula e exibe o total de gastos do mês.
 * @returns {Promise<void>}
 */
async function verGastos() {
    console.clear();
    exibirTitulo("Visualizar Gastos do Mês");
    try {
        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {
            console.log(chalk.yellow('Nenhuma transação encontrada.'));
            return;
        }

        const hoje = new Date();
        const mesAtual = hoje.toISOString().slice(0, 7);
        const despesas = transacoes.filter(t => t.tipo === 'despesa' && t.data.startsWith(mesAtual));

        if (!despesas.length) {
            console.log(chalk.yellow('Nenhum gasto no mês atual.'));
            return;
        }

        console.log(chalk.blue(`\n💸 Gastos do mês ${mesAtual}:`));
        despesas.forEach((d, i) => {
            console.log(chalk.red(`${i+1}. ${d.descricao} - R$ ${d.valor.toFixed(2)} (${d.categoria}) - ${d.data}`));
        });

        const totalGastos = despesas.reduce((acc, d) => acc + d.valor, 0);
        console.log(chalk.bold(`\nTotal de gastos: R$ ${totalGastos.toFixed(2)}`));
    } catch (error) {
        console.error(chalk.red('Erro ao ver gastos:'), error);
    }
}

// ===================== Funções de gastos fixos =====================

/**
 * @description Inicializa o arquivo `gastosFixos.json` com valores padrão se ele não existir.
 *              Se o arquivo já existir, apenas lê e retorna seu conteúdo.
 * @returns {Promise<Array<Object>>} Um array com os gastos fixos.
 */
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
            console.log(chalk.blue("Gastos fixos padrão inicializados."));
        }
        return gastosFixos;
    } catch (error) {
        console.error(chalk.red('Erro ao inicializar gastos fixos:'), error);
        return [];
    }
}

/**
 * @description Adiciona um novo gasto fixo ao arquivo `gastosFixos.json`.
 *              Solicita ao usuário a descrição, valor e categoria do gasto fixo.
 * @returns {Promise<void>}
 */
async function adicionarGastoFixo() {
    try {
        const descricao = await input({ message: 'Descrição do gasto fixo:' });
        const valorInput = await input({ message: 'Valor mensal:' });
        const valor = parseFloat(valorInput);
        if (isNaN(valor) || valor <= 0) {
            console.log(chalk.red('Valor inválido.'));
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

        let gastosFixos = await inicializarGastosFixos();

        gastosFixos.push({ 
            descricao, 
            valor, 
            categoria, 
            pago: false, 
            dataCriacao: new Date().toISOString().split('T')[0] 
        });
        await fs.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
        console.log(chalk.green('Gasto fixo adicionado com sucesso!'));
    } catch (error) {
        console.error(chalk.red('Erro ao adicionar gasto fixo:'), error);
    }
}

/**
 * @description Permite ao usuário marcar um ou mais gastos fixos pendentes como pagos.
 *              Exibe a lista de gastos pendentes e pergunta para cada um se deve ser marcado como pago.
 *              Atualiza o status e a data de pagamento no arquivo `gastosFixos.json`.
 * @returns {Promise<void>}
 */
async function marcarGastoComoPago() {
    try {
        let gastosFixos = await inicializarGastosFixos();
        const pendentes = gastosFixos.filter(g => !g.pago);
        if (!pendentes.length) {
            console.log(chalk.yellow("Nenhum gasto pendente."));
            return;
        }

        console.log(chalk.blue('\n📋 Gastos pendentes encontrados:'));
        pendentes.forEach((g, i) => {
            console.log(chalk.yellow(`${i+1}. ${g.descricao} - R$ ${g.valor.toFixed(2)} (${g.categoria})`));
        });

        // Loop simples: processa um a um com select()
        for (let i = 0; i < pendentes.length; i++) {
            const opcao = await select({
                message: `\nMarcar "${pendentes[i].descricao}" como pago?`,
                choices: [
                    { value: 'sim', name: '✅ Sim' },
                    { value: 'nao', name: '❌ Não' }
                ]
            });

            if (opcao === 'sim') {
                const gasto = pendentes[i];
                const idx = gastosFixos.findIndex(g => 
                    g.descricao === gasto.descricao && 
                    g.valor === gasto.valor && 
                    !g.pago
                );
                if (idx !== -1) {
                    gastosFixos[idx].pago = true;
                    gastosFixos[idx].dataPagamento = new Date().toISOString().split('T')[0];
                    console.log(chalk.green(`✅ "${gastosFixos[idx].descricao}" marcado como pago!`));
                }
            } else {
                console.log(chalk.gray(`⏭️ Pulando "${pendentes[i].descricao}".`));
            }
        }

        await fs.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
        console.log(chalk.green('\n🎉 Processo de pagamento concluído!'));
    } catch (error) {
        console.error(chalk.red("Erro ao marcar gasto como pago:"), error);
    }
}

/**
 * @description Exibe todos os gastos fixos, mostrando seu status (pago ou pendente).
 * @returns {Promise<void>}
 */
async function verGastosFixos() {
    try {
        let gastosFixos = await inicializarGastosFixos();
        if (!gastosFixos.length) {
            console.log(chalk.yellow("Nenhum gasto fixo encontrado."));
            return;
        }

        console.log(chalk.blue('\n🔒 Gastos Fixos:'));
        gastosFixos.forEach((g, i) => {
            const status = g.pago ? chalk.green('✅ PAGO') : chalk.red('❌ PENDENTE');
            console.log(`${i+1}. ${g.descricao} - R$ ${g.valor.toFixed(2)} - ${status} - Categoria: ${g.categoria}`);
        });
    } catch (error) {
        console.error(chalk.red("Erro ao ler gastos fixos:"), error);
    }
}

/**
 * @description Deleta um gasto fixo do arquivo `gastosFixos.json`.
 *              Mostra uma lista de gastos fixos para o usuário escolher qual deletar.
 *              Pede confirmação antes de remover o item permanentemente.
 * @returns {Promise<void>}
 */
async function deletarGastoFixo() {
    try {
        let gastosFixos = await inicializarGastosFixos();
        if (!gastosFixos.length) {
            console.log(chalk.yellow("Nenhum gasto fixo encontrado para deletar."));
            return;
        }

        const escolhas = gastosFixos.map((g, i) => ({
            name: `${i + 1}. ${g.descricao} - R$ ${g.valor.toFixed(2)}`,
            value: i
        }));

        const indiceParaDeletar = await select({
            message: 'Qual gasto fixo você deseja deletar?',
            choices: [...escolhas, { name: 'Cancelar', value: -1 }]
        });

        if (indiceParaDeletar === -1) {
            console.log(chalk.gray('Operação de exclusão cancelada.'));
            return;
        }

        const gastoSelecionado = gastosFixos[indiceParaDeletar];
        console.log(chalk.yellow(`Você selecionou para deletar: ${gastoSelecionado.descricao}`));

        const confirmacao = await select({
            message: 'Você tem certeza que deseja deletar este gasto fixo? Esta ação não pode ser desfeita.',
            choices: [
                { value: 'sim', name: 'Sim, deletar' },
                { value: 'nao', name: 'Não, cancelar' }
            ]
        });

        if (confirmacao === 'sim') {
            gastosFixos.splice(indiceParaDeletar, 1);
            await fs.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
            console.log(chalk.green('Gasto fixo deletado com sucesso!'));
        } else {
            console.log(chalk.gray('Operação de exclusão cancelada.'));
        }
    } catch (error) {
        console.error(chalk.red('Erro ao deletar gasto fixo:'), error);
    }
}

// ===================== Menu de Gastos Fixos =====================

/**
 * @description Exibe um submenu para gerenciar gastos fixos, permitindo adicionar, ver ou marcar como pago.
 * @returns {Promise<void>}
 */
async function gerenciarGastosFixos() {
    let sair = false;
    while (!sair) {
        console.clear();
        exibirTitulo("Gerenciar Gastos Fixos");
        const opcao = await select({
            message: chalk.yellow('Escolha uma opção:'),
            choices: [
                {value: 'Adicionar Gasto Fixo', name: chalk.green('Adicionar Gasto Fixo')},
                {value: 'Ver Gastos Fixos', name: chalk.blue('Ver Gastos Fixos')},
                {value: 'Marcar como Pago', name: chalk.cyan('Marcar como Pago')},
                {value: 'Deletar Gasto Fixo', name: chalk.red('Deletar Gasto Fixo')},
                {value: 'Voltar', name: chalk.red('Voltar ao Menu Principal')}
            ]
        });

        switch (opcao) {
            case 'Adicionar Gasto Fixo':
                await adicionarGastoFixo();
                await pressioneEnterParaContinuar();
                break;
            case 'Ver Gastos Fixos':
                await verGastosFixos();
                await pressioneEnterParaContinuar();
                break;
            case 'Marcar como Pago':
                await marcarGastoComoPago();
                await pressioneEnterParaContinuar();
                break;
            case 'Deletar Gasto Fixo':
                await deletarGastoFixo();
                await pressioneEnterParaContinuar();
                break;
            case 'Voltar':
                sair = true;
                break;
        }
    }
}

// ===================== Função de Resumo Financeiro (com comparação de metas) =====================

/**
 * @description Gera e exibe um resumo financeiro completo do mês atual.
 *              Inclui total de receitas, despesas, saldo e uma comparação dos gastos por categoria com as metas definidas.
 *              Indica visualmente se as metas foram excedidas.
 * @returns {Promise<void>}
 */
async function gerarResumoFinanceiro() {
    console.clear();
    exibirTitulo("Resumo Financeiro");
    try {
        let transacoes = [];
        try {
            const conteudo = await fs.readFile('transacoes.json', 'utf8');
            transacoes = JSON.parse(conteudo);
        } catch {
            console.log(chalk.yellow('Nenhuma transação encontrada.'));
            return;
        }

        let metas = {};
        try {
            const conteudoMetas = await fs.readFile('metas.json', 'utf8');
            metas = JSON.parse(conteudoMetas);
        } catch {
            console.log(chalk.yellow('Nenhuma meta definida ainda. Use "Definir Gastos" para criar.'));
        }

        const hoje = new Date();
        const mesAtual = hoje.toISOString().slice(0, 7); // "YYYY-MM"

        const transacoesDoMes = transacoes.filter(t => t.data.startsWith(mesAtual));
        const receitas = transacoesDoMes.filter(t => t.tipo === 'receita');
        const despesas = transacoesDoMes.filter(t => t.tipo === 'despesa');

        const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
        const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
        const saldo = totalReceitas - totalDespesas;

        // Resumo por categoria (despesas) com comparação de meta
        const gastosPorCategoria = {};
        despesas.forEach(d => {
            gastosPorCategoria[d.categoria] = (gastosPorCategoria[d.categoria] || 0) + d.valor;
        });

        console.log(chalk.blue.bold(`\n📅 Resumo Financeiro de ${mesAtual}`));
        console.log(chalk.green(`Receitas: R$ ${totalReceitas.toFixed(2)}`));
        console.log(chalk.red(`Despesas: R$ ${totalDespesas.toFixed(2)}`));
        console.log(chalk.bold(`Saldo: R$ ${saldo.toFixed(2)}`));

        if (Object.keys(gastosPorCategoria).length > 0) {
            console.log(chalk.blue('\nGastos por Categoria (vs. Meta):'));
            Object.entries(gastosPorCategoria).forEach(([cat, val]) => {
                const metaValor = metas[cat] || 0;
                let status;
                if (val > metaValor) {
                    status = chalk.red('🔴 Excedido');
                } else if (val >= metaValor * 0.8) {
                    status = chalk.yellow('🟡 No Limite');
                } else {
                    status = chalk.green('🟢 OK');
                }
                console.log(`  - ${cat}: R$ ${val.toFixed(2)} / Meta: R$ ${metaValor.toFixed(2)} (${status})`);
            });
        }
        console.log('');
    } catch (error) {
        console.error(chalk.red("Erro ao gerar resumo financeiro:"), error);
    }
}

// ===================== Funções de menu principal =====================

/**
 * @description Pausa a execução e espera que o usuário pressione Enter para continuar.
 * @returns {Promise<void>}
 */
async function pressioneEnterParaContinuar() {
    await input({ message: '\nPressione Enter para voltar ao menu...' });
}

/**
 * @description Executa a função correspondente à opção selecionada no menu principal.
 * @param {string} opcao - A opção selecionada pelo usuário.
 * @returns {Promise<void>}
 */
async function executarMenu(opcao) {
    switch (opcao) {
        case 'Adicionar Transação': 
            await salvarGastos(); 
            await pressioneEnterParaContinuar();
            break;
        case 'Ver Transações': 
            await verTransacoes(); 
            await pressioneEnterParaContinuar();
            break;
        case 'Deletar Transação': 
            await deletarTransacao(); 
            await pressioneEnterParaContinuar();
            break;
        case 'Definir Gastos': 
            await definirGastos(); 
            await pressioneEnterParaContinuar();
            break;
        case 'Ver Gastos': 
            await verGastos(); 
            await pressioneEnterParaContinuar();
            break;
        case 'Gastos Fixos': 
            await gerenciarGastosFixos(); 
            break;
        case 'Resumo Financeiro': 
            await gerarResumoFinanceiro(); 
            await pressioneEnterParaContinuar();
            break;
        case 'Sair': console.log(chalk.blue("Saindo do sistema.")); process.exit(0); break;
        default: 
            console.log(chalk.red("Opção inválida")); 
            await pressioneEnterParaContinuar();
            break;
    }
}

// ===================== Função principal =====================

/**
 * @description Função principal que inicia o sistema de controle financeiro.
 *              Exibe o menu principal em loop até que o usuário escolha sair.
 * @returns {Promise<void>}
 */
async function iniciar() {
    console.log(boxen(chalk.cyan.bold("Bem-vindo ao sistema de controle financeiro pessoal!"), {padding: 1, margin: 1, borderStyle: 'double'}));
    await inicializarGastosFixos();

    let sair = false;
    while (!sair) {
        console.clear(); // Limpa a tela a cada iteração do menu
        exibirTitulo("Menu Principal");
        const opcao = await select({
            message: chalk.yellow('Escolha uma opção:'),
            choices: [
                {value: 'Adicionar Transação', name: chalk.green('1. Adicionar Transação')},
                {value: 'Ver Transações', name: chalk.blue('2. Ver Transações')},
                {value: 'Definir Gastos', name: chalk.magenta('3. Definir Gastos/Metas')},
                {value: 'Ver Gastos', name: chalk.cyan('4. Ver Gastos')},
                {value: 'Gastos Fixos', name: chalk.yellow('5. Gerenciar Gastos Fixos')},
                {value: 'Resumo Financeiro', name: chalk.white('6. Resumo Financeiro')},
                {value: 'Deletar Transação', name: chalk.red('7. Deletar Transação')},
                {value: 'Sair', name: chalk.red('8. Sair')}
            ]
        });

        await executarMenu(opcao);
        if (opcao === 'Sair') sair = true;
    }
}

// Executa o programa
iniciar().catch(console.error);
