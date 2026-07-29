import { Module } from '@nestjs/common';
import { ProductosController } from './productos.controller';
import { ProductosRepository } from './productos.repository';
import { ProductosService } from './productos.service';

/**
 * Módulo del catálogo.
 *
 * `ProductosService` se exporta para que el módulo de salud pueda consultar
 * cuántos productos hay sin crear una segunda instancia: los providers tienen
 * ámbito de módulo, así que ambos consumidores comparten el mismo almacenamiento.
 *
 * `ProductosRepository` NO se exporta: fuera de este módulo, el catálogo solo se
 * manipula a través del servicio, que es quien aplica las reglas de negocio.
 */
@Module({
  controllers: [ProductosController],
  providers: [ProductosService, ProductosRepository],
  exports: [ProductosService],
})
export class ProductosModule {}
