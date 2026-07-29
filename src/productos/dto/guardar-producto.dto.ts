import { IsInt, IsNumber, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/**
 * Cuerpo que aceptan tanto `POST /productos` como `PUT /productos/:id`.
 *
 * Un único DTO sirve para ambas operaciones porque el `PUT` de esta API es un
 * **reemplazo completo**, no una modificación parcial: el cliente envía siempre el
 * recurso entero y el servidor lo sustituye. Es la semántica correcta de PUT en
 * REST, y evita la ambigüedad de "campo ausente" (¿se conserva, o se borra?).
 *
 * Las reglas se aplican con el `ValidationPipe` global configurado en `main.ts`,
 * que además rechaza con 400 cualquier propiedad que no esté declarada aquí.
 */
export class GuardarProductoDto {
  /**
   * Código de catálogo. Se restringe a mayúsculas, dígitos y guiones para que sea
   * seguro usarlo en URL, informes y sistemas externos sin escapado.
   */
  @IsString()
  @Matches(/^[A-Z0-9-]{3,20}$/, {
    message: 'sku debe tener entre 3 y 20 caracteres: mayúsculas, dígitos o guiones.',
  })
  sku!: string;

  @IsString()
  @MaxLength(80)
  nombre!: string;

  /**
   * `maxDecimalPlaces` evita almacenar precios con más precisión de la que el
   * catálogo puede representar (p. ej. 10.999 redondeado de forma imprevisible).
   */
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'precio admite como máximo 2 decimales.' })
  @Min(0, { message: 'precio no puede ser negativo.' })
  @Max(1_000_000)
  precio!: number;

  @IsInt({ message: 'stock debe ser un número entero.' })
  @Min(0, { message: 'stock no puede ser negativo.' })
  stock!: number;
}
