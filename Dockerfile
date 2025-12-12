FROM node:latest

WORKDIR /usr/src/app

# Kopiuj pliki package.json, package-lock.json i .npmrc
COPY package*.json ./
COPY .npmrc ./

# Instaluj zależności
RUN npm install -g @nestjs/cli
RUN npm install

# Kopiuj resztę plików aplikacji
COPY . .

# Expose port
EXPOSE 3000

# Domyślne polecenie (może być nadpisane w docker-compose)
CMD ["npm", "run", "start:dev"]



