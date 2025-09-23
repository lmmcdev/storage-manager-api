# Storage Manager API - NestJS Architecture

## 📁 Estructura de Carpetas (Estilo NestJS)

```
src/
├── 📂 modules/                     # Módulos de la aplicación
│   ├── 📂 files/                   # Módulo de gestión de archivos
│   │   ├── 📂 controllers/         # Controladores HTTP
│   │   │   ├── files-upload.controller.ts
│   │   │   ├── files.controller.ts
│   │   │   ├── files-copy.controller.ts
│   │   │   └── files-sas.controller.ts
│   │   ├── 📂 services/            # Lógica de negocio
│   │   │   ├── files.service.ts
│   │   │   └── storage.service.ts
│   │   ├── 📂 dtos/                # Data Transfer Objects
│   │   │   ├── upload.dto.ts
│   │   │   ├── list.dto.ts
│   │   │   ├── copy.dto.ts
│   │   │   └── sas.dto.ts
│   │   ├── 📂 interfaces/          # Interfaces TypeScript
│   │   ├── 📂 entities/            # Entidades del dominio
│   │   └── files.module.ts         # Módulo principal
│   │
│   ├── 📂 health/                  # Módulo de health checks
│   │   ├── 📂 controllers/
│   │   │   └── health.controller.ts
│   │   ├── 📂 services/
│   │   │   └── health.service.ts
│   │   ├── 📂 dtos/
│   │   │   └── health.dto.ts
│   │   └── health.module.ts
│   │
│   └── 📂 auth/                    # Módulo de autenticación
│       ├── 📂 controllers/
│       ├── 📂 services/
│       │   └── auth.service.ts
│       ├── 📂 dtos/
│       ├── 📂 guards/              # Guards de autenticación
│       ├── 📂 strategies/          # Estrategias de auth
│       └── auth.module.ts
│
├── 📂 common/                      # Código compartido
│   ├── 📂 decorators/              # Decoradores personalizados
│   ├── 📂 filters/                 # Filtros de excepción
│   ├── 📂 guards/                  # Guards globales
│   ├── 📂 interceptors/            # Interceptores
│   ├── 📂 pipes/                   # Pipes de validación
│   │   └── validation.ts
│   ├── 📂 exceptions/              # Excepciones personalizadas
│   │   └── errors.ts
│   ├── 📂 interfaces/              # Interfaces compartidas
│   ├── 📂 utils/                   # Utilidades
│   │   ├── http.ts
│   │   └── logger.ts
│   ├── 📂 config/                  # Configuración
│   │   └── env.ts
│   └── 📂 dtos/                    # DTOs compartidos
│       └── common.dto.ts
│
├── 📂 shared/                      # Servicios compartidos (legacy)
├── 📂 functions/                   # Azure Functions originales (legacy)
├── app.module.ts                   # Módulo raíz de la aplicación
└── main.ts                         # Punto de entrada principal
```

## 🏗️ Arquitectura por Capas

### 1. **Controllers** (Capa de Presentación)
- Manejan las peticiones HTTP de Azure Functions
- Validan datos de entrada
- Orquestan llamadas a servicios
- Formatean respuestas

```typescript
// Ejemplo: files-upload.controller.ts
export class FilesUploadController {
  constructor(private filesService: FilesService) {}

  async handle(request: HttpRequest): Promise<HttpResponseInit> {
    // Validación, autenticación, llamada al servicio
  }
}
```

### 2. **Services** (Capa de Lógica de Negocio)
- Contienen la lógica de negocio principal
- Independientes de la infraestructura HTTP
- Reutilizables entre controladores

```typescript
// Ejemplo: files.service.ts
export class FilesService {
  constructor(private storageService: StorageService) {}

  async uploadFromForm(formData: UploadFormData): Promise<UploadResult> {
    // Lógica de negocio para upload
  }
}
```

### 3. **DTOs** (Data Transfer Objects)
- Definen la estructura de datos
- Validación con Zod schemas
- Tipado fuerte con TypeScript

```typescript
// Ejemplo: upload.dto.ts
export const uploadJsonSchema = z.object({
  contentBase64: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
});
```

### 4. **Modules** (Organización)
- Agrupan funcionalidad relacionada
- Definen dependencias y exports
- Facilitan la escalabilidad

```typescript
// Ejemplo: files.module.ts
export class FilesModule {
  static controllers = [FilesController, FilesUploadController];
  static services = [FilesService, StorageService];
}
```

## 🔄 Flujo de Datos

```
HTTP Request → Controller → Service → Storage → Response
     ↓            ↓          ↓         ↓         ↑
   Validation → Business → Data → External → Format
                Logic     Access    API
```

## 🎯 Beneficios de esta Arquitectura

### ✅ **Separación de Responsabilidades**
- Cada capa tiene una responsabilidad específica
- Fácil testing y mantenimiento
- Código más limpio y legible

### ✅ **Escalabilidad**
- Fácil agregar nuevos módulos
- Reutilización de servicios
- Independencia entre módulos

### ✅ **Testabilidad**
- Servicios testeable por separado
- Mocking simplificado
- Tests unitarios y de integración

### ✅ **Mantenibilidad**
- Código organizado por dominio
- Fácil localizar funcionalidad
- Refactoring seguro

### ✅ **TypeScript First**
- Tipado fuerte en toda la aplicación
- Detección temprana de errores
- Mejor experiencia de desarrollo

## 🚀 Migración Gradual

La estructura permite migrar gradualmente desde las Azure Functions originales:

1. **Fase 1**: Crear controladores que llamen a las funciones existentes
2. **Fase 2**: Extraer lógica de negocio a servicios
3. **Fase 3**: Reorganizar DTOs y validaciones
4. **Fase 4**: Eliminar funciones legacy

## 🛠️ Herramientas de Desarrollo

- **TypeScript**: Tipado fuerte y mejor DX
- **Zod**: Validación de schemas runtime
- **Azure Functions v4**: Runtime serverless
- **Pino**: Logging estructurado
- **Jest**: Testing framework

Esta arquitectura proporciona una base sólida para el crecimiento de la aplicación manteniendo la simplicidad de Azure Functions.