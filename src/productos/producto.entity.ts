import { ApiProperty } from '@nestjs/swagger';

/**
 * Producto del catálogo.
 *
 * Se declara como clase y no como interfaz porque los decoradores `@ApiProperty`
 * necesitan un objeto que exista en tiempo de ejecución: una interfaz de
 * TypeScript desaparece al compilar y no dejaría nada que documentar. Como
 * TypeScript es estructural, sigue sirviendo igual como tipo — los objetos
 * literales que crea el servicio la satisfacen sin instanciarla.
 *
 * Se persiste en memoria (ver `ProductosRepository`), por lo que el catálogo se
 * vacía cada vez que el contenedor se reinicia o se despliega una versión nueva.
 */
export class Producto {
  @ApiProperty({
    description: 'Identificador interno, generado por el servidor.',
    format: 'uuid',
    example: '0b6f2e7c-9a41-4d3e-8f52-1c7d9e4a6b30',
  })
  id!: string;

  @ApiProperty({
    description:
      'Código de catálogo. A diferencia del id, lo elige el cliente y debe ser único: ' +
      'el servicio rechaza con 409 cualquier alta que lo repita.',
    example: 'TEC-001',
  })
  sku!: string;

  @ApiProperty({ description: 'Nombre comercial.', example: 'Teclado mecánico' })
  nombre!: string;

  @ApiProperty({ description: 'Precio unitario. Nunca negativo.', example: 899.5 })
  precio!: number;

  @ApiProperty({ description: 'Unidades disponibles. Entero, nunca negativo.', example: 12 })
  stock!: number;

  @ApiProperty({ description: 'Fecha de alta en ISO 8601 (UTC).', format: 'date-time' })
  creadoEn!: string;

  @ApiProperty({
    description: 'Fecha de la última modificación en ISO 8601 (UTC).',
    format: 'date-time',
  })
  actualizadoEn!: string;
}
