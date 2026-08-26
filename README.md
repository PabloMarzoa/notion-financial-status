# Notion Financial Status

Aplicación Angular para el control y análisis de finanzas personales sincronizada en tiempo real con Notion.

---

## ⚙️ Configuración con tu propia Base de Datos de Notion

Si estás viendo la aplicación en **Modo Demo**, sigue estos pasos para conectarla a tu Notion:

### 1. Crear una integración en Notion
1. Ve a [Notion Developers - My Integrations](https://www.notion.so/profile/integrations).
2. Crea una nueva integración (por ejemplo, `Control Finanzas`).
3. Copia el **Internal Integration Secret (API Token)** que empieza por `secret_...` o `ntn_...`.

### 2. Preparar tu Base de Datos en Notion
Crea una base de datos en Notion con las siguientes propiedades (o nombres equivalentes):
- **`Descripción`** (o `Name`): Tipo **Title** (Texto principal).
- **`Cantidad`** (o `Importe`): Tipo **Number** (o Rich Text).
- **`Tipo`**: Tipo **Select** con opciones: `Gasto único`, `Gasto recurrente`, `Ingreso`.
- **`Categoría`**: Tipo **Select** o **Multi-select** (ej: `Comida`, `Piso`, `Amazon`, `Gasolina`, `Ocio`, `Nómina`, etc.).
- **`Fecha`**: Tipo **Date** (formato fecha).

### 3. Conectar la integración a tu Base de Datos
1. Abre tu base de datos en Notion en tu navegador o app.
2. Haz clic en los tres puntos `...` de la esquina superior derecha > **Connections / Conexiones**.
3. Añade tu integración creada en el paso 1.
4. Copia el **Database ID** de la URL de tu base de datos (los 32 caracteres alfanuméricos después de tu workspace y antes del signo `?`).

### 4. Configurar la App
1. Abre la app en tu navegador.
2. Haz clic en el botón **Configurar Notion** en la barra superior.
3. Introduce tu **API Token** y tu **Database ID**.
4. ¡Listo! Tus movimientos se cargarán y sincronizarán automáticamente.

---

## 🚀 Despliegue en Docker / ZimaOS

### Opción 1: Docker CLI / ZimaOS Custom App

```bash
docker run -d \
  --name financial-status \
  --restart unless-stopped \
  -p 9090:8080 \
  pmarzoa/notion-financial-status:latest
```

### Opción 2: Docker Compose

```yaml
version: '3.8'

services:
  financial-status:
    image: pmarzoa/notion-financial-status:latest
    container_name: financial-status
    restart: unless-stopped
    ports:
      - "9090:8080"
```

Accede desde tu navegador en tu red local: `http://<IP_DE_TU_ZIMAOS>:9090`

---

## 🛠️ Publicar a Docker Hub

### Automático con GitHub Actions
1. En tu repositorio GitHub ([notion-financial-status](https://github.com/PabloMarzoa/notion-financial-status)), ve a **Settings > Secrets and variables > Actions**.
2. Añade dos secrets:
   - `DOCKERHUB_USERNAME`: Tu usuario de Docker Hub (`pmarzoa`).
   - `DOCKERHUB_TOKEN`: Tu Access Token de Docker Hub.
3. Cada `git push` a `master` construirá y publicará automáticamente la imagen multiplataforma (`linux/amd64` y `linux/arm64`).

### Manual desde tu máquina
```bash
docker login
docker build -t pmarzoa/notion-financial-status:latest .
docker push pmarzoa/notion-financial-status:latest
```
