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
                let eventId: string | undefined;
                try {
                    eventId = JSON.parse(msg.content.toString())?.eventId;
                } catch { /* JSON inválido */ }

                if (!eventId) {
                    channel.nack(msg, false, false); // mesmo caminho do catch externo: DLX entrega na DLQ
                    console.error('[Worker Webhook] Mensagem malformada (sem eventId) — DLQ sem retry.');
                    return;
                }
                const tentativas = Number(msg.properties.headers?.['tentativas'] ?? 0);//esse header nasce no worker e não na fila ou exchange.
                try {
                    const evento = await prisma.webhookEvent.findUnique({ where: { eventId } });

                    if (!evento) {
                        channel.nack(msg, false, false); // registro inexistente também é erro permanente
                        console.error(`[Worker Webhook] Evento ${eventId} não existe no banco — DLQ sem retry.`);
                        return;
                    }

                    if (evento.status === 'processed') {
                        channel.ack(msg);
                        console.log(`[Worker Webhook] Evento ${eventId} já processado — duplicata descartada.`);
                        return;
                    }
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

                        await prisma.webhookEvent.update({
                            where: { eventId },
                            data: { status: 'failed' },
                        });
                        // channel.sendToQueue('webhook_events_DLQ', msg.content, {
                        //     persistent: true,
                        // });
                        channel.nack(msg, false, false); // encerra o ciclo e envia a DLQ
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

