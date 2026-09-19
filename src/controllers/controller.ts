import { processandoUsuarios, criandoUsuario, deletandoUsuario, mudandoUsuario, achandoUsuario, verificarAssinatura, registrarWebhook } from "../services/service";
import { Request, Response } from 'express';

export async function usuarios(req: Request, res: Response): Promise<Response> {
    const valor = await processandoUsuarios();
    return res.status(200).json({ mensagem: "usuarios", dados: valor });
}

export async function criar(req: Request, res: Response): Promise<Response> {
    const { email, name } = req.body;
    if (!email) {
        return res.status(400).json({ erro: "Email é obrigatório" });
    }
    const valor = await criandoUsuario({ email, name });
    return res.status(201).json({ mensagem: "Usuário criado com sucesso", dados: valor });
}

export async function acharUm(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }
    const valor = await achandoUsuario(id);
    if (!valor) {
        return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }
    return res.status(200).json({ mensagem: "usuario", dados: valor });
}

export async function mudar(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }
    const valor = await mudandoUsuario(id, req.body);
    return res.status(200).json({ mensagem: "Usuário alterado com sucesso", dados: valor });
}

export async function deletar(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }
    await deletandoUsuario(id);
    return res.status(200).json({ mensagem: "Usuário deletado com sucesso" });
}

export async function webhook(req: Request, res: Response): Promise<Response> {
    try {
        const assinatura = req.headers['x-signature'];
        const eventId = req.headers['x-event-id'];

        if (typeof assinatura !== 'string' || typeof eventId !== 'string') {
            return res.status(400).json({ erro: "Headers x-signature e x-event-id são obrigatórios" });
        }

        if (!req.rawBody) {
            return res.status(400).json({ erro: "Corpo da requisição ausente ou inválido" });
        }

        if (!verificarAssinatura(req.rawBody, assinatura)) {
            return res.status(401).json({ erro: "Assinatura inválida" });
        }

        const resultado = await registrarWebhook({
            eventId,
            source: 'generic',
            payload: req.body,
            signature: assinatura
        });

        if (resultado === 'duplicado') {
            return res.status(200).json({ mensagem: "Evento duplicado, ignorado" });
        }

        return res.status(200).json({ mensagem: "Evento recebido" });
    } catch (erro) {
        return res.status(500).json({ mensagem: "Erro interno do servidor" });
    }
}