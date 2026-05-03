# ---- Stage 1: build ----
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copia dependencias primeiro (cache de camadas)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copia codigo e compila
COPY src ./src
RUN mvn package -DskipTests -q

# ---- Stage 2: runtime ----
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /build/target/promobot-1.0.0-SNAPSHOT.jar app.jar

# Cria usuario nao-root por seguranca
RUN addgroup -S promobot && adduser -S promobot -G promobot
USER promobot

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
