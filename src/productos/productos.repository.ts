import { Injectable } from '@nestjs/common';
import { Producto } from './producto.entity';

/**
 * Capa de acceso a datos del catálogo. Almacena en memoria.
 *
 * Se separa del servicio a propósito: aquí no hay ninguna regla de negocio, solo
 * operaciones de almacenamiento. Esa frontera es lo que permite cambiar el
 * almacenamiento (DynamoDB, PostgreSQL, Redis) reimplementando únicamente esta
 * clase, sin tocar el servicio, el controlador ni los DTO.
 *
 * Se mantienen dos estructuras en lugar de una:
 *   - `porId`  : índice principal, resuelve GET/PUT/DELETE por id en O(1).
 *   - `skusUsados` : índice secundario que permite comprobar la unicidad del SKU
 *                    en O(1). Sin él habría que recorrer todo el catálogo en cada
 *                    alta, que es O(n).
 *
 * El coste de tener dos índices es que ambos deben actualizarse a la vez; por eso
 * todas las escrituras pasan por los métodos de esta clase y nadie manipula los
 * mapas desde fuera.
 */
@Injectable()
export class ProductosRepository {
  private readonly porId = new Map<string, Producto>();
  private readonly skusUsados = new Map<string, string>(); // sku -> id

  /** Inserta o sustituye un producto, manteniendo coherentes ambos índices. */
  guardar(producto: Producto): Producto {
    const anterior = this.porId.get(producto.id);

    // Si el producto ya existía y cambió de SKU, hay que liberar el anterior;
    // de lo contrario quedaría reservado para siempre.
    if (anterior && anterior.sku !== producto.sku) {
      this.skusUsados.delete(anterior.sku);
    }

    this.porId.set(producto.id, producto);
    this.skusUsados.set(producto.sku, producto.id);

    return producto;
  }

  /** Devuelve el catálogo ordenado por SKU, para que la respuesta sea estable. */
  listar(): Producto[] {
    return [...this.porId.values()].sort((a, b) => a.sku.localeCompare(b.sku));
  }

  /** Devuelve el producto con ese id, o `undefined` si no existe. */
  buscarPorId(id: string): Producto | undefined {
    return this.porId.get(id);
  }

  /** Devuelve el id que ocupa ese SKU, o `undefined` si está libre. */
  idConSku(sku: string): string | undefined {
    return this.skusUsados.get(sku);
  }

  /** Elimina un producto. Devuelve `false` si el id no existía. */
  eliminar(id: string): boolean {
    const producto = this.porId.get(id);

    if (!producto) {
      return false;
    }

    this.skusUsados.delete(producto.sku);
    this.porId.delete(id);

    return true;
  }

  /** Número de productos en el catálogo. */
  total(): number {
    return this.porId.size;
  }
}
