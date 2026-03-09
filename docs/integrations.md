# Integracoes (Fase 3)

Este documento reflete o estado atual da central de Integracoes do sistema.

## Permissoes e contexto

- A central de Integracoes exige perfil com gestao da organizacao (`OWNER` ou `ADMIN`).
- Sempre opere com organizacao selecionada no cabecalho.
- Para importacoes operacionais, selecione tambem um projeto especifico (nao usar `Todos`).

## Endpoints principais

### Catalogo de eventos

- `GET /integrations/catalog/events`

Retorna os eventos disponiveis para:
- escopo de token
- assinatura de Slack
- assinatura de webhooks de saida

### Tokens de API

- `GET /integrations/tokens`
- `POST /integrations/tokens`
- `DELETE /integrations/tokens/:tokenId`

Uso:
- emitir token por integracao externa (ERP, ETL, BI, parceiros)
- definir expiracao opcional
- definir escopos de eventos opcionais

### Webhooks de saida

- `GET /integrations/webhooks`
- `POST /integrations/webhooks`
- `PATCH /integrations/webhooks/:webhookId`
- `DELETE /integrations/webhooks/:webhookId`
- `POST /integrations/webhooks/:webhookId/test`
- `GET /integrations/webhooks/:webhookId/deliveries?limit=...`
- `POST /integrations/webhooks/:webhookId/deliveries/:deliveryId/retry`
- `POST /integrations/webhooks/:webhookId/deliveries/retry`

Uso:
- cadastrar URL destino para eventos da organizacao
- ativar/pausar webhook
- testar entrega
- consultar trilha de entregas (status, HTTP code, filtro por status/evento e ordenacao)
- reenviar manualmente entregas com falha (individual ou em lote filtrado)
- exportar trilha filtrada em CSV
- retry em lote aceita ate 50 `deliveryIds` por requisicao

Assinatura HMAC enviada em cada chamada de webhook:
- `X-Webhook-Event`: nome do evento
- `X-Webhook-Id`: request id do evento
- `X-Webhook-Signature`: legado (`sha256=<hmac(payload)>`)
- `X-Webhook-Signature-Alg`: `HMAC-SHA256`
- `X-Webhook-Signature-Version`: `v1`
- `X-Webhook-Signature-Timestamp`: epoch em segundos
- `X-Webhook-Signature-V1`: `t=<timestamp>,v1=<hmac(timestamp.payload)>`

Exemplo de validacao no destino (Node.js):

```ts
import crypto from "node:crypto";

const timestamp = req.header("X-Webhook-Signature-Timestamp");
const signatureHeader = req.header("X-Webhook-Signature-V1") ?? "";
const expected = crypto
  .createHmac("sha256", process.env.WEBHOOK_SECRET!)
  .update(`${timestamp}.${rawBody}`, "utf8")
  .digest("hex");

const informed = signatureHeader.split(",").find((part) => part.startsWith("v1="))?.replace("v1=", "");
if (!informed || informed !== expected) {
  return res.status(401).send("invalid signature");
}
```

### Inbound Kanban (upsert por referencia externa)

- `POST /integrations/inbound/kanban/task-upsert`

Requisitos:
- enviar `Authorization: Bearer <token>`
- token precisa pertencer a mesma organizacao
- payload deve conter `projectId`, `externalKey`, `title`

Exemplo:

```json
{
  "projectId": "PROJECT_ID",
  "externalKey": "EXT-123",
  "source": "ERP",
  "title": "Atualizar contrato",
  "description": "Gerado por sistema externo",
  "status": "Em andamento",
  "priority": "Alta",
  "startDate": "2026-03-04",
  "dueDate": "2026-03-07",
  "estimateHours": 8,
  "externalUrl": "https://sistema.externo/item/EXT-123"
}
```

Comportamento:
- cria card/tarefa na primeira chamada
- atualiza o mesmo registro quando `externalKey` + `source` ja existir

### Slack nativo

- `GET /integrations/slack`
- `PUT /integrations/slack`
- `POST /integrations/slack/test`

Uso:
- salvar webhook do Slack por organizacao
- escolher eventos que devem ser enviados
- disparar teste direto pela tela

### Google Calendar nativo (feed ICS)

- `GET /integrations/google-calendar`
- `PUT /integrations/google-calendar`
- `GET /integrations/google-calendar/feed/:accessToken`

Uso:
- vincular projeto
- escolher publicacao de tarefas e/ou marcos
- regenerar feed quando necessario

## Central de importacoes

Endpoints usados pela tela:
- `POST /wbs/import?projectId=...`
- `POST /service-catalog/import?projectId=...`
- `POST /integrations/imports/trello?projectId=...`
- `POST /integrations/imports/jira?projectId=...`
- `GET /integrations/import-jobs?limit=12`

Arquivos aceitos:
- EAP: `.xlsx`, `.xls`
- Catalogo de servicos: `.xlsx`, `.xls`
- Trello: `.json`
- Jira: `.csv`, `.xlsx`, `.xls`

## Boas praticas operacionais

- Use um token por sistema externo.
- Restrinja escopos ao minimo necessario.
- Teste webhook antes de ativar em producao.
- Monitore entregas com erro e reprocesse no sistema de origem quando preciso.
- Em importacoes, valide arquivo em ambiente de homologacao antes do uso produtivo.

## Proximos incrementos sugeridos

- Assinatura HMAC padrao para webhooks custom.
- Retry assíncrono em lote pelo backend (evitar fan-out no front).
- Dashboard de saude de integracoes por organizacao.
- Alertas proativos para aumento de falha por webhook.
