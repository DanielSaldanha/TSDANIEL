import 'dotenv/config';
import { prisma } from "../prisma/prisma";
import { getChannel } from "../queue/rabbitmq";

async function startWorker() {
    try {
        const channel = await getChannel();
        console.log('[Worker Webhook] Conectado e aguardando eventos...');

        await channel.consume('webhook_events', async (msg) => {
            if (!msg) return;
            try {
                const { eventId } = JSON.parse(msg.content.toString());
                // processar o evento (buscar no banco, aplicar regra de negócio)
                // e depois: marcar como processado
                await prisma.webhookEvent.update({
                    where: { eventId },
                    data: { status: 'processed', processedAt: new Date() },
                });
                channel.ack(msg);
                console.log(`[Worker Webhook] Evento ${eventId} processado com sucesso.`);
            } catch (error) {
                console.error('[Worker Webhook] Erro ao processar mensagem:', error);
                channel.nack(msg, false, false); // false = não re-enfileirar (evita loop infinito)
            }
        });
    } catch (error) {
        console.error('[Worker Webhook] Falha ao iniciar worker:', error);
        process.exit(1);
    }
}

startWorker();

