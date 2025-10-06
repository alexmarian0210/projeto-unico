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
 * Coleta dados do usuário via prompts interativos e salva no arquivo transacoes.json
 * Usa a data atual automaticamente no formato YYYY-MM-DD
 * @returns {Promise<string>} Data da transação salva
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
 * Função para limpar o console/tela do terminal
 * Utiliza console.clear() para remover todo o conteúdo visualizado anteriormente
 * Melhora a experiência do usuário ao limpar a interface
 */
function limparTela() {
     console.clear(); // limpando o console
}

/**
 * Função para executar a opção selecionada no menu principal
 * Recebe a opção escolhida pelo usuário e direciona para a função correspondente
 * Gerencia o fluxo do programa baseado na escolha do usuário
 * @param {string} opcao - Opção selecionada pelo usuário no menu
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
        case 'Gastos Fixos':
            await gerenciarGastosFixos();
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
 * Função para mostrar resumo rápido dos gastos fixos
 * Exibe total de gastos fixos, valor pago e pendente
 */
async function mostrarResumoGastosFixos() {
    try {
        const gastosFixosData = await fs.promises.readFile('gastosFixos.json', 'utf8');
        const gastosFixos = JSON.parse(gastosFixosData);
        
        if (gastosFixos.length === 0) {
            console.log("📊 Nenhum gasto fixo cadastrado.");
            return;
        }

        const total = gastosFixos.reduce((sum, gasto) => sum + gasto.valor, 0);
        const totalPago = gastosFixos.filter(gasto => gasto.pago).reduce((sum, gasto) => sum + gasto.valor, 0);
        const totalPendente = total - totalPago;
        const percentualPago = total > 0 ? (totalPago / total * 100).toFixed(1) : 0;

        console.log("📊 RESUMO DOS GASTOS FIXOS:");
        console.log(`💵 Total: R$ ${total.toFixed(2)}`);
        console.log(`✅ Pago: R$ ${totalPago.toFixed(2)} (${percentualPago}%)`);
        console.log(`❌ Pendente: R$ ${totalPendente.toFixed(2)}`);
        
        // Mostrar gastos pendentes específicos
        const gastosPendentes = gastosFixos.filter(gasto => !gasto.pago);
        if (gastosPendentes.length > 0) {
            console.log("\n⚠️  GASTOS PENDENTES:");
            gastosPendentes.forEach(gasto => {
                console.log(`   • ${gasto.descricao}: R$ ${gasto.valor.toFixed(2)}`);
            });
        }
    } catch (error) {
        // Ignorar erro se arquivo não existir
    }
}

/**
 * Função principal que inicia o sistema de controle financeiro pessoal
 * Exibe menu interativo com opções e gerencia o loop principal do programa
 * Mantém o sistema rodando até que o usuário escolha sair
 */
async function iniciar() {
    console.log("Bem-vindo ao sistema de controle financeiro pessoal!");
    
    // Inicializar gastos fixos padrão automaticamente
    await inicializarGastosFixos();

    // Mostrar resumo dos gastos fixos ao iniciar
    await mostrarResumoGastosFixos();
    console.log("\n" + "=".repeat(50) + "\n");

    let sair = false;

    while (!sair) {
        const opcao = await select({
            message: 'Escolha uma opção:',
            choices: [
                { value: 'Adicionar Transação', name: 'Adicionar Transação' },
                { value: 'Ver Transações', name: 'Ver Transações' },
                { value: 'Definir Gastos', name: 'Definir Gastos' },
                { value: 'Ver Gastos', name: 'Ver Gastos' },
                { value: 'Gastos Fixos', name: 'Gastos Fixos' },
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


/**
 * Função para visualizar todas as transações financeiras salvas
 * Lê o arquivo transacoes.json e exibe as transações em formato de lista detalhada
 * Mostra todas as informações de cada transação de forma organizada
 * Se não houver transações, exibe mensagem informativa ao usuário
 */
async function verTransacoes() {
    console.log("=== Transações Salvas ===");
    try {
        const transacoesData = await fs.promises.readFile('transacoes.json', 'utf8');
        const transacoes = JSON.parse(transacoesData);
        
        if (transacoes.length === 0) {
            console.log("Nenhuma transação encontrada.");
        } else {
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
        }

        // Mostrar gastos fixos também
        console.log("\n=== Gastos Fixos ===");
        try {
            const gastosFixosData = await fs.promises.readFile('gastosFixos.json', 'utf8');
            const gastosFixos = JSON.parse(gastosFixosData);
            
            if (gastosFixos.length === 0) {
                console.log("Nenhum gasto fixo encontrado.");
            } else {
                gastosFixos.forEach((gasto, index) => {
                    const status = gasto.pago ? '✅ PAGO' : '❌ PENDENTE';
                    console.log(`\nGasto Fixo ${index + 1}:`);
                    console.log(`  Descrição: ${gasto.descricao}`);
                    console.log(`  Valor: R$ ${gasto.valor}`);
                    console.log(`  Categoria: ${gasto.categoria}`);
                    console.log(`  Status: ${status}`);
                    if (gasto.dataPagamento) {
                        console.log(`  Data de Pagamento: ${gasto.dataPagamento}`);
                    }
                });
            }
        } catch (error) {
            console.log("Nenhum gasto fixo encontrado ou erro ao ler arquivo.");
        }
    } catch (error) {
        console.log("Nenhuma transação encontrada ou erro ao ler arquivo.");
    }
}

/**
 * Função para definir limites de gastos por categoria
 * Permite ao usuário definir um valor limite mensal para cada categoria de despesa
 * Salva os limites definidos no arquivo gastos.json para controle futuro
 * Atualiza limites existentes ou cria novos conforme necessário
 */
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
/**
 * Função para visualizar resumo de gastos por categoria
 * Compara os limites definidos com os gastos reais das transações
 * Calcula saldo disponível e alerta sobre limites excedidos ou próximos do limite
 * Exibe informações de forma clara com indicadores visuais de status
 */
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

        // Calcular gastos reais por categoria (transações + gastos fixos)
        const gastosAtuais = {};
        
        // Somar transações
        transacoes.forEach(transacao => {
            if (transacao.tipo === 'despesa') {
                if (!gastosAtuais[transacao.categoria]) {
                    gastosAtuais[transacao.categoria] = 0;
                }
                gastosAtuais[transacao.categoria] += transacao.valor;
            }
        });

        // Somar gastos fixos (todos, independente de estarem pagos ou não)
        try {
            const gastosFixosData = await fs.promises.readFile('gastosFixos.json', 'utf8');
            const gastosFixos = JSON.parse(gastosFixosData);
            
            gastosFixos.forEach(gastoFixo => {
                if (!gastosAtuais[gastoFixo.categoria]) {
                    gastosAtuais[gastoFixo.categoria] = 0;
                }
                gastosAtuais[gastoFixo.categoria] += gastoFixo.valor;
            });
        } catch (error) {
            // Arquivo de gastos fixos não existe, ignorar
        }

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

/**
 * Função para gerenciar gastos fixos (menu principal)
 * Permite ao usuário escolher entre adicionar, visualizar ou marcar gastos fixos como pagos
 */
async function gerenciarGastosFixos() {
    const opcao = await select({
        message: 'Gerenciar Gastos Fixos:',
        choices: [
            { value: 'Adicionar Gasto Fixo', name: 'Adicionar Gasto Fixo' },
            { value: 'Ver Gastos Fixos', name: 'Ver Gastos Fixos' },
            { value: 'Marcar como Pago', name: 'Marcar como Pago' },
            { value: 'Voltar', name: 'Voltar ao Menu Principal' }
        ]
    });

    switch (opcao) {
        case 'Adicionar Gasto Fixo':
            await adicionarGastoFixo();
            break;
        case 'Ver Gastos Fixos':
            await verGastosFixos();
            break;
        case 'Marcar como Pago':
            await marcarGastoComoPago();
            break;
        case 'Voltar':
            console.log("Voltando ao menu principal...");
            break;
    }
}

/**
 * Função para inicializar gastos fixos padrão se não existirem
 * Cria os gastos fixos predefinidos: Aluguel, Luz, Água, Parcela Carro, Gasolina
 */
async function inicializarGastosFixos() {
    try {
        let gastosFixos = [];
        
        // Tentar ler gastos fixos existentes
        try {
            const gastosFixosData = await fs.promises.readFile('gastosFixos.json', 'utf8');
            gastosFixos = JSON.parse(gastosFixosData);
        } catch (error) {
            // Arquivo não existe, inicializar com gastos padrão
            gastosFixos = [
                {
                    descricao: "Aluguel",
                    valor: 900,
                    categoria: "aluguel",
                    pago: false,
                    dataCriacao: new Date().toISOString().split('T')[0]
                },
                {
                    descricao: "Luz",
                    valor: 200,
                    categoria: "luz",
                    pago: false,
                    dataCriacao: new Date().toISOString().split('T')[0]
                },
                {
                    descricao: "Água",
                    valor: 60,
                    categoria: "água",
                    pago: false,
                    dataCriacao: new Date().toISOString().split('T')[0]
                },
                {
                    descricao: "Parcela Carro",
                    valor: 1000,
                    categoria: "transporte",
                    pago: false,
                    dataCriacao: new Date().toISOString().split('T')[0]
                },
                {
                    descricao: "Gasolina",
                    valor: 500,
                    categoria: "transporte",
                    pago: false,
                    dataCriacao: new Date().toISOString().split('T')[0]
                }
            ];
            
            // Salvar gastos fixos padrão
            await fs.promises.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
            console.log("Gastos fixos padrão inicializados.");
        }
        
        return gastosFixos;
    } catch (error) {
        console.error('Erro ao inicializar gastos fixos:', error);
        return [];
    }
}

/**
 * Função para adicionar um novo gasto fixo
 * Coleta informações do usuário e salva no arquivo gastosFixos.json
 */
async function adicionarGastoFixo() {
    console.log("=== Adicionar Gasto Fixo ===");
    try {
        const descricao = await input({ message: 'Descrição do gasto fixo:' });
        const valor = parseFloat(await input({ message: 'Valor mensal:' }));
        const categoria = await select({
            message: 'Categoria:',
            choices: [
                {value: 'aluguel', name: 'Aluguel'},
                {value: 'luz', name: 'Luz'},
                {value: 'água', name: 'Água'},
                {value: 'transporte', name: 'Transporte'},
                {value: 'outros', name: 'Outros'}
            ]
        });

        const gastoFixo = {
            descricao,
            valor,
            categoria,
            pago: false,
            dataCriacao: new Date().toISOString().split('T')[0]
        };

        // Ler gastos fixos existentes
        let gastosFixos = [];
        try {
            const gastosFixosData = await fs.promises.readFile('gastosFixos.json', 'utf8');
            gastosFixos = JSON.parse(gastosFixosData);
        } catch (error) {
            // Se arquivo não existir, inicializar com padrão
            gastosFixos = await inicializarGastosFixos();
        }

        // Adicionar novo gasto fixo
        gastosFixos.push(gastoFixo);

        // Salvar gastos fixos
        await fs.promises.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
        console.log('Gasto fixo adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar gasto fixo:', error);
    }
}

/**
 * Função para visualizar todos os gastos fixos
 * Exibe gastos fixos organizados por categoria e status de pagamento
 */
async function verGastosFixos() {
    console.log("=== Gastos Fixos ===");
    try {
        const gastosFixosData = await fs.promises.readFile('gastosFixos.json', 'utf8');
        const gastosFixos = JSON.parse(gastosFixosData);
        
        if (gastosFixos.length === 0) {
            console.log("Nenhum gasto fixo encontrado.");
            return;
        }

        // Agrupar por categoria
        const gastosPorCategoria = {};
        gastosFixos.forEach(gasto => {
            if (!gastosPorCategoria[gasto.categoria]) {
                gastosPorCategoria[gasto.categoria] = [];
            }
            gastosPorCategoria[gasto.categoria].push(gasto);
        });

        // Exibir por categoria
        Object.keys(gastosPorCategoria).forEach(categoria => {
            console.log(`\n${categoria.toUpperCase()}:`);
            gastosPorCategoria[categoria].forEach((gasto, index) => {
                const status = gasto.pago ? '✅ PAGO' : '❌ PENDENTE';
                console.log(`  ${index + 1}. ${gasto.descricao} - R$ ${gasto.valor.toFixed(2)} - ${status}`);
            });
        });

        // Calcular total
        const total = gastosFixos.reduce((sum, gasto) => sum + gasto.valor, 0);
        const totalPago = gastosFixos.filter(gasto => gasto.pago).reduce((sum, gasto) => sum + gasto.valor, 0);
        const totalPendente = total - totalPago;

        console.log(`\n💵 Total: R$ ${total.toFixed(2)}`);
        console.log(`✅ Total pago: R$ ${totalPago.toFixed(2)}`);
        console.log(`❌ Total pendente: R$ ${totalPendente.toFixed(2)}`);

    } catch (error) {
        console.log("Nenhum gasto fixo encontrado ou erro ao ler arquivo.");
    }
}

/**
 * Função para marcar gastos fixos como pagos
 * Permite ao usuário selecionar gastos pendentes e marcá-los como pagos
 */
async function marcarGastoComoPago() {
    console.log("=== Marcar Gasto como Pago ===");
    try {
        const gastosFixosData = await fs.promises.readFile('gastosFixos.json', 'utf8');
        const gastosFixos = JSON.parse(gastosFixosData);
        
        // Filtrar apenas gastos pendentes
        const gastosPendentes = gastosFixos.filter(gasto => !gasto.pago);
        
        if (gastosPendentes.length === 0) {
            console.log("Não há gastos pendentes para marcar como pagos.");
            return;
        }

        const gastoSelecionado = await select({
            message: 'Selecione o gasto para marcar como pago:',
            choices: gastosPendentes.map((gasto, index) => ({
                value: index,
                name: `${gasto.descricao} - R$ ${gasto.valor.toFixed(2)} (${gasto.categoria})`
            }))
        });

        // Marcar como pago
        const gastoIndex = gastosFixos.findIndex(g => 
            g.descricao === gastosPendentes[gastoSelecionado].descricao && 
            g.valor === gastosPendentes[gastoSelecionado].valor
        );

        if (gastoIndex !== -1) {
            gastosFixos[gastoIndex].pago = true;
            gastosFixos[gastoIndex].dataPagamento = new Date().toISOString().split('T')[0];
            
            await fs.promises.writeFile('gastosFixos.json', JSON.stringify(gastosFixos, null, 2));
            console.log(`Gasto "${gastosFixos[gastoIndex].descricao}" marcado como pago!`);
        }
    } catch (error) {
        console.error('Erro ao marcar gasto como pago:', error);
    }
}

iniciar();
