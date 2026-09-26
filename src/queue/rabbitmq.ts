import amqp from 'amqplib';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export async function getChannel(): Promise<amqp.Channel> {
    if (channel) return channel;
    connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    //exchange
    await channel.assertExchange('Exchange_AB', 'direct', { durable: true, });
    //filas
    await channel.assertQueue('webhook_events_retry',
        {
            durable: true,
            arguments: {
                'x-message-ttl': 5000,                    // delay entre tentativas
                'x-dead-letter-exchange': 'Exchange_AB',  // ao expirar, volta pra exchange
                'x-dead-letter-routing-key': 'evento.A',  // ...com routing key que você quiser (o da fila principal ou DLQ e etc)
            },
        });
    await channel.assertQueue('webhook_events_A',
        {
            durable: true,
            arguments: {
                //'x-message-ttl': 5000,                    // delay entre tentativas
                'x-dead-letter-exchange': 'Exchange_AB',  // ao expirar, volta pra exchange
                'x-dead-letter-routing-key': 'evento.DLQ',  // ...com routing key que você quiser (o da fila principal ou DLQ e etc)
            },
        });
    await channel.assertQueue('webhook_events_B', { durable: true });
    await channel.assertQueue('webhook_events_DLQ', { durable: true });
    //ligação entre exchange e filas
    await channel.bindQueue('webhook_events_A', 'Exchange_AB', 'evento.A')
    await channel.bindQueue('webhook_events_B', 'Exchange_AB', 'evento.B')
    await channel.bindQueue('webhook_events_DLQ', 'Exchange_AB', 'evento.DLQ')
    return channel;
}

