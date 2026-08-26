# Notion Financial Status

Aplicación Angular para el control y análisis de finanzas personales sincronizada en tiempo real con Notion.

## 🚀 Despliegue en Docker / ZimaOS

### Opción 1: Docker CLI / ZimaOS Custom App

```bash
docker run -d \
  --name financial-status \
  --restart unless-stopped \
  -p 8080:8080 \
  pablomarzoa/notion-financial-status:latest
```

### Opción 2: Docker Compose

```yaml
version: '3.8'

services:
  financial-status:
    image: pablomarzoa/notion-financial-status:latest
    container_name: financial-status
    restart: unless-stopped
    ports:
      - "8080:8080"
```

Accede desde tu navegador en tu red local: `http://<IP_DE_TU_ZIMAOS>:8080`

---

## 🛠️ Publicar a Docker Hub

### Automático con GitHub Actions
1. En tu repositorio GitHub ([notion-financial-status](https://github.com/PabloMarzoa/notion-financial-status)), ve a **Settings > Secrets and variables > Actions**.
2. Añade dos secrets:
   - `DOCKERHUB_USERNAME`: Tu usuario de Docker Hub (ej. `pablomarzoa`).
   - `DOCKERHUB_TOKEN`: Tu Access Token de Docker Hub (generado en Docker Hub > Account Settings > Security > New Access Token).
3. Cada `git push` a `master` construirá y publicará automáticamente la imagen multiplataforma (`linux/amd64` y `linux/arm64`).

### Manual desde tu máquina
```bash
docker login
docker build -t <tu_usuario>/notion-financial-status:latest .
docker push <tu_usuario>/notion-financial-status:latest
```
