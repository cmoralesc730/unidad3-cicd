import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiKeyService, CABECERA_API_KEY } from './api-key.service';
import { ES_PUBLICO } from './publico.decorator';

/**
 * Guard que protege las rutas del servicio.
 *
 * Se registra como `APP_GUARD` en `AppModule`, de modo que se aplica a todas las
 * rutas por defecto. El diseño es *seguro por omisión*: cualquier endpoint que se
 * añada en el futuro nace protegido, y abrirlo exige anotarlo explícitamente con
 * `@Publico()`. Lo contrario —proteger ruta por ruta— falla en cuanto alguien
 * olvida una anotación.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKey: ApiKeyService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(contexto: ExecutionContext): boolean {
    // Se consulta el handler y también la clase, para poder marcar como público
    // un método suelto o un controlador entero. El handler tiene prioridad.
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (esPublico) {
      return true;
    }

    const peticion = contexto.switchToHttp().getRequest<Request>();
    const recibida = peticion.headers[CABECERA_API_KEY];

    if (!this.apiKey.esValida(typeof recibida === 'string' ? recibida : undefined)) {
      // Un único mensaje para "falta la cabecera" y "la cabecera es incorrecta":
      // distinguirlos le confirmaría a un atacante que el formato de su petición
      // es correcto y que solo le falta acertar el valor.
      throw new UnauthorizedException(`Cabecera ${CABECERA_API_KEY} ausente o inválida.`);
    }

    return true;
  }
}
