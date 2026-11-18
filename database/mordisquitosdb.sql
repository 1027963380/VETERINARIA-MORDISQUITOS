-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: mordisquitosdb
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id_cita` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `motivo` varchar(200) NOT NULL,
  `estado` varchar(30) NOT NULL,
  `fk_mascota` int DEFAULT NULL,
  `fk_usuario` int DEFAULT NULL,
  `origen` varchar(10) NOT NULL DEFAULT 'INTERNA',
  PRIMARY KEY (`id_cita`),
  KEY `fk_mascota` (`fk_mascota`),
  KEY `fk_usuario` (`fk_usuario`),
  KEY `idx_citas_fecha_hora` (`fecha`,`hora`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`fk_mascota`) REFERENCES `mascotas` (`id_mascota`),
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`fk_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
INSERT INTO `citas` VALUES (1,'2026-11-05','09:30:00','Control de seguimiento','PROGRAMADA',1,NULL,'INTERNA'),(3,'2026-12-15','10:00:00','Prueba de choque','PROGRAMADA',1,NULL,'INTERNA'),(4,'2026-12-15','11:00:00','Prueba de choque 2','PROGRAMADA',1,NULL,'INTERNA'),(5,'2026-11-16','08:00:00','Vacunación','PROGRAMADA',2,3,'INTERNA');
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultas`
--

DROP TABLE IF EXISTS `consultas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultas` (
  `id_consulta` int NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `motivo` varchar(200) NOT NULL,
  `sintomas` text,
  `diagnostico` text,
  `tratamiento` text,
  `observaciones` text,
  `peso` decimal(5,2) DEFAULT NULL,
  `fk_mascota` int DEFAULT NULL,
  `fk_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_consulta`),
  KEY `fk_mascota` (`fk_mascota`),
  KEY `fk_usuario` (`fk_usuario`),
  CONSTRAINT `consultas_ibfk_1` FOREIGN KEY (`fk_mascota`) REFERENCES `mascotas` (`id_mascota`),
  CONSTRAINT `consultas_ibfk_2` FOREIGN KEY (`fk_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultas`
--

LOCK TABLES `consultas` WRITE;
/*!40000 ALTER TABLE `consultas` DISABLE KEYS */;
INSERT INTO `consultas` VALUES (1,'2026-10-25 23:57:46','Control general','Ninguno','Saludable','Ninguno',NULL,13.20,1,1);
/*!40000 ALTER TABLE `consultas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_pedido`
--

DROP TABLE IF EXISTS `detalle_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pedido` (
  `id_detalle_pedido` int NOT NULL AUTO_INCREMENT,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `fk_pedido` int NOT NULL,
  `fk_producto` int NOT NULL,
  PRIMARY KEY (`id_detalle_pedido`),
  KEY `fk_pedido` (`fk_pedido`),
  KEY `fk_producto` (`fk_producto`),
  CONSTRAINT `detalle_pedido_ibfk_1` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `detalle_pedido_ibfk_2` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `chk_detalle_pedido_cantidad` CHECK ((`cantidad` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_pedido`
--

LOCK TABLES `detalle_pedido` WRITE;
/*!40000 ALTER TABLE `detalle_pedido` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_servicio`
--

DROP TABLE IF EXISTS `detalle_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_servicio` (
  `id_detalle_servicio` int NOT NULL AUTO_INCREMENT,
  `cantidad` int NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `fk_venta` int DEFAULT NULL,
  `fk_servicio` int DEFAULT NULL,
  PRIMARY KEY (`id_detalle_servicio`),
  KEY `fk_venta` (`fk_venta`),
  KEY `fk_servicio` (`fk_servicio`),
  CONSTRAINT `detalle_servicio_ibfk_1` FOREIGN KEY (`fk_venta`) REFERENCES `ventas` (`id_venta`),
  CONSTRAINT `detalle_servicio_ibfk_2` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_servicio`
--

LOCK TABLES `detalle_servicio` WRITE;
/*!40000 ALTER TABLE `detalle_servicio` DISABLE KEYS */;
INSERT INTO `detalle_servicio` VALUES (1,1,50000.00,50000.00,1,1),(2,1,50000.00,50000.00,2,1),(3,1,50000.00,50000.00,3,1),(4,1,50000.00,50000.00,4,1);
/*!40000 ALTER TABLE `detalle_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_venta`
--

DROP TABLE IF EXISTS `detalle_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_venta` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `fk_venta` int DEFAULT NULL,
  `fk_producto` int DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `fk_venta` (`fk_venta`),
  KEY `fk_producto` (`fk_producto`),
  CONSTRAINT `detalle_venta_ibfk_1` FOREIGN KEY (`fk_venta`) REFERENCES `ventas` (`id_venta`),
  CONSTRAINT `detalle_venta_ibfk_2` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_venta`
--

LOCK TABLES `detalle_venta` WRITE;
/*!40000 ALTER TABLE `detalle_venta` DISABLE KEYS */;
INSERT INTO `detalle_venta` VALUES (1,2,85000.00,170000.00,1,1),(2,2,85000.00,170000.00,2,1),(3,2,85000.00,170000.00,3,1),(4,2,85000.00,170000.00,4,1),(5,2,177300.00,354600.00,5,11),(6,2,85000.00,170000.00,6,1);
/*!40000 ALTER TABLE `detalle_venta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especies`
--

DROP TABLE IF EXISTS `especies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especies` (
  `id_especie` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_especie`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especies`
--

LOCK TABLES `especies` WRITE;
/*!40000 ALTER TABLE `especies` DISABLE KEYS */;
INSERT INTO `especies` VALUES (3,'Ave'),(4,'Conejo'),(2,'Gato'),(5,'Otro'),(1,'Perro');
/*!40000 ALTER TABLE `especies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mascotas`
--

DROP TABLE IF EXISTS `mascotas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mascotas` (
  `id_mascota` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `sexo` varchar(10) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `fk_propietario` int DEFAULT NULL,
  `fk_especie` int DEFAULT NULL,
  `fk_raza` int DEFAULT NULL,
  PRIMARY KEY (`id_mascota`),
  KEY `fk_propietario` (`fk_propietario`),
  KEY `fk_especie` (`fk_especie`),
  KEY `fk_raza` (`fk_raza`),
  CONSTRAINT `mascotas_ibfk_1` FOREIGN KEY (`fk_propietario`) REFERENCES `propietarios` (`id_propietario`),
  CONSTRAINT `mascotas_ibfk_2` FOREIGN KEY (`fk_especie`) REFERENCES `especies` (`id_especie`),
  CONSTRAINT `mascotas_ibfk_3` FOREIGN KEY (`fk_raza`) REFERENCES `razas` (`id_raza`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mascotas`
--

LOCK TABLES `mascotas` WRITE;
/*!40000 ALTER TABLE `mascotas` DISABLE KEYS */;
INSERT INTO `mascotas` VALUES (1,'Rocky','Macho','2022-05-10',12.50,'Café',1,1,1),(2,'Rigby','Macho','2023-07-02',4.10,'Naranja',2,2,4),(3,'Simba','Macho','2025-03-22',3.50,'Negro con cafe',3,1,17);
/*!40000 ALTER TABLE `mascotas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id_pedido` int NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'PENDIENTE',
  `tipo_entrega` varchar(10) NOT NULL,
  `direccion_entrega` varchar(200) DEFAULT NULL,
  `telefono_contacto` varchar(20) NOT NULL,
  `notas` varchar(200) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `costo_envio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `fk_propietario` int NOT NULL,
  `fk_atendido_por` int DEFAULT NULL,
  `fk_venta` int DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `fk_atendido_por` (`fk_atendido_por`),
  KEY `fk_venta` (`fk_venta`),
  KEY `idx_pedidos_estado_fecha` (`estado`,`fecha`),
  KEY `idx_pedidos_propietario` (`fk_propietario`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`fk_propietario`) REFERENCES `propietarios` (`id_propietario`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`fk_atendido_por`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `pedidos_ibfk_3` FOREIGN KEY (`fk_venta`) REFERENCES `ventas` (`id_venta`),
  CONSTRAINT `chk_pedidos_tipo` CHECK ((`tipo_entrega` in (_utf8mb4'DOMICILIO',_utf8mb4'RECOGER'))),
  CONSTRAINT `chk_pedidos_total` CHECK (((`subtotal` >= 0) and (`costo_envio` >= 0) and (`total` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `marca` varchar(80) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL,
  `stock_minimo` int NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `imagen_url` varchar(500) DEFAULT NULL,
  `visible_tienda` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_producto`),
  KEY `idx_productos_nombre` (`nombre`),
  KEY `idx_productos_tipo_marca` (`tipo`,`marca`),
  KEY `idx_productos_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `chk_productos_precio` CHECK ((`precio` >= 0)),
  CONSTRAINT `chk_productos_stock` CHECK (((`stock` >= 0) and (`stock_minimo` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Concentrado Premium 10kg','Alimento','Dog Chow',85000.00,10,5,'2027-06-30',NULL,NULL,1),(11,'Collar antipulgas','Accesorio','Seresto',177300.00,18,3,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `propietarios`
--

DROP TABLE IF EXISTS `propietarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `propietarios` (
  `id_propietario` int NOT NULL AUTO_INCREMENT,
  `documento` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_propietario`),
  UNIQUE KEY `documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `propietarios`
--

LOCK TABLES `propietarios` WRITE;
/*!40000 ALTER TABLE `propietarios` DISABLE KEYS */;
INSERT INTO `propietarios` VALUES (1,'1001','María López','3001234567','Calle 10 # 5-20','maria@correo.com'),(2,'1002','Jhon Freddy Rengifo Córdoba','3136169738',NULL,'jhon@gmail.com'),(3,'1040379579','Emanuel Gárces','3135635013',NULL,'garcesfabraemanuel@gmail.com');
/*!40000 ALTER TABLE `propietarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `razas`
--

DROP TABLE IF EXISTS `razas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `razas` (
  `id_raza` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `fk_especie` int DEFAULT NULL,
  PRIMARY KEY (`id_raza`),
  KEY `fk_especie` (`fk_especie`),
  CONSTRAINT `razas_ibfk_1` FOREIGN KEY (`fk_especie`) REFERENCES `especies` (`id_especie`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `razas`
--

LOCK TABLES `razas` WRITE;
/*!40000 ALTER TABLE `razas` DISABLE KEYS */;
INSERT INTO `razas` VALUES (1,'Labrador',1),(2,'Criollo',2),(3,'Siamés',2),(4,'Persa',2),(5,'Criollo',1),(6,'Golden Retriever',1),(7,'Pastor Alemán',1),(8,'Chihuahua',1),(9,'Poodle',1),(17,'Pinscher',1);
/*!40000 ALTER TABLE `razas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id_servicio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_servicio`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'Consulta general','Revisión médica general',50000.00);
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol` varchar(30) NOT NULL,
  `fk_propietario` int DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `usuario` (`usuario`),
  UNIQUE KEY `uq_usuarios_propietario` (`fk_propietario`),
  CONSTRAINT `fk_usuarios_propietario` FOREIGN KEY (`fk_propietario`) REFERENCES `propietarios` (`id_propietario`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador Prueba','admin','$2b$10$F2bMespv48krHEcOScuXKehW3dW7SmmRpdxKmWyJoohnW81nFvGEy','ADMIN',NULL),(2,'Recepcionista Prueba','recepcion','$2b$10$MmveqWH9It/cbvsWvS4aXeppl4vpHclRKPEkpC04s4pW9NgYZfgbm','RECEPCIONISTA',NULL),(3,'Veterinario Prueba','vet','$2b$10$uhfrA5lo.1wbpRohQ2Fj0uAp8VLP9tWcHSq8GsdgfZcgQ8FEOAl/2','VETERINARIO',NULL),(6,'Jheri Rengifo','jheri','$2b$10$wvLyn/Ga10YTrSz0biL7suvRFG6mO/YnpjhTCFJXJFuWHWcrm0bbO','ADMIN',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacunaciones`
--

DROP TABLE IF EXISTS `vacunaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacunaciones` (
  `id_vacunacion` int NOT NULL AUTO_INCREMENT,
  `fecha_aplicacion` date NOT NULL,
  `proxima_fecha` date DEFAULT NULL,
  `lote` varchar(50) DEFAULT NULL,
  `observaciones` varchar(200) DEFAULT NULL,
  `fk_mascota` int DEFAULT NULL,
  `fk_vacuna` int DEFAULT NULL,
  `fk_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_vacunacion`),
  KEY `fk_mascota` (`fk_mascota`),
  KEY `fk_vacuna` (`fk_vacuna`),
  KEY `fk_usuario` (`fk_usuario`),
  CONSTRAINT `vacunaciones_ibfk_1` FOREIGN KEY (`fk_mascota`) REFERENCES `mascotas` (`id_mascota`),
  CONSTRAINT `vacunaciones_ibfk_2` FOREIGN KEY (`fk_vacuna`) REFERENCES `vacunas` (`id_vacuna`),
  CONSTRAINT `vacunaciones_ibfk_3` FOREIGN KEY (`fk_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacunaciones`
--

LOCK TABLES `vacunaciones` WRITE;
/*!40000 ALTER TABLE `vacunaciones` DISABLE KEYS */;
INSERT INTO `vacunaciones` VALUES (1,'2026-10-25','2027-10-26','L-2026-01',NULL,1,1,1),(2,'2025-11-17','2026-05-17',NULL,NULL,3,2,6),(3,'2025-12-16','2026-12-16',NULL,NULL,2,1,6);
/*!40000 ALTER TABLE `vacunaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacunas`
--

DROP TABLE IF EXISTS `vacunas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacunas` (
  `id_vacuna` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `periodicidad` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_vacuna`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacunas`
--

LOCK TABLES `vacunas` WRITE;
/*!40000 ALTER TABLE `vacunas` DISABLE KEYS */;
INSERT INTO `vacunas` VALUES (1,'Rabia','Vacuna antirrábica','Anual'),(2,'Viruela','Protege contra la viruela','Anual');
/*!40000 ALTER TABLE `vacunas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id_venta` int NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(30) NOT NULL,
  `fk_propietario` int DEFAULT NULL,
  `fk_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_venta`),
  KEY `fk_usuario` (`fk_usuario`),
  KEY `fk_propietario` (`fk_propietario`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`fk_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`fk_propietario`) REFERENCES `propietarios` (`id_propietario`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,'2026-10-25 23:54:32',220000.00,'EFECTIVO',1,1),(2,'2026-10-28 16:28:48',220000.00,'EFECTIVO',1,1),(3,'2026-10-29 10:49:33',220000.00,'EFECTIVO',1,1),(4,'2026-10-29 14:51:15',220000.00,'EFECTIVO',1,1),(5,'2026-11-17 09:19:51',354600.00,'EFECTIVO',1,6),(6,'2026-11-17 09:28:57',170000.00,'TARJETA',3,6);
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-18 15:32:23
