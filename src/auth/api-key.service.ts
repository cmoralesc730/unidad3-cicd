import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

/** Cabecera HTTP en la que el cliente envía su credencial. */
export const CABECERA_API_KEY = 'x-api-key';

/**
 * Verificación de la API key.
 *
 * Se separa del guard para que la comparación criptográfica sea una unidad
 * independiente, testeable y reutilizable: el guard decide *cuándo* hay que
 * autenticar, este servicio decide *si* la credencial es correcta.
 */
@Injectable()
export class ApiKeyService {
  /** Clave esperada, precalculada como buffer para no recodificarla en cada petición. */
  private readonly claveEsperada: Buffer;

  constructor(configuracion: ConfigService) {
    const clave = configuracion.get<string>('apiKey') ?? '';
    this.claveEsperada = Buffer.from(clave, 'utf8');
  }

  /**
   * Indica si el valor recibido coincide con la clave configurada.
   *
   * La comparación se hace en tiempo constante con `timingSafeEqual`. Con un
   * `===` normal, el tiempo de respuesta variaría según cuántos caracteres
   * iniciales acertara el atacante, lo que permite deducir la clave carácter a
   * carácter. `timingSafeEqual` exige buffers del mismo tamaño, así que la
   * diferencia de longitud se resuelve antes; eso solo revela el largo de la
   * clave, no su contenido.
   */
  esValida(valorRecibido: string | undefined): boolean {
    // Defensa en profundidad: si la configuración se cargó vacía, ninguna
    // credencial es válida, en lugar de aceptar la cadena vacía.
    if (this.claveEsperada.length === 0) {
      return false;
    }

    if (typeof valorRecibido !== 'string' || valorRecibido.length === 0) {
      return false;
    }

    const recibida = Buffer.from(valorRecibido, 'utf8');

    if (recibida.length !== this.claveEsperada.length) {
      return false;
    }

    return timingSafeEqual(recibida, this.claveEsperada);
  }
}
