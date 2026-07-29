import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { NOMBRE_ESQUEMA_API_KEY } from '../documentacion';
import { GuardarProductoDto } from './dto/guardar-producto.dto';
import { Producto } from './producto.entity';
import { ProductosService } from './productos.service';

/**
 * Rutas REST del catálogo.
 *
 * Todas están protegidas: el `ApiKeyGuard` está registrado de forma global en
 * `AppModule`, así que una petición sin cabecera `x-api-key` válida recibe 401
 * antes de llegar a cualquiera de estos métodos.
 *
 * El controlador solo traduce HTTP a llamadas del servicio; no contiene lógica.
 *
 * Los decoradores `@Api*` no alteran el comportamiento: alimentan la
 * documentación interactiva de `/docs`. `@ApiSecurity` es el que hace que ahí
 * aparezca el botón "Authorize" para introducir la credencial.
 */
@ApiTags('productos')
@ApiSecurity(NOMBRE_ESQUEMA_API_KEY)
@ApiUnauthorizedResponse({ description: 'Falta la cabecera x-api-key o su valor es incorrecto.' })
@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Post()
  @ApiOperation({
    summary: 'Da de alta un producto',
    description: 'El sku debe ser único en todo el catálogo.',
  })
  @ApiCreatedResponse({ description: 'Producto creado.', type: Producto })
  @ApiBadRequestResponse({ description: 'El cuerpo no cumple las reglas de validación.' })
  @ApiConflictResponse({ description: 'Ya existe otro producto con ese sku.' })
  crear(@Body() datos: GuardarProductoDto): Producto {
    return this.productos.crear(datos);
  }

  @Get()
  @ApiOperation({ summary: 'Lista el catálogo', description: 'Ordenado por sku.' })
  @ApiOkResponse({ description: 'Catálogo completo.', type: [Producto] })
  listar(): Producto[] {
    return this.productos.listar();
  }

  // `ParseUUIDPipe` descarta con 400 los ids mal formados antes de tocar el
  // almacenamiento, de modo que un 404 siempre significa "no existe" y no
  // "escribiste mal el identificador".
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un producto por su id' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identificador del producto.' })
  @ApiOkResponse({ description: 'Producto encontrado.', type: Producto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID v4.' })
  @ApiNotFoundResponse({ description: 'No existe un producto con ese id.' })
  obtener(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Producto {
    return this.productos.obtener(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Reemplaza un producto por completo',
    description:
      'No es una actualización parcial: hay que enviar los cuatro campos. Solo se ' +
      'conservan el id y la fecha de alta.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identificador del producto.' })
  @ApiOkResponse({ description: 'Producto reemplazado.', type: Producto })
  @ApiBadRequestResponse({ description: 'El cuerpo no cumple las reglas de validación.' })
  @ApiNotFoundResponse({ description: 'No existe un producto con ese id.' })
  @ApiConflictResponse({ description: 'El sku nuevo ya pertenece a otro producto.' })
  reemplazar(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() datos: GuardarProductoDto,
  ): Producto {
    return this.productos.reemplazar(id, datos);
  }

  // 204 No Content es la respuesta idiomática de un DELETE que no devuelve cuerpo.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un producto' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identificador del producto.' })
  @ApiNoContentResponse({ description: 'Producto eliminado.' })
  @ApiNotFoundResponse({ description: 'No existe un producto con ese id.' })
  eliminar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): void {
    this.productos.eliminar(id);
  }
}
