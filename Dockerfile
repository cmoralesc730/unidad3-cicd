# =============================================================================
#  Imagen de producción del servicio.
#
#  Build en dos etapas para que la imagen final contenga únicamente el JavaScript
#  compilado y las dependencias de ejecución: el código TypeScript, las pruebas y
#  el compilador se quedan en la etapa `compilacion` y nunca llegan al registro.
#
#  Base `node:22-alpine`: Node 22 es la versión LTS activa, y Alpine reduce tanto
#  el tamaño como la superficie de ataque frente a la imagen basada en Debian.
# =============================================================================

# -----------------------------------------------------------------------------
# Etapa 1 — compilación
# -----------------------------------------------------------------------------
FROM node:22-alpine AS compilacion

WORKDIR /app

# Copiar primero los manifiestos permite a Docker cachear la instalación: mientras
# package.json y package-lock.json no cambien, no hay que reinstalar nada.
COPY package*.json ./

# `npm ci` instala exactamente lo fijado en el lockfile y falla si este está
# desincronizado con package.json. Eso hace el build reproducible.
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

# Se eliminan las dependencias de desarrollo para poder copiar el árbol de
# node_modules tal cual a la etapa final, sin arrastrar TypeScript, ESLint ni Jest.
RUN npm prune --omit=dev

# -----------------------------------------------------------------------------
# Etapa 2 — ejecución
# -----------------------------------------------------------------------------
FROM node:22-alpine AS ejecucion

# `dumb-init` actúa como PID 1 y reenvía las señales al proceso de Node. Sin él,
# el SIGTERM que envía la plataforma al reemplazar una tarea no llegaría a la
# aplicación, y el contenedor sería terminado a la fuerza al agotarse el plazo,
# cortando las peticiones en curso.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# `--chown` en el COPY evita una capa extra solo para cambiar permisos.
COPY --from=compilacion --chown=node:node /app/node_modules ./node_modules
COPY --from=compilacion --chown=node:node /app/dist ./dist
COPY --from=compilacion --chown=node:node /app/package.json ./package.json

# A partir de aquí el proceso NO corre como root.
USER node

EXPOSE 3000

# Comprobación a nivel de imagen, útil para `docker ps` en local. En AWS, la sonda
# autoritativa es la del balanceador, configurada en la infraestructura.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/salud',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
