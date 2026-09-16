# Load Balance - laboratorio

Tres servidores Express, cada um com sua propria view, balanceados por nginx.

> **Sobre este repositorio**
>
> Todos os arquivos deste projeto foram gerados por I.A. (Claude Code). Eu so
> ajustei o necessario para ver o load balancer funcionando de verdade: subir
> os containers, conferir o rodizio entre os servidores e validar o resultado.
> Nao e codigo escrito por mim - e um laboratorio de estudo.
>
> Baseado no video:
> [Load Balancer - System Design](https://www.youtube.com/watch?v=hhy6EDDjy-o&list=PLNHxHgB-_LTusKqdWaZJtRbcqEMXPZXtw&index=5)

| Servico  | Nome       | Porta | View     |
|----------|------------|-------|----------|
| server-a | Servidor A | 3001  | verde    |
| server-b | Servidor B | 3002  | vermelha |
| server-c | Servidor C | 3003  | azul     |

Cada servidor responde em `GET /` com o header `X-Served-By`, que identifica
quem atendeu a requisicao.

## Rodando com Docker (recomendado)

Precisa so de Docker. Nada de Node ou nginx instalados na maquina.

```bash
docker compose up --build
```

Acesse http://localhost:8080 e de F5: a cor muda conforme o balanceador
escolhe o backend.

Para parar: `Ctrl+C`, ou `docker compose down` de outro terminal.

## Rodando na mao (sem Docker)

Um terminal por servidor:

```bash
cd server-a && npm install && npm start    # idem server-b e server-c
```

E o nginx da propria maquina, apontando para o `nginx.conf`:

```bash
nginx -c $(pwd)/nginx.conf -p $(pwd)            # iniciar
nginx -c $(pwd)/nginx.conf -p $(pwd) -s reload  # recarregar apos editar
nginx -c $(pwd)/nginx.conf -p $(pwd) -s stop    # parar
```

## Os dois arquivos de config

| Arquivo             | Usado por      | Upstream aponta para |
|---------------------|----------------|----------------------|
| `nginx.conf`        | nginx local    | `127.0.0.1:3001`     |
| `nginx.docker.conf` | docker compose | `server-a:3001`      |

O conteudo e o mesmo; muda so o endereco dos backends, porque dentro do
compose cada container e alcancado pelo nome do servico. **Ao mexer nos pesos
ou na estrategia, edite os dois** para nao testar coisas diferentes.

## Experimentos

Conte a distribuicao em vez de olhar a ordem das respostas:

```bash
for i in $(seq 50); do curl -s -D- -o /dev/null http://localhost:8080/ | grep X-Served-By; done | sort | uniq -c
```

- **Pesos**: `server server-a:3001 weight=3;` faz A receber 3 de cada 5.
  A ordem nao sai em bloco (`A A A B C`) porque o nginx usa *smooth weighted
  round robin*, que espalha as requisicoes do servidor pesado pelo ciclo.
- **Estrategias**: adicione `least_conn;` ou `ip_hash;` como primeira linha do
  bloco `upstream`.
- **Failover**: `docker compose stop server-b` e repita a contagem. O nginx
  tira B da roda sozinho.

No navegador o F5 as vezes gruda no mesmo servidor por causa do keep-alive da
conexao. O `curl` mostra o comportamento real.
