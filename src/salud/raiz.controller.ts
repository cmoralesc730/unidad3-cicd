import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../auth/publico.decorator';
import { RUTA_DOCUMENTACION } from '../documentacion';

/** Cuerpo que devuelve la raíz del servicio. */
export interface Portada {
  servicio: string;
  version: string;
  rutas: Record<string, string>;
  autenticacion: string;
  saludo: string;
}

/**
 * Portada del servicio, en `/`.
 *
 * Sin ella, abrir la URL en un navegador devuelve el 404 genérico de una ruta no
 * definida, que no dice si el servicio está caído, mal desplegado o simplemente
 * no tiene nada en la raíz. Esta ruta responde a esa pregunta de un vistazo.
 *
 * Es pública, y puede serlo sin riesgo: solo enumera rutas que ya se conocen por
 * el repositorio, y advierte de que el catálogo exige credenciales. No expone
 * datos, ni configuración, ni detalles de la infraestructura.
 */
@ApiTags('informacion')
@Controller()
export class RaizController {
  constructor(private readonly configuracion: ConfigService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Portada del servicio (no requiere credenciales)' })
  @ApiOkResponse({ description: 'Nombre, versión y rutas disponibles.' })
  portada(): Portada {
    return {
      servicio: 'catalogo-api',
      version: this.configuracion.get<string>('version') ?? 'desconocida',
      rutas: {
        salud: '/salud',
        productos: '/productos',
        documentacion: `/${RUTA_DOCUMENTACION}`,
      },
      autenticacion: 'Las rutas de /productos exigen la cabecera x-api-key.',
      saludo: 'hola',
    };
  }
}
