# CodeRank WEB UI

Frontend Angular para la plataforma de assessments (recruiter + candidate), consumiendo el backend Node/Express/Prisma en `http://localhost:3000/api` (Swagger vivo en `/api-docs`, se autodocumenta con el tráfico real).

## Stack

- Angular 21 — standalone components, sin NgModules, routing con `loadComponent` (lazy) y `withComponentInputBinding()` (los `:param` de ruta llegan como `input()` directo al componente).
- Angular Material 21 (tema M3, `azure-blue`) + Angular CDK.
- `ngx-monaco-editor-v2` para el editor de código de las preguntas `CODE`.
- RxJS + signals nativos para estado. Sin NgRx.
- Sin `@angular/animations` — deprecado desde Angular 21 en favor de `animate.enter`/`animate.leave` nativo; Material funciona igual, solo sin transiciones de entrada/salida.

## Development server

```bash
npm start   # alias de: ng serve
```

Levanta en `http://localhost:4200`. Necesita el backend corriendo en `http://localhost:3000/api` (ver `src/environments/`).

## Estructura

```
src/app/
├── core/
│   ├── guards/           # auth.guard.ts
│   ├── http/             # base-url, auth, error interceptors (en ese orden, ver app.config.ts)
│   └── services/         # auth, question, assessment, submission — un método por endpoint
├── features/
│   ├── recruiter/        # login, assessment-list, create-assessment, assessment-submissions
│   └── candidate/        # start-submission, resolve-assessment
└── shared/
    ├── components/       # question-card, question-form, difficulty-badge, code-runner
    ├── submission-result/ # pantalla de resultado, compartida entre ambos roles
    └── models/            # DTOs — espejan el backend real, ver comentarios en cada archivo
```

Rutas completas en [src/app/app.routes.ts](src/app/app.routes.ts).

## Autenticación

Solo el área `/recruiter/*` requiere login (JWT); `/candidate/*` sigue pública. `authGuard` protege el grupo de rutas `recruiter` completo (guard en la ruta padre, no repetido en cada hija). El token vive en `sessionStorage` (clave `auth_token`) — se pierde al cerrar la pestaña, a propósito, no se valida su expiración en el front: si expiró, el backend responde 401 y `error.interceptor.ts` hace `logout()` + redirige a `/login` (mismo camino que un login fallido, donde es un no-op inofensivo).

`auth.interceptor.ts` adjunta el header solo si hay token guardado — las requests del candidato nunca lo llevan y no se rompen por su ausencia.

## Modelos

Los DTOs en `shared/models/` fueron verificados contra respuestas reales del backend (no solo inferidos del spec). Cada archivo trae una nota con la fecha de verificación — si el backend cambia de forma, ahí es donde hay que mirar primero. Puntos no obvios:

- `Question` no tiene `title`: es `category` + `statement`. `type` es `'MULTIPLE_CHOICE' | 'CODE'`.
- Las respuestas (`SubmissionAnswer`) se referencian por `questionId`, no por índice.
- `POST /submissions/:id/run-code` exige que ya exista una respuesta guardada para esa pregunta — por eso `code-runner` encadena `saveAnswer` → `runCode`.
- `GET /assessments/:id` recorta `question.id` y `option.questionId` de las preguntas embebidas; `POST /assessments` **no** los recorta en su respuesta (inconsistencia del backend, no del front).
- `GET /submissions/:id` devuelve `{ submission, answers, totalScore, maxScore }`, no el submission plano.

## Manejo de errores

El backend responde los errores HTTP en formato [Problem Details](https://www.rfc-editor.org/rfc/rfc9457) — ver `ApiError` en [shared/models/api-error.model.ts](src/app/shared/models/api-error.model.ts): `{ title, status, detail, instance, codeError, timestamp, fieldErrors? }`.

`error.interceptor.ts` (ver [core/http/error.interceptor.ts](src/app/core/http/error.interceptor.ts)):

- Muestra en `MatSnackBar` un copy genérico (`title` del backend para 400/401/404/409, o un mensaje fijo del front para el resto). **`detail` nunca se muestra al usuario** — es texto de debugging para logs, no copy de UI.
- `status === 401` desloguea y redirige a `/login`.
- Re-lanza el `HttpErrorResponse` completo (no un objeto propio), para que cualquier componente pueda leer `err.error.codeError` o `err.error.fieldErrors` en su propio `.subscribe({ error: ... })`.

**Para agregar un caso puntual** (ej. mostrar "Este assessment ya fue enviado, no puedes seguir editando tus respuestas" cuando el backend rechaza un submission ya cerrado): en el componente que hace la llamada, comparar `err.error?.codeError` contra el código real que devuelve el backend para ese caso — no el `status` ni texto de `title`/`detail` — y mostrar ahí el copy propio del front. Ningún componente hace esto todavía (ver "Estado" más abajo).

**Para resaltar campos inválidos de un formulario**: leer `err.error?.fieldErrors` (`Record<string, string[]>`, keyed por nombre de campo) en el `.subscribe({ error: ... })` del submit y aplicar `form.controls[campo].setErrors(...)` con el mensaje correspondiente. Tampoco está implementado todavía en `question-form`, `start-submission` ni `login` — hoy esos formularios solo cortan el estado de `saving`/`loading` y dejan que el snackbar genérico avise.

## Building

```bash
ng build                              # producción
ng build --configuration development  # dev, con environment.development.ts
```

## Tests

```bash
ng test
```

## Estado

Scaffold inicial: rutas, servicios, interceptors y componentes están cableados e inyectan lo que corresponde, pero la lógica de UI (validaciones, diseño visual, manejo de errores por campo, etc.) todavía se construye pantalla por pantalla. El interceptor ya migró al formato Problem Details del backend (ver "Manejo de errores"), pero el manejo por `codeError` puntual y el resaltado de campos por `fieldErrors` todavía no tienen ningún caso implementado — se agregan cuando aparezca el primer caso real.
