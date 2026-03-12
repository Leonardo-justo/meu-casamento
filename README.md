<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Site de casamento - execução local

Este projeto contém frontend (React + Vite) e backend (Express) no mesmo app.

## Run Locally

**Prerequisites:** Node.js


1. Install dependencies:
   `npm install`
2. Copie `.env.example` para `.env.local` e ajuste as variáveis de pagamento
3. Run the app:
   `npm run dev`

## Funcionalidades principais

- RSVP com mensagem para os noivos.
- Lista de presentes com pedido e integração de pagamento.
- Dashboard admin para RSVPs, presentes e galeria.
- Galeria pública de fotos com ordenação.
- Pasta local para fotos em `public/fotos/`.

## Configuração de pagamento (InfinitePay)

- Defina `PAYMENT_MODE="infinitepay"` para ativar o gateway real.
- Configure `INFINITEPAY_API_TOKEN` e `INFINITEPAY_WEBHOOK_SECRET`.
- Em desenvolvimento, você pode usar:
  - `PAYMENT_MODE="mock"` para fluxo de teste local.
  - `PAYMENT_MODE="pix_manual"` para exibir link/chave PIX manual.

## Publicar no GitHub Pages (frontend)

Este repositório já está preparado para publicar no Pages.

1. Suba o código para o GitHub (branch `main`).
2. No GitHub, vá em `Settings` -> `Pages`.
3. Em `Source`, selecione `GitHub Actions`.
4. O workflow `Deploy GitHub Pages` será executado automaticamente a cada push no `main`.
5. O link ficará em:
   - `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`

Observação importante:
- No GitHub Pages funciona a interface, RSVP e leitura de dados do Firebase.
- Pagamento (`/api/payments/*`) exige backend Node e não funciona no Pages.
