package com.inmocheck;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

// Comprueba que la aplicación arranca completa y que la ruta de salud que
// usará AWS responde UP.
@SpringBootTest(properties = "inmocheck.supabase.url=https://prueba.supabase.co")
@AutoConfigureMockMvc
class SaludTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void laSaludRespondeUp() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("UP"));
	}
}
