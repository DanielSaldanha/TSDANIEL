import { prisma } from '../prisma/prisma';
import { Prisma, User } from '@prisma/client';

export interface CreateUserInput {
    email: string;
    name?: string | null;
}

export interface CreateWebhookEventInput {
    eventId: string;
    source: string;
    eventType?: string | null;
    payload: Prisma.InputJsonValue;
    signature?: string | null;
}

export interface UpdateUserInput {
    email?: string;
    name?: string | null;
}

export async function muitosUsuarios(): Promise<User[]> {
    const resultado = await prisma.user.findMany();
    return resultado;
}

export async function acharUsuario(id: number): Promise<User | null> {
    const usuario = await prisma.user.findUnique({
        where: { id: id },
    });
    return usuario;
}

export async function criarUsuario(user: CreateUserInput): Promise<User> {
    const novoUsuario = await prisma.user.create({
        data: {
            email: user.email,
            name: user.name
        }
    });

    return novoUsuario;
}

export async function mudarUsuario(id: number, user: UpdateUserInput): Promise<User | null> {
    const resposta = await prisma.user.update({
        where: {
            id: id
        },
        data: {
            name: user.name,
            email: user.email
        }
    });

    return resposta;
}

export async function deletarUsuario(id: number): Promise<User | null> {
    const deletedUser = await prisma.user.delete({
        where: { id: id },
    });
    return deletedUser;
}

export async function registrarEvento(dados: CreateWebhookEventInput): Promise<'criado' | 'duplicado'> {
    try {
        await prisma.webhookEvent.create({
            data: {
                eventId: dados.eventId,
                source: dados.source,
                eventType: dados.eventType,
                payload: dados.payload,
                signature: dados.signature
            }
        });
        return 'criado';
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return 'duplicado'; // o banco garantiu a idempotência
        }
        throw e; // erro real de banco, não deve virar "duplicado"
    }
}