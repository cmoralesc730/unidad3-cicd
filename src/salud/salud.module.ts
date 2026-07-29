import { Module } from '@nestjs/common';
import { ProductosModule } from '../productos/productos.module';
import { RaizController } from './raiz.controller';
import { SaludController } from './salud.controller';

/**
 * Módulo de las rutas públicas de información: la portada en `/` y el estado del
 * servicio en `/salud`.
 *
 * Importa `ProductosModule` para reutilizar la misma instancia de
 * `ProductosService` y poder reportar el tamaño real del catálogo.
 */
@Module({
  imports: [ProductosModule],
  controllers: [RaizController, SaludController],
})
export class SaludModule {}