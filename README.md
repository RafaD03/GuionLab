# 🎬 GuionLab Studio

> **Suite integral y profesional para guionistas.**  
> Diseñada para escribir historias de cine y televisión con formato estándar de la industria, desde la primera chispa creativa hasta el guion literario final y el dossier de venta.

---

## ✨ Características principales

### 1. 💡 Desarrollo dramático y conceptual
* **Portada profesional**: Título, autor/a o equipo de guion, género, tono, datos de contacto y registro de versión.
* **Tagline y Sinopsis completa**: Vende tu historia en una frase de impacto y desarrolla el argumento completo (planteamiento, nudo, giro dramático y resolución).
* **Plantillas de estructura narrativa**: Elige entre el **Save the Cat! / Beat Sheet (15 pasos de Blake Snyder)**, la **Estructura clásica en 3 Actos** o el **Círculo de la historia de Dan Harmon (8 pasos)**.
* **Cuaderno de notas creativas**: Espacio dedicado para ideas sueltas, referencias visuales, investigación y apuntes de desarrollo.

### 2. 🌍 Construcción de mundo (*Worldbuilding*)
* **Lógica del mundo**: Plantillas guiadas según tu género:
  * **Modo Fantasía / Ciencia Ficción / Épico**: Geografía, sociedad, política, economía, magia/reglas y tecnología.
  * **Modo Realista / Contemporáneo**: Marco temporal, contexto sociopolítico, atmósfera, códigos del entorno e instituciones.
* **Construcción libre del mundo**: Área abierta para volcar información a granel, cronologías, mitología o mapas sin preguntas prefijadas.
* **Fichas tridimensionales de personajes**:
  * Rol dramático (Protagonista, Antagonista, Secundario, Mentor, etc.), edad, género y fotografía/avatar.
  * Psicología, herida dramática, necesidad interna vs. deseo externo, voz y filosofía de vida.
  * Sistema de relaciones dinámicas entre personajes (amistad, rivalidad, familia, alianza...).
  * Dreamcast sugerido de actores/actrices.
  * **Construcción libre de personajes**: Espacio libre para monólogos, trasfondo o biografías extensas.
* **Catálogo de localizaciones**: Registro de escenarios (`INT.`, `EXT.`, `INT./EXT.`) con notas visuales y descripción de atmósfera.

### 3. ✍️ Escritura y formato cinematográfico
* **Escaleta dinámica**: Tarjetas de escenas numeradas y reordenables mediante arrastrar y soltar (*drag & drop*) o flechas de dirección.
* **Tratamiento en prosa**: Redacción completa de la historia en presente, con conversión automática de la escaleta en esqueleto base.
* **Editor de Guion Literario profesional**:
  * Tipografía estándar **Courier Prime 12pt** y márgenes precisos de la industria cinematográfica (Hollywood standard).
  * Tipado ágil por bloques: **Encabezado de Escena**, **Acción**, **Personaje**, **Diálogo**, **Acotación (Parenthetical)** y **Transición**.
  * Navegación por teclado ultra rápida: ciclo con <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd>, creación automática de diálogo con <kbd>Enter</kbd> tras personaje, y atajos numéricos <kbd>Ctrl + 1</kbd> a <kbd>6</kbd>.
  * **Panel lateral de referencia**: Consulta en vivo a tus personajes, localizaciones o escaleta en pantalla dividida mientras escribes el guion.
  * **Modo concentración a pantalla completa** (<kbd>F11</kbd>): Entorno limpio estilo máquina de escribir para escribir sin distracciones.

### 4. 👥 Modo colaborativo a 4 manos
* Compatible con **Google Drive**, **Microsoft OneDrive** y **Dropbox**.
* Detección automática de cambios externos en tiempo real: cuando tu compañero guarda, GuionLab te avisa y te permite recargar al instante sin pisar trabajo ni perder datos.
* Respaldo preventivo automático en cada recarga compartida.

### 5. 📋 Dossier, Versiones y Exportación PDF
* **Exportación PDF profesional**:
  * **Solo Guion Literario**: Con portada reglamentaria, numeración de páginas en esquina superior derecha y proporciones de impresión exactas A4 sin fondos oscuros.
  * **Dossier de Venta Completo**: Unifica sinopsis, mundo, personajes con fotos, localizaciones, escaleta y tratamiento para presentar a productoras o concursos.
* **Historial de versiones**: Guarda instantáneas de respaldo antes de hacer cambios importantes y restáuralas en cualquier momento.

---

## 💻 Atajos de teclado esenciales

| Atajo | Acción |
|---|---|
| <kbd>Ctrl + S</kbd> | Guardar cambios en el archivo `.guion` |
| <kbd>Ctrl + Shift + S</kbd> | Guardar como… |
| <kbd>Ctrl + N</kbd> | Nuevo proyecto (individual o colaborativo) |
| <kbd>Ctrl + O</kbd> | Abrir archivo `.guion` o `.json` |
| <kbd>Ctrl + Shift + H</kbd> | Ir a la pantalla de «Mis proyectos» |
| <kbd>Ctrl + Shift + P</kbd> | Exportar Guion Literario en PDF |
| <kbd>Ctrl + P</kbd> | Exportar Dossier de Venta en PDF |
| <kbd>F11</kbd> | Alternar modo pantalla completa en el guion |
| <kbd>F1</kbd> | Abrir guía y ayuda de GuionLab |
| <kbd>Tab</kbd> | Ciclar tipo de bloque en el guion |
| <kbd>Ctrl + 1..6</kbd> | Asignar tipo directo: Escena, Acción, Personaje, Diálogo, Acotación, Transición |

---

## 🛠️ Instalación y Compilación desde el código fuente

### Requisitos previos
* [Node.js](https://nodejs.org) (versión 18 LTS o superior recomendada).
* Git instalado en el sistema.

### 1. Clonar el repositorio
```bash
git clone https://github.com/RafaD03/GuionLab.git
cd GuionLab
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Ejecutar en modo desarrollo
```bash
npm start
```

---

## 📦 Compilación de instaladores por plataforma

### 🪟 Windows (.exe)
```bash
npm run dist:win
```
Generará el instalador autoejecutable NSIS en: `dist/GuionLab Setup 1.6.5.exe`.

### 🐧 Linux (.deb y universal .tar.gz)
```bash
npm run dist:linux
```
Generará:
* Paquete para Debian/Ubuntu/Mint: `dist/GuionLab_1.6.5_amd64.deb`
* Paquete universal portable con script de instalación: `dist/GuionLab-v1.6.5-Linux.tar.gz`

### 🍎 macOS (.zip / .dmg)
En ordenadores Mac, haz doble clic en `Iniciar-GuionLab-Mac.command` o ejecuta:
```bash
npm run dist:mac
```
Generará el paquete instalador `.dmg` para macOS (compatible con Apple Silicon e Intel).

---

## 📄 Formato de archivo

Los proyectos se guardan en formato estándar abierto `.guion` (estructura JSON legible y portátil). Cada archivo contiene de forma íntegra todo el guion, personajes, mundo, escaleta y versiones, permitiendo compartirlo o moverlo libremente sin dependencias externas.

---

## 👤 Autor

Desarrollado con pasión por **Rafael Dobón Romo**  
* Guion cinematográfico, diseño de herramientas para creativos y desarrollo de software.  
* Contacto: [rafadobonromo@gmail.com](mailto:rafadobonromo@gmail.com)
* Repositorio: [https://github.com/RafaD03/GuionLab](https://github.com/RafaD03/GuionLab)
