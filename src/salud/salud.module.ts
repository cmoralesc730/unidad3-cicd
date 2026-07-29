import { Module } from '@nestjs/common';
import { ProductosModule } from '../productos/productos.module';
import { SaludController } from './salud.controller';

/**
 * Módulo de la ruta de salud. Importa `ProductosModule` para reutilizar la misma
 * instancia de `ProductosService` y poder reportar el tamaño real del catálogo.
 */
@Module({
  imports: [ProductosModule],
  controllers: [SaludController],
})
export class SaludModule {}
