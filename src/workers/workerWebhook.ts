import 'dotenv/config';
import { prisma } from "../prisma/prisma";
import { getChannel } from "../queue/rabbitmq";

async function startWorker() {
    try {
        const channel = await getChannel();
        await channel.prefetch(1); // processa 1 por vez
        console.log('[Worker Webhook] Conectado e aguardando eventos...');

        await channel.consume('webhook_events_A', async (msg) => {
            if (!msg) return;
            try {
                const { eventId } = JSON.parse(msg.content.toString());
                const tentativas = Number(msg.properties.headers?.['tentativas'] ?? 0);//esse header nasce no worker e não na fila ou exchange.
                try {
                    // processar o evento (buscar no banco, aplicar regra de negócio)
                    // e depois: marcar como processado
                    await prisma.webhookEvent.update({
                        where: { eventId },
                        data: { status: 'processed', processedAt: new Date() },
                    });
                    channel.ack(msg);
                    console.log(`[Worker Webhook] Evento ${eventId} processado (tentativa ${tentativas + 1}).`);

                } catch (error) {
                    console.error('[Worker Webhook] Erro ao processar mensagem:', error);

                    if (tentativas + 1 >= 3) {
                        channel.nack(msg); // encerra o ciclo e envia a DLQ
                        await prisma.webhookEvent.update({
                            where: { eventId },
                            data: { status: 'failed' },
                        });
                        channel.sendToQueue('webhook_events_DLQ', msg.content, {
                            persistent: true,
                        });
                        console.log(`[Worker Webhook] Tentativas esgotadas para ${eventId}.`);
                    } else {
                        // agenda nova tentativa com contador incrementado
                        channel.sendToQueue('webhook_events_retry', msg.content, {
                            persistent: true,
                            headers: { tentativas: tentativas + 1 },
                        });
                        channel.ack(msg); // ack na original; a "cópia" já está na fila de retry
                    }
                }
            }
            catch (error) {
                channel.nack(msg, false, false); // false = não re-enfileirar (evita loop infinito)
                console.error('[Worker Webhook] Erro ao processar mensagem:', error);
            }
        });
    } catch (error) {
        console.error('[Worker Webhook] Falha ao iniciar worker:', error);
        process.exit(1);
    }
}

startWorker();

