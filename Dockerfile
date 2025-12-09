# ---- base image ----
FROM node:20-alpine

# create app dir
WORKDIR /app

# install deps (use package*.json copy for layer cache)
COPY package*.json ./
RUN npm ci

# copy source
COPY src ./src

# expose app port
EXPOSE 4000

# default cmd (prod-ish)
CMD ["node", "src/app.js"]
