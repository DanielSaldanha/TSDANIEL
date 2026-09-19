import 'dotenv/config';
import { prisma } from '../prisma/prisma';

async function runJob() {
    // Aqui dentro você colocará a lógica futura do seu worker.
    // Por enquanto, apenas testa a conexão com o banco.
    const resultado = await prisma.user.findMany({
        where: {
            name: "Daniel"
        }
    });
    resultado.forEach((element, index, arr) => {
        console.log(element.id + " " + element.name + " " + element.email);
    });
    console.log(`[Worker] Executando ciclo em ${new Date().toISOString()}...`);
}

async function startWorker() {
    try {
        // 2. Loop de execução (exemplo a cada 10 segundos)
        const INTERVAL_MS = 10_000;

        // Executa a primeira vez
        await runJob();

        // Mantém o worker rodando periodicamente
        const timer = setInterval(async () => {
            try {
                await runJob();
            } catch (error) {
                console.error('[Worker] Erro ao executar job:', error);
            }
        }, INTERVAL_MS);

        // 3. Graceful shutdown (desconectar do banco ao fechar o processo)
        const shutdown = async (signal: string) => {
            console.log(`\n[Worker] Recebido ${signal}. Encerrando worker...`);
            clearInterval(timer);
            console.log('[Worker] Desconectado do banco. Processo finalizado.');
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('[Worker] Falha ao iniciar worker:', error);
        process.exit(1);
    }
}

startWorker();
