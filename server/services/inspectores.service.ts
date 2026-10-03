import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { RUTA_ENLACE_CORREO, crearClienteCorreo } from "@/lib/supabase/correo";
import { armarPaginado } from "@/schemas/comun";
import type { Inspector, InspectorEditar, InspectorInvitar, InspectoresFiltro } from "@/schemas/inspectores";
import type { Actor } from "@/server/auth/sesion";
import { AppError, ConflictError, NotFoundError } from "@/server/http/errores";
import * as repositorio from "@/server/repositories/inspectores.repository";

export async function listarInspectores(filtro: InspectoresFiltro) {
  const { filas, total } = await repositorio.listarInspectores(filtro);
  const abiertas = await repositorio.contarAbiertasPorInspector(filas.map((fila) => fila.id));

  const inspectores: Inspector[] = filas.map((fila) => ({
    ...fila,
    inspeccionesAbiertas: abiertas.get(fila.id) ?? 0,
  }));
  return armarPaginado(inspectores, total, filtro.page, filtro.pageSize);
}

// Invitar necesita la API de administración de Supabase (service_role):
// crea la cuenta en auth.users y envía el correo. El rol y la organización
// los fija el servidor: INSPECTOR, en la organización del admin que invita.
export async function invitarInspector(actor: Actor, datos: InspectorInvitar, origen: string) {
  const admin = crearClienteAdmin();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(datos.email, {
    data: { nombre: datos.nombre },
    redirectTo: `${origen}${RUTA_ENLACE_CORREO}`,
  });
  if (error || !data.user) {
    throw new ConflictError(
      "No se pudo enviar la invitación. Es posible que ese correo ya tenga una cuenta.",
      "INVITACION_FALLIDA",
    );
  }

  const usuarioId = data.user.id;
  const { error: errorPerfil } = await admin.from("perfiles").insert({
    id: usuarioId,
    organizacion_id: actor.organizacion.id,
    nombre: datos.nombre,
    email: datos.email,
    rol: "INSPECTOR",
  });

  if (errorPerfil) {
    // Compensación: sin perfil la cuenta quedaría huérfana, así que se elimina.
    await admin.auth.admin.deleteUser(usuarioId);
    throw errorPerfil;
  }

  await admin.from("auditoria").insert({
    organizacion_id: actor.organizacion.id,
    actor_id: actor.id,
    recurso: "INSPECTOR",
    recurso_id: usuarioId,
    accion: "INVITADO",
  });

  return { id: usuarioId, nombre: datos.nombre, email: datos.email, activo: true };
}

// Si la invitación venció, se perdió o cayó en correo no deseado, el admin
// puede enviar un enlace nuevo. Es un enlace de "crear contraseña": sirve
// tanto si el inspector nunca entró como si olvidó su clave.
export async function reenviarAcceso(actor: Actor, inspectorId: string, origen: string) {
  // Se busca con la sesión del admin: RLS garantiza que sea de su organización.
  const inspector = await repositorio.buscarInspector(inspectorId);
  if (!inspector) throw new NotFoundError();
  if (!inspector.activo) {
    throw new ConflictError("La cuenta está desactivada. Reactívala antes de enviar el enlace.", "CUENTA_INACTIVA");
  }

  const { error } = await crearClienteCorreo().auth.resetPasswordForEmail(inspector.email, {
    redirectTo: `${origen}${RUTA_ENLACE_CORREO}`,
  });
  if (error) {
    // Supabase limita cuántos correos se envían por hora.
    throw new AppError(
      503,
      "CORREO_NO_ENVIADO",
      "No se pudo enviar el correo",
      "No se pudo enviar el correo. Espera unos minutos e intenta de nuevo.",
    );
  }

  await crearClienteAdmin().from("auditoria").insert({
    organizacion_id: actor.organizacion.id,
    actor_id: actor.id,
    recurso: "INSPECTOR",
    recurso_id: inspector.id,
    accion: "ACCESO_REENVIADO",
  });
}

export async function editarInspector(id: string, datos: InspectorEditar) {
  if (datos.activo === false) {
    const abiertas = await repositorio.contarAbiertasPorInspector([id]);
    if ((abiertas.get(id) ?? 0) > 0) {
      throw new ConflictError(
        "El inspector tiene inspecciones abiertas. Reasígnalas antes de desactivar la cuenta.",
        "INSPECTOR_CON_INSPECCIONES_ABIERTAS",
      );
    }
  }

  const inspector = await repositorio.actualizarInspector(id, datos);
  if (!inspector) throw new NotFoundError();
  return inspector;
}

export const listarOpcionesInspector = repositorio.listarOpcionesInspector;
export const contarInspectoresActivos = repositorio.contarInspectoresActivos;
