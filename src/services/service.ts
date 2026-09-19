import { muitosUsuarios, criarUsuario, deletarUsuario, mudarUsuario, acharUsuario, registrarEvento, CreateUserInput, UpdateUserInput, CreateWebhookEventInput } from "../repositories/repository";
import { User } from '@prisma/client';
import crypto from 'crypto';
import { getChannel } from "../queue/rabbitmq";


export async function processandoUsuarios(): Promise<User[]> {
    const usuarios = await muitosUsuarios();
    return usuarios;
}

export async function achandoUsuario(id: number): Promise<User | null> {
    const resposta = await acharUsuario(id);
    return resposta;
}

export async function criandoUsuario(user: CreateUserInput): Promise<User> {
    const resultado = await criarUsuario(user);
    return resultado;
}

export async function mudandoUsuario(id: number, user: UpdateUserInput): Promise<User | null> {
    const resposta = await mudarUsuario(id, user);
    return resposta;
}

export async function deletandoUsuario(id: number): Promise<User | null> {
    const resultado = await deletarUsuario(id);
    return resultado;
}

export function verificarAssinatura(rawBody: Buffer, assinaturaRecebida: string): boolean {
    const assinaturaEsperada = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET!)
        .update(rawBody)
        .digest('hex');

    const esperada = Buffer.from(assinaturaEsperada, 'utf8');
    const recebida = Buffer.from(assinaturaRecebida, 'utf8');

    if (recebida.length !== esperada.length) {
        return false;
    }

    return crypto.timingSafeEqual(recebida, esperada);
}

export async function registrarWebhook(dados: CreateWebhookEventInput): Promise<'criado' | 'duplicado'> {
    const resultado = await registrarEvento(dados)
    if (resultado === 'criado') {
        const channel = await getChannel();
        channel.sendToQueue('webhook_events', Buffer.from(JSON.stringify(dados)), {
            persistent: true,
            contentType: 'application/json',
            messageId: dados.eventId,
        });
    }

    return 'criado';
}