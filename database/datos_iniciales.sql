-- database/datos_iniciales.sql
-- Catalogos con que arranca el sistema, tal como estaban el 11 de octubre de
-- 2026: sedes, horario de atencion, categorias, servicios, especies, razas e
-- informacion de la clinica. NO incluye cuentas, mascotas ni citas.
-- Se ejecuta una sola vez, despues de esquema.sql (ver docs/instalacion.md).
-- Las fotos de servicios y de la galeria no viajan aqui: se cargan con
--   npm run seed:fotos-servicios   y   npm run seed:galeria

--
-- PostgreSQL database dump
--



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: categoria_servicio; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('0eb1bf6f-8736-407b-a3f8-182beae6b692', 'Consulta', 'blue', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('9ef7ca70-f9e7-46e0-893b-5a4016d7f964', 'Vacunación', 'amber', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('10dbb4a1-6956-414e-8c28-4472ffc57db0', 'Preventiva', 'teal', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('f1ecc1a4-223d-45b2-bfb9-160043acf549', 'Revisión de rutina', 'teal', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('ff414fe4-97b5-4e3c-b1c2-20c486cbb1a5', 'Control de peso', 'purple', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('c47e57b5-5599-43cb-a81e-542c60733203', 'Diagnóstico', 'purple', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('e50c6f11-d034-4ed9-a558-f8459f9baf4d', 'Limpieza dental', 'pink', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('d672eb1f-ff11-44a8-a4d6-7c5e36903612', 'Cirugía', 'pink', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('8a9fb775-3906-4e36-832b-450f67a9c1a1', 'Desparasitación', 'cyan', '2026-09-23 15:27:47.747106', true);
INSERT INTO public.categoria_servicio (id, nombre, color, creado_en, activo) VALUES ('05f56d37-5a3e-40a0-ba7b-d5de6335ec2d', 'Especialidad', 'orange', '2026-09-23 15:27:47.747106', true);


--
-- Data for Name: especie; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.especie (id, nombre, icono, orden, activo, creado_en) VALUES ('86321073-5bfb-487b-a5ec-961b38885ba2', 'Canino', 'perro', 0, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.especie (id, nombre, icono, orden, activo, creado_en) VALUES ('15307275-def2-4ab8-abd4-de9276f7aa67', 'Felino', 'gato', 1, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.especie (id, nombre, icono, orden, activo, creado_en) VALUES ('0827f224-92e1-4d5e-81e4-d257a6d321da', 'Ave', 'ave', 2, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.especie (id, nombre, icono, orden, activo, creado_en) VALUES ('0b14387e-bfc5-4c57-9359-15104ccc1f6b', 'Otro', 'pata', 3, true, '2026-10-08 17:28:45.7612');


--
-- Data for Name: sede; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sede (id, nombre, ciudad, creado_en, direccion, foto_url, activo, es_principal, codigo, tiene_parqueadero, sala_pet_friendly) VALUES ('c5df21e9-7390-437c-9f5f-a1d384f0defa', 'Clinica Veterinaria UDES Bucaramanga', 'Bucaramanga', '2026-09-14 19:53:12.552967', '', 'https://cloudfront-us-east-1.images.arcpublishing.com/vanguardiaeluniversal/JNQRYUVWZRCKHMURMF3HYL4KRQ.jpg', true, true, 'BGA', false, false);
INSERT INTO public.sede (id, nombre, ciudad, creado_en, direccion, foto_url, activo, es_principal, codigo, tiene_parqueadero, sala_pet_friendly) VALUES ('212ac8c6-c6d2-4c08-8f27-3cfa6b7dee14', 'Clinica Veterinaria UDES Valledupar', 'Valledupar', '2026-09-14 19:53:12.552967', '', 'https://interpolitico.com/inicio/wp-content/uploads/2020/02/clinicaudes.jpg', true, false, 'VUP', false, false);


--
-- Data for Name: horario_atencion; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('ad2651fe-3539-4aa0-8351-e67d40cd7985', 'c5df21e9-7390-437c-9f5f-a1d384f0defa', 2, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('9692c1de-e91c-4ece-bc85-e40b3e073cca', 'c5df21e9-7390-437c-9f5f-a1d384f0defa', 3, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('d3783800-f772-452c-bb6e-ff9f50eb3014', 'c5df21e9-7390-437c-9f5f-a1d384f0defa', 4, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('955b7f99-4d3c-4461-83f9-6de99cc39e92', 'c5df21e9-7390-437c-9f5f-a1d384f0defa', 5, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('bfe54079-7c8f-4e69-8f4e-b79827796717', 'c5df21e9-7390-437c-9f5f-a1d384f0defa', 6, '08:00:00', '12:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('bd174fb0-880a-4c4f-b230-7643aa1f1a75', '212ac8c6-c6d2-4c08-8f27-3cfa6b7dee14', 1, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('5b7bbbc0-68d7-4b40-8d62-d75bb464ee3b', '212ac8c6-c6d2-4c08-8f27-3cfa6b7dee14', 2, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('3eedf042-552b-4243-aee5-9160c114c7f3', '212ac8c6-c6d2-4c08-8f27-3cfa6b7dee14', 3, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('4e1abad8-b532-408d-929e-5cbaca36bd3b', '212ac8c6-c6d2-4c08-8f27-3cfa6b7dee14', 4, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('667132b8-3f01-465d-bb1a-400f21b95a8a', '212ac8c6-c6d2-4c08-8f27-3cfa6b7dee14', 5, '08:00:00', '17:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('40253ac4-21d3-4497-8275-69b63200e5be', '212ac8c6-c6d2-4c08-8f27-3cfa6b7dee14', 6, '08:00:00', '12:00:00', '2026-09-15 23:34:59.26256');
INSERT INTO public.horario_atencion (id, sede_id, dia_semana, hora_inicio, hora_fin, creado_en) VALUES ('9167f5a2-8bc4-4e95-8c32-a6fd64f0d1f3', 'c5df21e9-7390-437c-9f5f-a1d384f0defa', 1, '08:00:00', '18:00:00', '2026-09-23 15:01:10.233796');


--
-- Data for Name: informacion_clinica; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.informacion_clinica (id, whatsapp_numero, whatsapp_activo, instagram_url, facebook_url, tiktok_url, youtube_url, actualizado_en) VALUES (1, '573227621383', true, 'https://www.instagram.com/clinicaveterinariaudes/?hl=es', 'https://www.facebook.com/clinicaveterinariaudes/?locale=es_LA', NULL, NULL, '2026-10-10 23:08:48.579705');


--
-- Data for Name: raza; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('ac2ef92e-58e4-4e86-8422-da8605f9bef5', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Criollo / mestizo', 0, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('e1338384-a787-405a-b2e1-654901d4d1aa', '86321073-5bfb-487b-a5ec-961b38885ba2', 'No sé la raza', 1, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('dd3928af-9509-435a-89c7-d3b0779b2929', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Akita', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('bcef3a62-3d39-4181-83f1-38f88599fe6c', '86321073-5bfb-487b-a5ec-961b38885ba2', 'American bully', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('19a54fbc-3fd8-4be4-97c3-63276b302bed', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Basset hound', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('f8fbeb84-6a93-4b05-a3d2-9491da6ac844', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Beagle', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('55aed50f-bf75-4550-9c5f-5b5eca2bae9b', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Bichón frisé', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('7c7b456d-7f93-4229-9c94-d248bf93a691', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Border collie', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('0307c8a8-f5ad-43eb-894d-5c6568c54700', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Bóxer', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('62f94a35-2c1c-4141-a080-9049f550b678', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Bull terrier', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('b64cc61d-92d8-4086-82e4-ec0b3b75df5f', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Bulldog francés', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('26340210-8dc5-4a51-8c59-26582587f05d', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Bulldog inglés', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('a9a63a81-0ca3-4ad0-b4e4-fabc5985b319', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Cane corso', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('ea86967b-3cf9-469b-8acb-594ae384d6d5', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Caniche (poodle)', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('c1c83009-a104-48f0-b038-53d4d6588210', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Chihuahua', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('fc58eb8b-f066-482b-9f8c-41f3bb333b3f', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Chow chow', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('63b07904-15ec-4860-ba89-23313a2692b1', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Cocker spaniel', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('2fa37595-c803-44e0-a473-59b894b72818', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Corgi', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('03066599-10ae-42dd-b930-ba1afbb301de', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Dachshund (salchicha)', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('18010db5-e733-4198-b729-3b51572763a7', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Dálmata', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('a60c4d30-7cc7-46ea-b868-7e8a3034e73c', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Doberman', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('fdef143c-f124-42f3-82cf-92ff48cb4af2', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Golden retriever', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('a4fe8405-9864-4cf8-8c76-150ffe3fdf88', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Gran danés', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('a625a567-30fc-40c5-be2c-a7d2031b2b53', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Husky siberiano', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('bc6347be-2e47-4f1b-a211-cdd2cea077fd', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Jack Russell terrier', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('f124abf7-24ba-4d50-85f4-d77a9bbb69b9', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Labrador retriever', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('77674189-9229-4048-88a6-20a059ac33f9', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Maltés', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('dfafcd63-092b-44e9-a24b-35ac970f1766', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Mastín', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('477aee1c-2b7e-41ea-92d4-47e3bf28724b', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Pastor alemán', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('41bb4b72-d59e-412f-b5f9-b861dafd89c1', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Pastor belga', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('7ed0fabe-2180-4544-ab0d-7481d87c3e39', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Pinscher miniatura', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('ed26919a-c11d-4e62-9fa1-cc3631028301', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Pitbull', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('951cb734-c97a-4db2-a45e-42158d5b3e83', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Pomerania', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('6c9a3b3d-4eda-47ab-b024-2a5767ab9c77', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Pug', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('3bff5c62-0739-4a8e-b55b-9e0deaca483f', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Rottweiler', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('db4d0432-b61a-480d-87e6-6908a651f20f', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Samoyedo', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('90c49044-a6dc-4965-9b53-73f110343daa', '86321073-5bfb-487b-a5ec-961b38885ba2', 'San Bernardo', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('739263cb-9875-42e9-864f-c2cb6b95f212', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Schnauzer', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('4110173a-1ce3-45f6-9cb7-88672546ab95', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Shar pei', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('cba6837d-6df8-4476-9076-5b8cc276688b', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Shih tzu', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('2fdfc82a-0aba-4969-ac19-a39997046840', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Weimaraner', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('bdcc7acb-cf4a-413a-aeaf-266efa73f991', '86321073-5bfb-487b-a5ec-961b38885ba2', 'Yorkshire terrier', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('807520bb-c589-4dbe-9bcb-e3f4cc94fad6', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Criollo / mestizo', 0, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('db9e3de4-8beb-4fd1-8b7f-89dd2c722b8c', '15307275-def2-4ab8-abd4-de9276f7aa67', 'No sé la raza', 1, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('86fdf001-1d62-444f-835f-9ff07712d805', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Abisinio', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('8c1f71f0-7097-45bd-8b20-75892ce07267', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Angora turco', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('0813ebbe-9fa2-43ce-82c1-52ba09d3f6e6', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Azul ruso', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('4ab98d47-c094-4ec7-90ac-781fedac6e4d', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Bengalí', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('97c3e0f7-254a-4484-9cbe-a4dc4cd6383a', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Bombay', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('b07a62f3-1629-4574-92a2-888dc4815faa', '15307275-def2-4ab8-abd4-de9276f7aa67', 'British shorthair', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('44b4704f-ac42-4a6e-ab2a-3ede5cba5c9f', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Esfinge (sphynx)', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('f1e3896e-96d2-4311-9c0c-83224d0f1ffd', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Exótico de pelo corto', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('b976c243-2017-463e-b8a7-af2b221cc626', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Himalayo', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('7a053a7e-59a2-419f-806d-d244e8c7a354', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Maine coon', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('ed45fb89-8184-4ede-a5e9-88c0dd80c2cb', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Persa', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('6b8c7658-5b00-4f10-92e7-acc37f28a658', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Ragdoll', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('ba1ca671-6608-457e-b840-1790b2f78d16', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Sagrado de Birmania', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('171d43c6-39c2-4047-bc14-cc813496c0c9', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Scottish fold', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('d393ad16-27f6-4f5d-9206-dd7170b9c3a5', '15307275-def2-4ab8-abd4-de9276f7aa67', 'Siamés', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('7dd2d308-ba7d-4e7c-ba57-0784d8c8f40f', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'No sé la raza', 1, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('1e0fcbf8-31d9-457e-bba0-b23798965f43', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Agapornis', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('0a46b575-1bb8-409b-88fe-ea52144a3020', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Cacatúa', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('57bb2336-ac84-49a4-8e8d-40f06421b690', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Canario', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('f56b772e-e656-40c5-b7ae-ed1b8ab34759', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Gallina', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('3544ae81-33c9-42c1-943f-713e53a1ee34', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Guacamaya', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('e440a3e1-71e6-4a7d-9fc1-cc5c8ddebeb7', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Loro', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('d0016ce1-5e2c-408c-b32a-e481951e97c7', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Ninfa (cocotilla)', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('1a6d557c-15be-4548-bd21-3e22b4cbea2c', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Paloma', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('929c02e4-ccd2-4944-80c6-e330523b37ad', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Periquito australiano', 100, true, '2026-10-08 17:28:45.7612');
INSERT INTO public.raza (id, especie_id, nombre, orden, activo, creado_en) VALUES ('067a6769-5742-465f-bfa2-65ccaf62825e', '0827f224-92e1-4d5e-81e4-d257a6d321da', 'Pinzón', 100, true, '2026-10-08 17:28:45.7612');


--
-- Data for Name: servicio; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('c1f220be-561d-438c-a9ca-74e3f68fa85a', 'Radiología', 'Estudios radiográficos para diagnóstico por imagen.', true, '2026-09-15 23:08:37.527567', 'c47e57b5-5599-43cb-a81e-542c60733203', 90000, 30, '/uploads/servicios/94bdf2c4-32c8-480d-b87c-6a4dacb88e9a.jpg', 'Personal veterinario con chalecos de protección posicionando a un perro en el equipo de rayos X', 58, 50, true);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('584ae2b3-51be-4336-8aa5-8f66fa29cd90', 'Profilaxis dental', 'Limpieza dental y prevención de enfermedad periodontal.', true, '2026-09-15 23:08:37.527567', 'e50c6f11-d034-4ed9-a558-f8459f9baf4d', 80000, 30, '/uploads/servicios/02f6c08c-3ff1-4065-9617-19c65744cc40.jpg', 'Veterinaria revisando los dientes de un perro blanco mientras un colega lo sostiene', 45, 35, true);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('f735e325-bb64-4cb3-a7fd-a0fdffbe2b58', 'Vacunación', 'Esquemas de vacunación para perros y gatos.', true, '2026-09-15 23:08:37.527567', '9ef7ca70-f9e7-46e0-893b-5a4016d7f964', 45000, 30, '/uploads/servicios/40dc00c9-d6f6-4312-9866-1b8b985171fa.jpg', 'Veterinaria vacunando a un perro blanco mientras un colega lo sostiene', 40, 35, true);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('b5447fac-e0a9-480c-bc41-11bcad4e8387', 'Consulta médica', 'Valoración y diagnóstico veterinario general.', true, '2026-09-15 23:08:37.527567', '0eb1bf6f-8736-407b-a3f8-182beae6b692', 60000, 30, '/uploads/servicios/dad9d575-e7e9-4006-8a27-ce6f8c55b020.png', 'Veterinario auscultando a un perro sobre la mesa de consulta mientras una auxiliar lo sostiene', 52, 55, true);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('74b5298b-58c2-42da-ba7a-789350e0042c', 'Cirugía', 'Procedimientos quirúrgicos con seguimiento post-operatorio.', true, '2026-09-15 23:08:37.527567', 'd672eb1f-ff11-44a8-a4d6-7c5e36903612', 350000, 30, '/uploads/servicios/12df1e1b-f0fb-42e2-9fda-765ea07e8c7e.webp', 'Cirujano veterinario revisando a un perro blanco con collar isabelino', 48, 45, false);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('49f6ce02-52de-43e3-9c0d-1a305777c741', 'Desparasitación', 'Control de parásitos internos y externos.', true, '2026-09-15 23:08:37.527567', '8a9fb775-3906-4e36-832b-450f67a9c1a1', 35000, 30, '/uploads/servicios/d24effdc-d86c-436f-b337-19dbe0a6970d.jpg', 'Veterinaria aplicando tratamiento antiparasitario a un perro blanco con manchas', 42, 50, true);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('d668afce-905f-4a6d-8d85-288ee66aceb9', 'Laboratorio clínico', 'Exámenes de sangre, orina y otras pruebas diagnósticas.', true, '2026-09-15 23:08:37.527567', 'c47e57b5-5599-43cb-a81e-542c60733203', 70000, 30, '/uploads/servicios/dfae8d53-a63d-40ce-9b87-b5cb361319cb.webp', 'Toma de muestra de sangre de la pata de un perro para examen de laboratorio', 55, 50, true);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('ef973eb2-321d-4bb8-acec-03e12bf0133a', 'Endoscopia', 'Procedimientos endoscópicos diagnósticos y terapéuticos.', true, '2026-09-15 23:08:37.527567', '05f56d37-5a3e-40a0-ba7b-d5de6335ec2d', 200000, 30, '/uploads/servicios/e1e76223-b529-41f8-be09-3546442daa2f.webp', 'Dos veterinarios realizando una endoscopia mientras observan el monitor', 40, 40, false);
INSERT INTO public.servicio (id, nombre, descripcion, activo, creado_en, categoria_id, precio, duracion_minutos, foto_url, foto_descripcion, foto_foco_x, foto_foco_y, foto_fondo_claro) VALUES ('2f336b8e-328d-44e4-b4f8-66b4a9b52939', 'Oncología', 'Diagnóstico y tratamiento de enfermedades oncológicas.', true, '2026-09-15 23:08:37.527567', '05f56d37-5a3e-40a0-ba7b-d5de6335ec2d', 150000, 30, '/uploads/servicios/07d45460-aa53-4575-b7ec-bc813b94bc31.png', 'Dos veterinarios examinando a un perro pequeño sobre la mesa de tratamiento', 55, 65, false);


--
-- PostgreSQL database dump complete
--


