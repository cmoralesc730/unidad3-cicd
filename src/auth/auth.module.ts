import { Module } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

/**
 * Módulo de autenticación.
 *
 * Exporta `ApiKeyService` para que `AppModule` pueda inyectarlo en el guard
 * global. El guard en sí no se declara aquí: al registrarse como `APP_GUARD` debe
 * vivir en el módulo raíz para que Nest lo aplique a toda la aplicación.
 */
@Module({
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class AuthModule {}
