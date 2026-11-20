# Maruvas

Site institucional da Maruvas, a marca que reúne o Marudesk e a MaruPages.

- `public/` é tudo o que vai ao ar (HTML, CSS, JS e imagens, sem build).
- `wrangler.jsonc` publica a pasta como um Cloudflare Worker de arquivos estáticos chamado `grupomaruvas`.

## Rodar localmente

    npx wrangler dev

## Publicar

    npx wrangler deploy

Ou conecte este repositório em Workers & Pages → Create → Import a repository, com o comando de deploy `npx wrangler deploy`. Cada push na `main` publica sozinho.
