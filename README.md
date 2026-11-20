# EDU-CRB | Laboratorio de inteligencia artificial

**Hecho con IA**, con asistencia de inteligencia artificial para el diseño, el código y la documentación.

EDU-CRB es un laboratorio educativo en español que explica cómo un modelo de lenguaje pasa de una frase a una respuesta. Está vinculado a [Cerebro](https://github.com/Dirix24/cerebro), un proyecto experimental de inteligencia artificial local en Python.

## Explora el laboratorio

- **Generación de texto** con el Transformer y los pesos incluidos, en JavaScript. Permite elegir una pregunta o escribir una propia y cambiar temperatura, Top‑K, Top‑P, repetición, velocidad, longitud y semilla. Las preguntas incluidas se ajustan mejor al pequeño corpus de la demo.
- **Recorrido guiado** con diagrama interactivo, tokenizador BPE, matriz de atención por capa y cabeza y candidatos para el siguiente token.
- **Prácticas** con una neurona ReLU, un modelo lineal entrenable mediante descenso de gradiente y un mapa ilustrativo de embeddings.
- **Quince lecciones** de nivel principiante, intermedio y avanzado, con tres cuestionarios y progreso local.

La inferencia y el entrenamiento lineal se ejecutan en el navegador. El diagrama animado esquematiza el flujo de información. El mapa de embeddings usa vectores ilustrativos. La preferencia de tema y el progreso se guardan en el navegador cuando hay almacenamiento local disponible.

## Ejecutar localmente

La web usa HTML, CSS, JavaScript y SVG. Abre `index.html` o sirve el repositorio desde su raíz.

```bash
python3 -m http.server 8000
```

Abre [localhost:8000](http://localhost:8000/). Para renovar los pesos con un checkpoint compatible, instala NumPy y ejecuta `python3 exportar_web.py ruta/a/best.npz` desde esta carpeta. El exportador actualiza los datos incluidos en `index.html`.

## GitHub Pages

En **Settings → Pages**, elige **Deploy from a branch** y selecciona `main` y `/ (root)`. La web usa rutas relativas para que funcione en el subdirectorio del repositorio. Conserva `.nojekyll` en la raíz.

[Vista publicada](https://dirix24.github.io/EDU-CRB/) · [Repositorio EDU-CRB](https://github.com/Dirix24/EDU-CRB)

## Estado, contribuciones y licencia

EDU-CRB y Cerebro son proyectos experimentales. Puedes informar de errores o proponer mejoras mediante una incidencia o un pull request. Los repositorios son públicos. En las revisiones consultadas no figura un archivo de licencia y queda pendiente explicitar las condiciones de reutilización.
