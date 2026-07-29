import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './auth/api-key.guard';
import { AuthModule } from './auth/auth.module';
import { cargarEntorno } from './config/entorno';
import { ProductosModule } from './productos/productos.module';
import { SaludModule } from './salud/salud.module';

/**
 * Módulo raíz.
 *
 * Dos decisiones que conviene entender:
 *
 *   1. `ConfigModule` es global y en producción ignora cualquier archivo `.env`.
 *      Dentro del contenedor la configuración ya viene del entorno —inyectada por
 *      ECS, con la API key resuelta desde SSM—, así que buscar un `.env` solo
 *      podría introducir valores inesperados.
 *
 *   2. `ApiKeyGuard` se registra como `APP_GUARD`, es decir, cubre todas las rutas
 *      sin necesidad de anotarlas una por una. Abrir una ruta exige marcarla con
 *      `@Publico()`, de modo que exponer algo sin querer requiere un acto
 *      deliberado y visible en la revisión de código.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [cargarEntorno],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: '.env',
      cache: true,
    }),
    AuthModule,
    ProductosModule,
    SaludModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
