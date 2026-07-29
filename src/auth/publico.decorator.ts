import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos que consulta `ApiKeyGuard` para omitir la autenticación. */
export const ES_PUBLICO = 'esPublico';

/**
 * Marca una ruta como accesible sin API key.
 *
 * Solo la usa el endpoint de salud. El balanceador que atiende al servicio
 * comprueba periódicamente esa ruta y no puede añadir cabeceras propias a sus
 * sondas: si exigiera credenciales, marcaría la tarea como no saludable y la
 * reemplazaría en bucle.
 *
 * @example
 * ```ts
 * @Publico()
 * @Get()
 * revisar() { ... }
 * ```
 */
export const Publico = () => SetMetadata(ES_PUBLICO, true);
