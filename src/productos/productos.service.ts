import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GuardarProductoDto } from './dto/guardar-producto.dto';
import { Producto } from './producto.entity';
import { ProductosRepository } from './productos.repository';

/**
 * Reglas de negocio del catálogo.
 *
 * El servicio no sabe cómo se almacenan los datos: delega en `ProductosRepository`.
 * Su responsabilidad es decidir qué es válido a nivel de dominio —cosas que un
 * DTO no puede comprobar porque dependen del estado del catálogo— y traducir esas
 * decisiones a códigos HTTP:
 *
 *   - SKU duplicado          -> 409 Conflict
 *   - Producto inexistente   -> 404 Not Found
 */
@Injectable()
export class ProductosService {
  constructor(private readonly repositorio: ProductosRepository) {}

  /** `POST /productos` */
  crear(datos: GuardarProductoDto): Producto {
    this.asegurarSkuLibre(datos.sku);

    const ahora = new Date().toISOString();

    return this.repositorio.guardar({
      id: randomUUID(),
      sku: datos.sku,
      nombre: datos.nombre,
      precio: datos.precio,
      stock: datos.stock,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  /** `GET /productos` */
  listar(): Producto[] {
    return this.repositorio.listar();
  }

  /**
   * `GET /productos/:id`
   * @throws {NotFoundException} si el id no existe.
   */
  obtener(id: string): Producto {
    const producto = this.repositorio.buscarPorId(id);

    if (!producto) {
      throw new NotFoundException(`No existe un producto con id "${id}".`);
    }

    return producto;
  }

  /**
   * `PUT /productos/:id` — reemplaza el producto completo.
   *
   * Se conservan `id` y `creadoEn` porque identifican el recurso y su historia;
   * todo lo demás procede del cuerpo de la petición.
   *
   * @throws {NotFoundException} si el id no existe.
   * @throws {ConflictException} si el SKU nuevo ya pertenece a otro producto.
   */
  reemplazar(id: string, datos: GuardarProductoDto): Producto {
    const actual = this.obtener(id);

    // Se permite conservar el mismo SKU (no es un duplicado consigo mismo), pero
    // no adoptar el de otro producto.
    this.asegurarSkuLibre(datos.sku, id);

    return this.repositorio.guardar({
      id: actual.id,
      sku: datos.sku,
      nombre: datos.nombre,
      precio: datos.precio,
      stock: datos.stock,
      creadoEn: actual.creadoEn,
      actualizadoEn: new Date().toISOString(),
    });
  }

  /**
   * `DELETE /productos/:id`
   * @throws {NotFoundException} si el id no existe, para que borrar dos veces no
   *         devuelva un falso éxito.
   */
  eliminar(id: string): void {
    if (!this.repositorio.eliminar(id)) {
      throw new NotFoundException(`No existe un producto con id "${id}".`);
    }
  }

  /** Número de productos almacenados. Lo reporta el endpoint de salud. */
  total(): number {
    return this.repositorio.total();
  }

  /**
   * Comprueba que el SKU no esté ocupado.
   *
   * @param idPropio  id del producto que se está actualizando; su propio SKU no
   *                  cuenta como conflicto.
   */
  private asegurarSkuLibre(sku: string, idPropio?: string): void {
    const ocupadoPor = this.repositorio.idConSku(sku);

    if (ocupadoPor && ocupadoPor !== idPropio) {
      throw new ConflictException(`El sku "${sku}" ya está asignado a otro producto.`);
    }
  }
}
