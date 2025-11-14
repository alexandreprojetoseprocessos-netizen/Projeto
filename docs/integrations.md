# Integrações (Block 4)

## Slack

1. Crie um **Incoming Webhook** (Slack → Apps → Incoming Webhooks → Add new).  
2. Copie a URL e defina `SLACK_WEBHOOK_URL` no `.env`.  
3. Teste com `POST /integrations/slack/test` (usa o webhook configurado).  
   - `curl -X POST http://localhost:4000/integrations/slack/test`.
4. Comentários e apontamentos de horas (rotas `/wbs/:id/comments` e `/wbs/:id/time-entries`) disparam mensagens automáticas se o webhook estiver configurado.

## GitHub Webhooks

1. Defina `GITHUB_WEBHOOK_SECRET` (string aleatória) no `.env`.  
2. Em um repositório GitHub → Settings → Webhooks → Add:
   - Payload URL: `https://<sua-api>/integrations/github/webhook`
   - Content-Type: `application/json`
   - Secret: **mesmo valor** de `GITHUB_WEBHOOK_SECRET`
3. O endpoint valida `x-hub-signature-256` usando o corpo bruto (`req.rawBody`) e registra o evento no log (`logger.info`).  
   - Expanda o handler para acionar automações (ex.: criar tarefa quando receber `pull_request`).

## Webhooks genéricos

`POST /integrations/webhooks/:event` aceita qualquer payload e responde 202. Útil para integrar Zapier/Make com eventos simples (`curl -X POST .../webhooks/task.updated -d '{...}'`).  

## Próximos passos

- Implementar notificações direcionadas (filter por projectId ou canal Slack específico).  
- Adicionar assinatura HMAC própria para `/integrations/webhooks/:event`.  
- Automatizar criação de comentários/time entries com eventos GitHub (ex.: `smart commits`).  
