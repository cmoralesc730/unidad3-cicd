/**
 * Configuración del servicio, leída de variables de entorno.
 *
 * En AWS llegan por dos vías distintas dentro de la definición del contenedor:
 *
 *   - Valores no sensibles (`PORT`, `NODE_ENV`, `VERSION`) viajan en claro.
 *   - `API_KEY` se declara por referencia a un parámetro de SSM; el agente de ECS
 *     lo descifra al arrancar la tarea y lo expone solo dentro del proceso.
 *
 * La validación es estricta y se ejecuta al arrancar: si falta `API_KEY` el
 * proceso termina inmediatamente. Es preferible que un despliegue mal configurado
 * falle la sonda de salud y sea revertido, a que quede en línea sin autenticación.
 */

export interface Entorno {
  /** Puerto HTTP en el que escucha el servidor. */
  puerto: number;
  /** Entorno de ejecución. */
  modo: string;
  /** Identificador de la versión desplegada; se reporta en la ruta de salud. */
  version: string;
  /** Credencial esperada en la cabecera `x-api-key`. */
  apiKey: string;
}

/** Se lanza cuando falta una variable obligatoria o su valor no es utilizable. */
export class ConfiguracionInvalidaError extends Error {
  constructor(detalle: string) {
    super(`Configuración inválida: ${detalle}`);
    this.name = 'ConfiguracionInvalidaError';
  }
}

/**
 * Factory registrada en `ConfigModule.forRoot({ load: [cargarEntorno] })`.
 * Se ejecuta una sola vez, durante el arranque de la aplicación.
 */
export const cargarEntorno = (): Entorno => {
  const apiKey = process.env.API_KEY?.trim();

  if (!apiKey) {
    throw new ConfiguracionInvalidaError(
      'falta API_KEY. En local defínela en .env; en AWS se inyecta desde SSM Parameter Store.',
    );
  }

  const puerto = Number.parseInt(process.env.PORT ?? '3000', 10);

  // Un puerto ilegible dejaría a Node escuchando en un puerto aleatorio y la
  // sonda de salud fallaría sin explicación evidente.
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new ConfiguracionInvalidaError(`PORT="${process.env.PORT}" no es un puerto válido.`);
  }

  return {
    puerto,
    modo: process.env.NODE_ENV ?? 'development',
    // El pipeline inyecta aquí el SHA del commit, lo que permite comprobar desde
    // fuera qué versión está sirviendo el servicio en un momento dado.
    version: process.env.VERSION ?? 'local',
    apiKey,
  };
};
