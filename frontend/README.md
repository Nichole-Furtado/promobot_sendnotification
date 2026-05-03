# PromoBot Frontend (React + Vite + TypeScript + Tailwind)

Painel alternativo em React que consome a API REST do backend Spring Boot.

## Requisitos
- Node 20+
- Backend Spring rodando em `http://localhost:8080`

## Instalação e dev
```bash
npm install
npm run dev
```
Acesse `http://localhost:5173`. O Vite faz proxy de `/api` e `/actuator` para o backend.

## Build
```bash
npm run build
```
Saída em `dist/` — sirva via Nginx, ou copie para `../src/main/resources/static/` se quiser empacotar junto do JAR.

## Stack
- React 18 + TypeScript
- Vite 5
- TailwindCSS 3
- React Router 6
- Axios + react-hot-toast + lucide-react
