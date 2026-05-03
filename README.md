# PromoBot — Sendnotification

Bot Java/Spring Boot que monitora produtos da Amazon Brasil, detecta quedas reais de preço, gera mensagens promocionais com IA e divulga em canais do Telegram.

Inclui um **broadcaster rotativo** que envia 1 produto a cada 15 minutos para manter o canal ativo, e um **detector de promoção real** que roda a cada 30 minutos comparando preço atual contra histórico.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Banco de dados](#banco-de-dados)
- [Build e execução local](#build-e-execução-local)
- [Execução com Docker](#execução-com-docker)
- [Painel web](#painel-web)
- [Endpoints REST](#endpoints-rest)
- [Schedulers](#schedulers)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Frontend React (opcional)](#frontend-react-opcional)
- [Roadmap](#roadmap)
- [Licença](#licença)

---

## Funcionalidades

- ✅ Monitoramento de produtos da Amazon Brasil por **ASIN**
- ✅ Histórico de preços em PostgreSQL
- ✅ Detecção automática de queda de preço acima de um limite por produto
- ✅ Geração de mensagens promocionais com **Google Gemini** (com fallback estático)
- ✅ Envio para múltiplos canais Telegram (foto + caption)
- ✅ Broadcaster rotativo: 1 produto a cada 15 min, escolhido pelo `lastNotifiedAt` mais antigo
- ✅ Painel web (single-page Bootstrap) com dashboard, gerenciamento de produtos/canais, viewer de logs
- ✅ Endpoint manual `Executar Agora` e `Enviar Próximo`
- ✅ Health check via Spring Actuator
- ✅ Timezone fixo em **America/Sao_Paulo** (JVM, Jackson, Hibernate e Docker)
- ✅ Logs em memória (últimas 200 linhas) acessíveis via API e UI

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                         PromoBot (Spring Boot 3 + Java 21)       │
│                                                                  │
│  ┌────────────────┐   ┌────────────────────┐   ┌──────────────┐  │
│  │ Scheduler 30m  │   │ Broadcaster 15m    │   │  REST API    │  │
│  │ (detector real)│   │ (rotação fixa)     │   │ /api/...     │  │
│  └───────┬────────┘   └─────────┬──────────┘   └──────┬───────┘  │
│          │                      │                     │          │
│          ▼                      ▼                     ▼          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Amazon Scraper (Jsoup)  │  Gemini API  │  Telegram API  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────────┐                      │
│                    │ PostgreSQL (JPA)     │                      │
│                    │ products / channels  │                      │
│                    │ price_history        │                      │
│                    │ promotions / notif.  │                      │
│                    └──────────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Camada            | Tecnologia                                  |
|-------------------|---------------------------------------------|
| Linguagem         | Java 21 (LTS)                               |
| Framework         | Spring Boot 3.3.5                           |
| Persistência      | Spring Data JPA + Hibernate                 |
| Banco             | PostgreSQL 14+                              |
| Build             | Maven 3.9                                   |
| Scraping          | Jsoup                                       |
| HTTP client       | Spring `RestClient`                         |
| IA                | Google Gemini (`gemini-1.5-flash`)          |
| Notificações      | Telegram Bot API                            |
| Frontend          | HTML + Bootstrap 5 (single-page) ou React   |
| Container         | Docker (multi-stage build)                  |
| Boilerplate       | Lombok                                      |

---

## Pré-requisitos

- **JDK 21+**
- **Maven 3.9+**
- **PostgreSQL 14+** (local ou remoto)
- **Bot Telegram** criado via [@BotFather](https://t.me/BotFather)
- **API key Gemini** em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free tier)
- **Tag de Associado Amazon** (para gerar links afiliados)
- (Opcional) **Docker 24+** para executar em container

---

## Configuração

1. Copie o template de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Edite `.env` com seus valores reais. **Nunca** commite esse arquivo (já está no `.gitignore`).
3. Variáveis exigidas:

| Variável                  | Obrigatória | Descrição                                        |
|---------------------------|-------------|--------------------------------------------------|
| `TELEGRAM_BOT_TOKEN`      | ✅          | Token do BotFather                               |
| `TELEGRAM_CHAT_ID`        | ✅          | ID do canal/grupo (negativo para grupos)         |
| `GEMINI_API_KEY`          | ✅          | API key do Google AI Studio                      |
| `GROQ_API_KEY`            | ⚪          | Backup de IA (opcional)                          |
| `AMAZON_ASSOCIATE_TAG`    | ✅          | Sua tag de afiliado Amazon                       |
| `DB_URL`                  | ✅          | JDBC URL do PostgreSQL                           |
| `DB_USERNAME`             | ✅          | Usuário do banco                                 |
| `DB_PASSWORD`             | ✅          | Senha do banco                                   |

---

## Banco de dados

Crie o banco e aplique o schema:

```sql
CREATE DATABASE promobot;

\c promobot

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  asin VARCHAR(10) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  niche VARCHAR(50),
  target_discount_pct NUMERIC(5,2) DEFAULT 10,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_notified_at TIMESTAMP
);

CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  captured_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE promotions (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  current_price NUMERIC(10,2) NOT NULL,
  previous_price NUMERIC(10,2) NOT NULL,
  discount_pct NUMERIC(5,2) NOT NULL,
  detected_at TIMESTAMP DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE
);

CREATE TABLE channels (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  promotion_id BIGINT REFERENCES promotions(id) ON DELETE CASCADE,
  channel_id BIGINT REFERENCES channels(id) ON DELETE CASCADE,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

---

## Build e execução local

```bash
# 1. Configure o .env (ver acima)

# 2. Build
mvn clean package -DskipTests

# 3. Execução (carregando .env)
export $(grep -v '^#' .env | xargs)
java -jar target/promobot-1.0.0-SNAPSHOT.jar

# Ou, em uma linha (Linux/Mac):
( set -a; source .env; set +a; java -jar target/promobot-1.0.0-SNAPSHOT.jar )
```

App sobe em `http://localhost:8080`.

---

## Execução com Docker

```bash
# Build da imagem (multi-stage: maven build + jre runtime)
docker build -t promobot:latest .

# Run com env-file e timezone Brasil
docker run -d \
  --name promobot \
  --restart always \
  --env-file .env \
  -e TZ=America/Sao_Paulo \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 8080:8080 \
  promobot:latest

# Verificar
docker logs -f promobot
curl http://localhost:8080/actuator/health
```

---

## Painel web

Acesse `http://localhost:8080/` para o dashboard. Abas disponíveis:

- **Dashboard** — KPIs, último/próximo ciclo, uptime, últimas promoções
- **Produtos** — listagem, adicionar/remover/ativar, botões `Executar Agora` e `Enviar Próximo`
- **Promoções** — histórico das últimas 20 promoções detectadas
- **Canais** — gerenciamento dos chats Telegram
- **Logs** — stream das últimas 200 linhas com filtro por nível e auto-refresh

---

## Endpoints REST

| Método | Path                                | Descrição                                     |
|--------|-------------------------------------|-----------------------------------------------|
| GET    | `/api/dashboard`                    | KPIs agregados                                |
| GET    | `/api/products`                     | Lista produtos                                |
| POST   | `/api/products`                     | Cria produto                                  |
| PATCH  | `/api/products/{id}/toggle`         | Ativa/desativa                                |
| DELETE | `/api/products/{id}`                | Remove produto                                |
| POST   | `/api/products/run-now`             | Dispara ciclo de detecção manualmente         |
| GET    | `/api/promotions`                   | Últimas promoções                             |
| GET    | `/api/channels`                     | Lista canais                                  |
| POST   | `/api/channels`                     | Cria canal                                    |
| PATCH  | `/api/channels/{id}/toggle`         | Ativa/desativa canal                          |
| DELETE | `/api/channels/{id}`                | Remove canal                                  |
| GET    | `/api/logs?limit=200`               | Últimas linhas de log em memória              |
| POST   | `/api/test/notify/{productId}`      | Envia notificação de teste                    |
| POST   | `/api/test/broadcast-next`          | Dispara o broadcaster rotativo manualmente    |
| GET    | `/actuator/health`                  | Health check Spring                           |

---

## Schedulers

| Componente             | Cron                  | Função                                                     |
|------------------------|-----------------------|------------------------------------------------------------|
| `PromotionScheduler`   | `0 0/30 * * * ?`      | Detector real: compara preço atual vs histórico            |
| `BroadcastScheduler`   | `0 0/15 * * * ?`      | Broadcaster: envia 1 produto da rotação para o Telegram    |

Ambos respeitam timezone `America/Sao_Paulo` (configurado via `@Scheduled(zone=...)`).

Para desabilitar, use:
```properties
promobot.scheduler.enabled=false
promobot.broadcaster.enabled=false
```

---

## Estrutura do projeto

```
promobot/
├── src/main/java/com/promobot/
│   ├── App.java
│   ├── controller/         # ProductController, ChannelController, DashboardController, ...
│   ├── dto/                # DTOs de request/response
│   ├── entity/             # Product, PriceHistory, Promotion, Channel, Notification
│   ├── repository/         # Repositórios Spring Data JPA
│   ├── scheduler/          # PromotionScheduler, BroadcastScheduler
│   ├── service/            # PromotionDetectorService, ProductBroadcasterService,
│   │                       # AmazonScraperService, GeminiService, TelegramService
│   └── config/             # Beans, RestClient, etc.
├── src/main/resources/
│   ├── application.properties
│   └── static/index.html   # Painel single-page Bootstrap
├── frontend/               # (opcional) Painel React + Vite + TS + Tailwind
├── Dockerfile              # Multi-stage build
├── Dockerfile.runtime      # Apenas runtime (usa jar pré-compilado)
├── pom.xml
├── .env.example
└── README.md
```

---

## Frontend React (opcional)

Existe um painel alternativo em React + Vite + TypeScript + TailwindCSS na pasta `frontend/`. Ele consome a mesma API REST do Spring.

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173 (proxy para localhost:8080)
npm run build  # gera dist/ pronto para deploy estático ou Nginx
```

O painel Bootstrap servido pelo Spring continua funcionando como fallback.

---

## Roadmap

- [ ] Autenticação no painel (Spring Security + JWT)
- [ ] Métricas Prometheus + Grafana dashboard
- [ ] Suporte a outras lojas (Mercado Livre, Magalu)
- [ ] Encurtador de URL próprio
- [ ] Webhook recebendo updates do Telegram (responder comandos)
- [ ] Encoding UTF-8 robusto no scraper (corrigir `Ã¡` em alguns títulos)

---

## Licença

MIT — veja [LICENSE](LICENSE).

---

**Aviso**: este projeto faz scraping da Amazon e usa a Telegram Bot API. Respeite o `robots.txt`, os termos de uso de cada serviço e o programa de Associados da Amazon do seu país.
