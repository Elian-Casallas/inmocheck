// Errores de negocio. Cada uno sabe qué código HTTP le corresponde, así el
// servicio solo dice QUÉ pasó (throw new ConflictError(...)) y toProblem()
// decide cómo responder.

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly title: string,
    detail?: string,
  ) {
    super(detail ?? title);
  }
}

export class BadRequestError extends AppError {
  constructor(detail = "La solicitud no tiene el formato esperado.") {
    super(400, "BAD_REQUEST", "Solicitud inválida", detail);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(detail = "Debes iniciar sesión.", code = "UNAUTHENTICATED") {
    super(401, code, "No autenticado", detail);
  }
}

export class ForbiddenError extends AppError {
  constructor(detail = "No tienes permiso para realizar esta acción.", code = "FORBIDDEN") {
    super(403, code, "Sin permiso", detail);
  }
}

// También se usa cuando el recurso es de otra organización: así no se
// revela que existe.
export class NotFoundError extends AppError {
  constructor(detail = "El recurso no existe o no está disponible.") {
    super(404, "NOT_FOUND", "No encontrado", detail);
  }
}

export class ConflictError extends AppError {
  constructor(detail: string, code = "CONFLICT") {
    super(409, code, "Conflicto", detail);
  }
}
