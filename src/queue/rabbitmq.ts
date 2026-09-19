import amqp from 'amqplib';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export async function getChannel(): Promise<amqp.Channel> {
    if (channel) return channel;
    connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    await channel.assertQueue('webhook_events', { durable: true });
    return channel;
}

