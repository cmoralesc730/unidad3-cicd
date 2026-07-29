/**
 * Producto del catálogo.
 *
 * Es el recurso que expone el CRUD. Se guarda en memoria (ver `ProductosRepository`),
 * por lo que el catálogo se vacía cada vez que el contenedor se reinicia o se
 * despliega una versión nueva.
 */
export interface Producto {
  /** Identificador interno (UUID v4) generado por el servidor. */
  id: string;

  /**
   * Código de catálogo, en mayúsculas. A diferencia del `id`, lo elige el cliente
   * y debe ser único: el servicio rechaza con 409 cualquier alta que lo repita.
   */
  sku: string;

  /** Nombre comercial. */
  nombre: string;

  /** Precio unitario en la moneda del catálogo. Nunca negativo. */
  precio: number;

  /** Unidades disponibles. Entero, nunca negativo. */
  stock: number;

  /** Fecha de alta en ISO 8601 (UTC). */
  creadoEn: string;

  /** Fecha de la última modificación en ISO 8601 (UTC). */
  actualizadoEn: string;
}
