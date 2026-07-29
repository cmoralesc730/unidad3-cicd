import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Publico } from '../auth/publico.decorator';
import { ProductosService } from '../productos/productos.service';

/** Cuerpo que devuelve la ruta de salud. */
export interface EstadoServicio {
  estado: 'ok';
  /** Versión desplegada. Con el pipeline en marcha, es el SHA del commit. */
  version: string;
  modo: string;
  /** Segundos que lleva vivo el proceso; delata reinicios en bucle. */
  segundosActivo: number;
  /** Productos actualmente en memoria. */
  productos: number;
  instante: string;
}

/**
 * Ruta de salud. Es la única del servicio que no exige credenciales.
 *
 * La consultan el balanceador que atiende al servicio, para decidir si la tarea
 * está sana, y el pipeline, para verificar tras cada despliegue que la versión
 * publicada responde. Que sea pública permite hacer esa verificación sin que la
 * API key aparezca nunca en los registros de la automatización.
 *
 * Por ese motivo la respuesta no incluye ningún dato sensible: ni credenciales,
 * ni identificadores de recursos de AWS, ni detalles de la infraestructura.
 * `version` es deliberadamente la excepción útil: expone qué build está en línea,
 * que es información pública en un repositorio abierto.
 */
@Controller('salud')
export class SaludController {
  constructor(
    private readonly configuracion: ConfigService,
    private readonly productos: ProductosService,
  ) {}

  @Publico()
  @Get()
  revisar(): EstadoServicio {
    return {
      estado: 'ok',
      version: this.configuracion.get<string>('version') ?? 'desconocida',
      modo: this.configuracion.get<string>('modo') ?? 'desconocido',
      segundosActivo: Math.floor(process.uptime()),
      productos: this.productos.total(),
      instante: new Date().toISOString(),
    };
  }
}
