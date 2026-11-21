package com.inmocheck.auditoria;

import com.inmocheck.auditoria.AuditoriaRepository.Evento;
import com.inmocheck.auditoria.AuditoriaRepository.Filtro;
import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import org.springframework.stereotype.Service;

// Consulta de la auditoría (equivale a app/api/v1/auditoria del BFF).
@Service
public class AuditoriaService {

	private final EjecutorRls ejecutor;
	private final AuditoriaRepository repositorio;

	public AuditoriaService(EjecutorRls ejecutor, AuditoriaRepository repositorio) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
	}

	public Pagina<Evento> listar(Actor actor, Filtro filtro, ParametrosPagina pagina) {
		return ejecutor.ejecutar(actor.token(), jdbc -> Pagina.de(
				repositorio.listar(jdbc, filtro, pagina),
				repositorio.contar(jdbc, filtro),
				pagina));
	}
}
