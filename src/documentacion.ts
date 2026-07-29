import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CABECERA_API_KEY } from './auth/api-key.service';

/**
 * Nombre del esquema de seguridad en la especificación OpenAPI.
 *
 * Debe ser el mismo aquí y en el `@ApiSecurity(...)` de los controladores; si no
 * coincidiera, el botón "Authorize" de la interfaz no aplicaría la credencial a
 * las peticiones y todo devolvería 401 sin explicación aparente.
 */
export const NOMBRE_ESQUEMA_API_KEY = 'api-key';

/** Ruta donde se publica la documentación interactiva. */
export const RUTA_DOCUMENTACION = 'docs';

/**
 * Publica la documentación interactiva de la API.
 *
 * Se habilita también en producción, a propósito. La razón habitual para
 * ocultarla —no regalar el mapa de la API— no aplica aquí: el repositorio es
 * público, así que la superficie ya es conocida. Y las rutas siguen protegidas:
 * sin una credencial válida, una petición lanzada desde la interfaz recibe el
 * mismo 401 que cualquier otra.
 *
 * La interfaz se monta como middleware, no como ruta de Nest, por lo que el guard
 * global no interviene y `/docs` queda accesible sin credenciales. Es lo que se
 * busca: la documentación no expone datos, solo la forma de la API.
 */
export function publicarDocumentacion(app: INestApplication, version: string): void {
  const configuracion = new DocumentBuilder()
    .setTitle('Catálogo API')
    .setDescription(
      'CRUD de productos.\n\n' +
        `Todas las rutas de \`/productos\` exigen la cabecera \`${CABECERA_API_KEY}\`. ` +
        'Pulsa **Authorize**, pega la credencial y quedará aplicada a todas las peticiones ' +
        'que lances desde aquí.\n\n' +
        'Para obtenerla:\n\n' +
        '```\naws ssm get-parameter --with-decryption --name /catalogo-api/api-key \\\n' +
        '  --query Parameter.Value --output text\n```\n\n' +
        'Aviso: el catálogo se guarda en memoria y se vacía en cada despliegue.',
    )
    .setVersion(version)
    // Declara el esquema de seguridad; es lo que dibuja el botón "Authorize".
    .addApiKey({ type: 'apiKey', name: CABECERA_API_KEY, in: 'header' }, NOMBRE_ESQUEMA_API_KEY)
    .build();

  const documento = SwaggerModule.createDocument(app, configuracion);

  SwaggerModule.setup(RUTA_DOCUMENTACION, app, documento, {
    customSiteTitle: 'Catálogo API',
    swaggerOptions: {
      // Conserva la credencial introducida al recargar la página, para no tener
      // que pegarla de nuevo en mitad de una demostración.
      persistAuthorization: true,
      // Ordena rutas y etiquetas alfabéticamente en lugar de por orden de carga.
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
    },
  });
}
