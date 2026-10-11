-- database/esquema.sql
-- Esquema COMPLETO de la base de datos (estructura, sin datos), generado con
-- pg_dump el 11 de octubre de 2026. Equivale a ejecutar en orden todos los
-- archivos incremento_*.sql de esta carpeta, que se conservan como historial.
--
-- Para instalar el sistema desde cero basta este archivo (ver
-- docs/instalacion.md). Cada vez que se agregue un incremento_*.sql hay que
-- regenerarlo:
--   pg_dump --schema-only --no-owner --no-privileges -U postgres clinica_veterinaria_udes

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bitacora; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bitacora (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid,
    usuario_rol character varying(30),
    accion character varying(60) NOT NULL,
    entidad character varying(40) NOT NULL,
    entidad_id character varying(60),
    detalle text,
    creado_en timestamp without time zone DEFAULT now()
);


--
-- Name: bloqueo_medico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bloqueo_medico (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    medico_id uuid NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    motivo character varying(150),
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT bloqueo_medico_check CHECK ((fecha_inicio <= fecha_fin)),
    CONSTRAINT bloqueo_medico_check1 CHECK (((hora_inicio IS NULL) = (hora_fin IS NULL))),
    CONSTRAINT bloqueo_medico_check2 CHECK (((hora_inicio IS NULL) OR (hora_inicio < hora_fin)))
);


--
-- Name: categoria_servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria_servicio (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(40) NOT NULL,
    color character varying(20) NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT categoria_servicio_color_check CHECK (((color)::text = ANY ((ARRAY['blue'::character varying, 'amber'::character varying, 'teal'::character varying, 'purple'::character varying, 'pink'::character varying, 'cyan'::character varying, 'orange'::character varying])::text[])))
);


--
-- Name: cita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cita (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid NOT NULL,
    sede_id uuid NOT NULL,
    fecha_hora timestamp without time zone NOT NULL,
    duracion_minutos integer DEFAULT 30 NOT NULL,
    motivo character varying(255),
    estado character varying(20) DEFAULT 'agendada'::character varying NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    actualizado_en timestamp without time zone DEFAULT now(),
    servicio_id uuid NOT NULL,
    medico_id uuid NOT NULL,
    mascota_id uuid NOT NULL,
    codigo character varying(20) NOT NULL,
    recordatorio_enviado_en timestamp without time zone,
    CONSTRAINT cita_estado_check CHECK (((estado)::text = ANY ((ARRAY['agendada'::character varying, 'cancelada'::character varying])::text[])))
);


--
-- Name: codigo_recuperacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigo_recuperacion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    codigo_hash character varying(255) NOT NULL,
    intentos integer DEFAULT 0 NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    creado_en timestamp without time zone DEFAULT now()
);


--
-- Name: consecutivo_cita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consecutivo_cita (
    sede_id uuid NOT NULL,
    anio integer NOT NULL,
    ultimo integer DEFAULT 0 NOT NULL
);


--
-- Name: especie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.especie (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(50) NOT NULL,
    icono character varying(20) DEFAULT 'pata'::character varying NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT especie_icono_check CHECK (((icono)::text = ANY ((ARRAY['perro'::character varying, 'gato'::character varying, 'ave'::character varying, 'pata'::character varying])::text[])))
);


--
-- Name: foto_galeria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.foto_galeria (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    foto_url character varying(255) NOT NULL,
    descripcion character varying(200) NOT NULL,
    foco_x smallint DEFAULT 50 NOT NULL,
    foco_y smallint DEFAULT 50 NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT foto_galeria_foco_x_check CHECK (((foco_x >= 0) AND (foco_x <= 100))),
    CONSTRAINT foto_galeria_foco_y_check CHECK (((foco_y >= 0) AND (foco_y <= 100)))
);


--
-- Name: horario_atencion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horario_atencion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sede_id uuid NOT NULL,
    dia_semana smallint NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT horario_atencion_check CHECK ((hora_inicio < hora_fin)),
    CONSTRAINT horario_atencion_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: horario_medico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horario_medico (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    medico_id uuid NOT NULL,
    sede_id uuid NOT NULL,
    dia_semana smallint NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    pausa_inicio time without time zone,
    pausa_fin time without time zone,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT horario_medico_check CHECK ((hora_inicio < hora_fin)),
    CONSTRAINT horario_medico_check1 CHECK (((pausa_inicio IS NULL) = (pausa_fin IS NULL))),
    CONSTRAINT horario_medico_check2 CHECK (((pausa_inicio IS NULL) OR ((pausa_inicio >= hora_inicio) AND (pausa_fin <= hora_fin) AND (pausa_inicio < pausa_fin)))),
    CONSTRAINT horario_medico_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: informacion_clinica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.informacion_clinica (
    id smallint DEFAULT 1 NOT NULL,
    whatsapp_numero character varying(15),
    whatsapp_activo boolean DEFAULT true NOT NULL,
    instagram_url character varying(200),
    facebook_url character varying(200),
    tiktok_url character varying(200),
    youtube_url character varying(200),
    actualizado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT informacion_clinica_id_check CHECK ((id = 1))
);


--
-- Name: mascota; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mascota (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    especie character varying(50),
    raza character varying(80),
    foto_url character varying(255),
    creado_en timestamp without time zone DEFAULT now(),
    fecha_nacimiento date,
    sexo character varying(10),
    color character varying(50),
    peso_kg numeric(5,2),
    caracteristicas text,
    activo boolean DEFAULT true NOT NULL,
    alergias text,
    medicamentos text,
    condiciones_medicas text,
    observaciones text,
    CONSTRAINT mascota_sexo_check CHECK (((sexo)::text = ANY ((ARRAY['macho'::character varying, 'hembra'::character varying])::text[])))
);


--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo character varying(30) NOT NULL,
    titulo character varying(120) NOT NULL,
    mensaje character varying(400) NOT NULL,
    enlace character varying(120),
    leida boolean DEFAULT false NOT NULL,
    creado_en timestamp without time zone DEFAULT now()
);


--
-- Name: raza; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.raza (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especie_id uuid NOT NULL,
    nombre character varying(80) NOT NULL,
    orden integer DEFAULT 100 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now()
);


--
-- Name: recordatorio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recordatorio (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tipo character varying(20) NOT NULL,
    titulo character varying(120) NOT NULL,
    descripcion character varying(300),
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    mascota_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    medico_id uuid NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT recordatorio_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['medicacion'::character varying, 'control'::character varying, 'vacunacion'::character varying, 'desparasitacion'::character varying, 'otro'::character varying])::text[])))
);


--
-- Name: registro_pendiente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registro_pendiente (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    correo character varying(150) NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    telefono character varying(20),
    codigo_hash character varying(255) NOT NULL,
    intentos integer DEFAULT 0 NOT NULL,
    expira_en timestamp with time zone NOT NULL,
    codigo_enviado_en timestamp with time zone DEFAULT now() NOT NULL,
    autorizo_tratamiento_en timestamp with time zone DEFAULT now() NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sede; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sede (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    ciudad character varying(100) NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    direccion character varying(200),
    foto_url character varying(255),
    activo boolean DEFAULT true,
    es_principal boolean DEFAULT false NOT NULL,
    codigo character varying(5) NOT NULL,
    tiene_parqueadero boolean DEFAULT false NOT NULL,
    sala_pet_friendly boolean DEFAULT false NOT NULL
);


--
-- Name: servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT now(),
    categoria_id uuid NOT NULL,
    precio integer DEFAULT 0 NOT NULL,
    duracion_minutos integer DEFAULT 30 NOT NULL,
    foto_url character varying(255),
    foto_descripcion character varying(200),
    foto_foco_x smallint DEFAULT 50 NOT NULL,
    foto_foco_y smallint DEFAULT 50 NOT NULL,
    foto_fondo_claro boolean DEFAULT true NOT NULL,
    CONSTRAINT servicio_duracion_minutos_check CHECK ((duracion_minutos > 0)),
    CONSTRAINT servicio_foto_foco_x_check CHECK (((foto_foco_x >= 0) AND (foto_foco_x <= 100))),
    CONSTRAINT servicio_foto_foco_y_check CHECK (((foto_foco_y >= 0) AND (foto_foco_y <= 100))),
    CONSTRAINT servicio_precio_check CHECK ((precio >= 0))
);


--
-- Name: servicio_medico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio_medico (
    servicio_id uuid NOT NULL,
    medico_id uuid NOT NULL
);


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    correo character varying(150) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    rol character varying(30) NOT NULL,
    sede_id uuid,
    telefono character varying(20),
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT now(),
    documento character varying(20),
    foto_url character varying(255),
    biografia character varying(500),
    direccion character varying(200),
    titulos_profesionales character varying(500),
    registro_profesional character varying(50),
    anios_experiencia character varying(10),
    debe_cambiar_contrasena boolean DEFAULT false NOT NULL,
    sesiones_validas_desde timestamp with time zone,
    autorizo_tratamiento_en timestamp with time zone,
    CONSTRAINT usuario_anios_experiencia_check CHECK (((anios_experiencia)::text = ANY ((ARRAY['0-1'::character varying, '1-3'::character varying, '3-5'::character varying, '5-10'::character varying, '10+'::character varying])::text[]))),
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['superadministrador'::character varying, 'administrador'::character varying, 'veterinario'::character varying, 'cliente'::character varying])::text[])))
);


--
-- Name: usuario_especialidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_especialidad (
    usuario_id uuid NOT NULL,
    categoria_id uuid NOT NULL
);


--
-- Name: verificacion_correo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_correo (
    usuario_id uuid NOT NULL,
    correo_nuevo character varying(150) NOT NULL,
    codigo_hash character varying(255) NOT NULL,
    intentos integer DEFAULT 0 NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    creado_en timestamp without time zone DEFAULT now()
);


--
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (id);


--
-- Name: bloqueo_medico bloqueo_medico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueo_medico
    ADD CONSTRAINT bloqueo_medico_pkey PRIMARY KEY (id);


--
-- Name: categoria_servicio categoria_servicio_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria_servicio
    ADD CONSTRAINT categoria_servicio_nombre_key UNIQUE (nombre);


--
-- Name: categoria_servicio categoria_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria_servicio
    ADD CONSTRAINT categoria_servicio_pkey PRIMARY KEY (id);


--
-- Name: cita cita_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_codigo_key UNIQUE (codigo);


--
-- Name: cita cita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_pkey PRIMARY KEY (id);


--
-- Name: codigo_recuperacion codigo_recuperacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigo_recuperacion
    ADD CONSTRAINT codigo_recuperacion_pkey PRIMARY KEY (id);


--
-- Name: codigo_recuperacion codigo_recuperacion_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigo_recuperacion
    ADD CONSTRAINT codigo_recuperacion_usuario_id_key UNIQUE (usuario_id);


--
-- Name: consecutivo_cita consecutivo_cita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consecutivo_cita
    ADD CONSTRAINT consecutivo_cita_pkey PRIMARY KEY (sede_id, anio);


--
-- Name: especie especie_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especie
    ADD CONSTRAINT especie_nombre_key UNIQUE (nombre);


--
-- Name: especie especie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especie
    ADD CONSTRAINT especie_pkey PRIMARY KEY (id);


--
-- Name: foto_galeria foto_galeria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foto_galeria
    ADD CONSTRAINT foto_galeria_pkey PRIMARY KEY (id);


--
-- Name: horario_atencion horario_atencion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_atencion
    ADD CONSTRAINT horario_atencion_pkey PRIMARY KEY (id);


--
-- Name: horario_atencion horario_atencion_sede_id_dia_semana_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_atencion
    ADD CONSTRAINT horario_atencion_sede_id_dia_semana_key UNIQUE (sede_id, dia_semana);


--
-- Name: horario_medico horario_medico_medico_id_dia_semana_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_medico
    ADD CONSTRAINT horario_medico_medico_id_dia_semana_key UNIQUE (medico_id, dia_semana);


--
-- Name: horario_medico horario_medico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_medico
    ADD CONSTRAINT horario_medico_pkey PRIMARY KEY (id);


--
-- Name: informacion_clinica informacion_clinica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informacion_clinica
    ADD CONSTRAINT informacion_clinica_pkey PRIMARY KEY (id);


--
-- Name: mascota mascota_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mascota
    ADD CONSTRAINT mascota_pkey PRIMARY KEY (id);


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY (id);


--
-- Name: raza raza_especie_id_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raza
    ADD CONSTRAINT raza_especie_id_nombre_key UNIQUE (especie_id, nombre);


--
-- Name: raza raza_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raza
    ADD CONSTRAINT raza_pkey PRIMARY KEY (id);


--
-- Name: recordatorio recordatorio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recordatorio
    ADD CONSTRAINT recordatorio_pkey PRIMARY KEY (id);


--
-- Name: registro_pendiente registro_pendiente_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_pendiente
    ADD CONSTRAINT registro_pendiente_correo_key UNIQUE (correo);


--
-- Name: registro_pendiente registro_pendiente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_pendiente
    ADD CONSTRAINT registro_pendiente_pkey PRIMARY KEY (id);


--
-- Name: sede sede_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sede
    ADD CONSTRAINT sede_codigo_key UNIQUE (codigo);


--
-- Name: sede sede_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sede
    ADD CONSTRAINT sede_pkey PRIMARY KEY (id);


--
-- Name: servicio_medico servicio_medico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_medico
    ADD CONSTRAINT servicio_medico_pkey PRIMARY KEY (servicio_id, medico_id);


--
-- Name: servicio servicio_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_nombre_key UNIQUE (nombre);


--
-- Name: servicio servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_pkey PRIMARY KEY (id);


--
-- Name: usuario usuario_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);


--
-- Name: usuario_especialidad usuario_especialidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_especialidad
    ADD CONSTRAINT usuario_especialidad_pkey PRIMARY KEY (usuario_id, categoria_id);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: verificacion_correo verificacion_correo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_correo
    ADD CONSTRAINT verificacion_correo_pkey PRIMARY KEY (usuario_id);


--
-- Name: idx_bitacora_creado_en; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bitacora_creado_en ON public.bitacora USING btree (creado_en DESC);


--
-- Name: idx_bloqueo_medico_fechas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bloqueo_medico_fechas ON public.bloqueo_medico USING btree (medico_id, fecha_inicio, fecha_fin);


--
-- Name: idx_cita_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cita_cliente_id ON public.cita USING btree (cliente_id);


--
-- Name: idx_cita_franja_unica_medico; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cita_franja_unica_medico ON public.cita USING btree (medico_id, fecha_hora) WHERE ((estado)::text = 'agendada'::text);


--
-- Name: idx_cita_mascota_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cita_mascota_id ON public.cita USING btree (mascota_id);


--
-- Name: idx_cita_medico_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cita_medico_fecha ON public.cita USING btree (medico_id, fecha_hora);


--
-- Name: idx_cita_sede_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cita_sede_fecha ON public.cita USING btree (sede_id, fecha_hora);


--
-- Name: idx_cita_servicio_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cita_servicio_id ON public.cita USING btree (servicio_id);


--
-- Name: idx_foto_galeria_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_foto_galeria_orden ON public.foto_galeria USING btree (orden);


--
-- Name: idx_horario_medico_sede_dia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_horario_medico_sede_dia ON public.horario_medico USING btree (sede_id, dia_semana);


--
-- Name: idx_mascota_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mascota_cliente_id ON public.mascota USING btree (cliente_id);


--
-- Name: idx_notificacion_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacion_usuario ON public.notificacion USING btree (usuario_id, creado_en DESC);


--
-- Name: idx_raza_especie_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_raza_especie_id ON public.raza USING btree (especie_id);


--
-- Name: idx_recordatorio_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recordatorio_cliente_id ON public.recordatorio USING btree (cliente_id);


--
-- Name: idx_recordatorio_mascota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recordatorio_mascota ON public.recordatorio USING btree (mascota_id, fecha);


--
-- Name: idx_recordatorio_medico; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recordatorio_medico ON public.recordatorio USING btree (medico_id, fecha);


--
-- Name: idx_sede_principal_unica; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sede_principal_unica ON public.sede USING btree (es_principal) WHERE es_principal;


--
-- Name: idx_servicio_categoria_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servicio_categoria_id ON public.servicio USING btree (categoria_id);


--
-- Name: idx_servicio_medico_medico_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servicio_medico_medico_id ON public.servicio_medico USING btree (medico_id);


--
-- Name: idx_usuario_correo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_correo ON public.usuario USING btree (correo);


--
-- Name: idx_usuario_especialidad_categoria_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_especialidad_categoria_id ON public.usuario_especialidad USING btree (categoria_id);


--
-- Name: idx_usuario_sede_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_sede_id ON public.usuario USING btree (sede_id);


--
-- Name: bloqueo_medico bloqueo_medico_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueo_medico
    ADD CONSTRAINT bloqueo_medico_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.usuario(id);


--
-- Name: cita cita_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.usuario(id);


--
-- Name: cita cita_mascota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES public.mascota(id);


--
-- Name: cita cita_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.usuario(id);


--
-- Name: cita cita_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sede(id);


--
-- Name: cita cita_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(id);


--
-- Name: codigo_recuperacion codigo_recuperacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigo_recuperacion
    ADD CONSTRAINT codigo_recuperacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- Name: consecutivo_cita consecutivo_cita_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consecutivo_cita
    ADD CONSTRAINT consecutivo_cita_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sede(id);


--
-- Name: horario_atencion horario_atencion_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_atencion
    ADD CONSTRAINT horario_atencion_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sede(id);


--
-- Name: horario_medico horario_medico_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_medico
    ADD CONSTRAINT horario_medico_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.usuario(id);


--
-- Name: horario_medico horario_medico_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_medico
    ADD CONSTRAINT horario_medico_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sede(id);


--
-- Name: mascota mascota_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mascota
    ADD CONSTRAINT mascota_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.usuario(id);


--
-- Name: notificacion notificacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: raza raza_especie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raza
    ADD CONSTRAINT raza_especie_id_fkey FOREIGN KEY (especie_id) REFERENCES public.especie(id);


--
-- Name: recordatorio recordatorio_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recordatorio
    ADD CONSTRAINT recordatorio_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.usuario(id);


--
-- Name: recordatorio recordatorio_mascota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recordatorio
    ADD CONSTRAINT recordatorio_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES public.mascota(id);


--
-- Name: recordatorio recordatorio_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recordatorio
    ADD CONSTRAINT recordatorio_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.usuario(id);


--
-- Name: servicio servicio_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria_servicio(id);


--
-- Name: servicio_medico servicio_medico_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_medico
    ADD CONSTRAINT servicio_medico_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.usuario(id);


--
-- Name: servicio_medico servicio_medico_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_medico
    ADD CONSTRAINT servicio_medico_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(id);


--
-- Name: usuario_especialidad usuario_especialidad_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_especialidad
    ADD CONSTRAINT usuario_especialidad_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria_servicio(id);


--
-- Name: usuario_especialidad usuario_especialidad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_especialidad
    ADD CONSTRAINT usuario_especialidad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: usuario usuario_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sede(id);


--
-- Name: verificacion_correo verificacion_correo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_correo
    ADD CONSTRAINT verificacion_correo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- PostgreSQL database dump complete
--


