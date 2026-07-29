import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Arranque del servicio.
 *
 * Cuatro puntos que resuelven problemas concretos del despliegue en contenedor:
 *
 *   1. La validación de DTO se activa de forma global, con `whitelist` y
 *      `forbidNonWhitelisted`. Así una petición con campos desconocidos se
 *      rechaza con 400 en lugar de que esos campos se ignoren en silencio.
 *   2. Se escucha en `0.0.0.0`. Dentro de un contenedor, escuchar en `127.0.0.1`
 *      dejaría el puerto inalcanzable desde el exterior y la sonda de salud
 *      externa fallaría siempre.
 *   3. Se habilitan los hooks de apagado. Al desplegar una versión nueva, la
 *      plataforma envía SIGTERM a la tarea anterior; sin esto, las peticiones en
 *      curso se cortarían de golpe.
 *   4. Si la configuración es inválida, el proceso termina con código 1 en vez de
 *      quedar a medio arrancar.
 */
async function arrancar(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // La salida estándar del contenedor se recoge en CloudWatch Logs.
    logger: ['error', 'warn', 'log'],
  });

  const configuracion = app.get(ConfigService);
  const puerto = configuracion.get<number>('puerto') ?? 3000;
  const modo = configuracion.get<string>('modo') ?? 'development';
  const version = configuracion.get<string>('version') ?? 'local';

  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta las propiedades no declaradas en el DTO...
      whitelist: true,
      // ...y además rechaza la petición si venían, en lugar de ignorarlas.
      forbidNonWhitelisted: true,
      // Convierte el cuerpo en una instancia del DTO y ajusta tipos primitivos.
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(puerto, '0.0.0.0');

  new Logger('Arranque').log(`Escuchando en 0.0.0.0:${puerto} · modo=${modo} · versión=${version}`);
}

arrancar().catch((error) => {
  // No se usa el Logger de Nest: si el fallo ocurrió durante la construcción de la
  // aplicación, puede que aún no exista.
  console.error('No se pudo arrancar el servicio:', error);
  process.exit(1);
});
