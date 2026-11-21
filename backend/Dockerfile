# Imagen del backend de InmoCheck (la que despliega Render; ver render.yaml).
# Dos etapas: una compila con Maven y la otra solo corre el .jar con Java 21.
# Las pruebas NO corren aquí: necesitan la base de Supabase y se corren antes
# de subir los cambios (.\mvnw.cmd test).

# ---------- 1. Compilar ----------
FROM eclipse-temurin:21-jdk AS compilacion
WORKDIR /app

# Primero solo lo que define las dependencias: si no cambia el pom, Docker
# reutiliza esta capa y no las vuelve a descargar.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# Por si mvnw llega con finales de línea de Windows.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -B dependency:go-offline

COPY src/ src/
RUN ./mvnw -q -B package -DskipTests && cp target/inmocheck-backend-*.jar app.jar

# ---------- 2. Correr ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Sin privilegios de administrador dentro del contenedor.
RUN useradd --system --create-home inmocheck
USER inmocheck

COPY --from=compilacion /app/app.jar app.jar

# El plan gratis de Render tiene 512 MB: la JVM usa como máximo el 75 % y un
# recolector de basura pequeño. Render entrega el puerto en PORT (application.yml).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
