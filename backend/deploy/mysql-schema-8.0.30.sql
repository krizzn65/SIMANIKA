
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_entries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `kind` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `result` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` bigint unsigned DEFAULT NULL,
  `actor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_role` varchar(24) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `route` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `http_status` smallint unsigned NOT NULL,
  `context` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_entries_kind_created_at_index` (`kind`,`created_at`),
  KEY `audit_entries_module_created_at_index` (`module`,`created_at`),
  KEY `audit_entries_actor_id_created_at_index` (`actor_id`,`created_at`),
  KEY `audit_entries_result_created_at_index` (`result`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `divisi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `site_content_id` bigint unsigned NOT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `divisi_site_content_id_foreign` (`site_content_id`),
  CONSTRAINT `divisi_site_content_id_foreign` FOREIGN KEY (`site_content_id`) REFERENCES `site_contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_enrollments_event_id_user_id_unique` (`event_id`,`user_id`),
  KEY `event_enrollments_user_id_created_at_index` (`user_id`,`created_at`),
  CONSTRAINT `event_enrollments_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_enrollments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_form_fields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `group_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `options` json DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `help` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placeholder` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_form_fields_event_id_name_unique` (`event_id`,`name`),
  KEY `event_form_fields_group_id_foreign` (`group_id`),
  CONSTRAINT `event_form_fields_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_form_fields_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `event_form_groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_form_groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'personal',
  `edit_role` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_form_groups_event_id_foreign` (`event_id`),
  CONSTRAINT `event_form_groups_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_group_submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `group_id` bigint unsigned NOT NULL,
  `owner_type` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `form_data` json NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_group_owner_unique` (`group_id`,`owner_type`,`owner_id`),
  KEY `event_group_submissions_event_id_owner_type_owner_id_index` (`event_id`,`owner_type`,`owner_id`),
  CONSTRAINT `event_group_submissions_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_group_submissions_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `event_form_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_prizes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `event_prizes_event_id_foreign` (`event_id`),
  CONSTRAINT `event_prizes_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_registrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `form_data` json DEFAULT NULL,
  `status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_registrations_event_id_user_id_unique` (`event_id`,`user_id`),
  KEY `event_registrations_user_id_foreign` (`user_id`),
  CONSTRAINT `event_registrations_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_registrations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_requirements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `event_requirements_event_id_foreign` (`event_id`),
  CONSTRAINT `event_requirements_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `kategori` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `poster` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `buka_pendaftaran` date DEFAULT NULL,
  `deadline_pendaftaran` date DEFAULT NULL,
  `lokasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipe` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'offline',
  `status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `tipe_pendaftaran` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'individu',
  `payment_type` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'free',
  `htm` bigint unsigned DEFAULT NULL,
  `kode_prefix` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_anggota` smallint unsigned DEFAULT NULL,
  `max_anggota` smallint unsigned DEFAULT NULL,
  `last_team_number` int unsigned NOT NULL DEFAULT '0',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `timeline` json DEFAULT (_utf8mb4'[]'),
  `guidebook_type` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guidebook_value` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_slug_unique` (`slug`),
  KEY `events_created_by_foreign` (`created_by`),
  KEY `events_status_tanggal_mulai_index` (`status`,`tanggal_mulai`),
  KEY `events_kategori_status_index` (`kategori`,`status`),
  CONSTRAINT `events_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_uploads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `owner_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `field_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `disk` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `file_uploads_user_id_foreign` (`user_id`),
  KEY `file_uploads_owner_type_owner_id_index` (`owner_type`,`owner_id`),
  CONSTRAINT `file_uploads_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `galleries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `site_content_id` bigint unsigned NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `galleries_site_content_id_foreign` (`site_content_id`),
  CONSTRAINT `galleries_site_content_id_foreign` FOREIGN KEY (`site_content_id`) REFERENCES `site_contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchandise_inquiries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nama_kontak` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_instansi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `paket_diminati` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pesan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unread',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchandises` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nama_instansi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tier` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `event_id` bigint unsigned DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `merchandises_event_id_foreign` (`event_id`),
  CONSTRAINT `merchandises_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `migrations` VALUES (1,'2026_09_22_000001_create_identity_and_infrastructure',1),(2,'2026_09_22_000002_create_events_and_oprecs',1),(3,'2026_09_22_000003_create_content_and_merchandise',1),(4,'2026_09_22_224141_add_google_id_to_users_table',1),(5,'2026_09_23_180849_add_timeline_to_events_table',1),(6,'2026_09_23_181816_alter_kategori_length_on_events_table',1),(7,'2026_09_23_185800_alter_event_dates_to_date_only',1),(8,'2026_09_23_191500_drop_kuota_from_events_table',1),(9,'2026_09_23_192000_drop_registration_url_from_events_table',1),(10,'2026_09_23_210000_set_himanika_as_only_designated_admin',1),(11,'2026_09_23_220000_enforce_event_registration_mode_integrity',1),(12,'2026_09_23_230000_remove_non_account_fields_from_users',1),(13,'2026_09_23_231000_restore_user_avatar',1),(14,'2026_09_23_232000_add_metadata_to_event_form_fields',1),(15,'2026_09_24_000000_create_event_enrollments_table',1),(16,'2026_09_24_000001_lock_event_mode_after_enrollment',1),(17,'2026_09_24_000002_add_guidebook_to_events',1),(18,'2026_09_24_000003_add_payment_to_events',1),(19,'2026_09_24_000004_add_team_membership_approval',1),(20,'2026_09_25_000001_add_oprec_stage_cards',1),(21,'2026_09_25_000001_create_event_form_groups',1),(22,'2026_09_25_000002_create_oprec_test_submissions',1),(23,'2026_09_25_000002_reserve_team_prefixes_and_codes',1),(24,'2026_09_26_000001_create_oprec_enrollments_table',1),(25,'2026_09_26_000002_add_third_oprec_division_choice',1),(26,'2026_09_27_000001_replace_kuota_with_jabatan_in_oprec_divisions',1),(27,'2026_09_27_200000_add_link_grup_wa_to_oprecs',1),(28,'2026_09_28_000001_add_first_published_at_to_oprecs',1),(29,'2026_09_28_000002_add_super_admin_role',1),(30,'2026_09_29_000001_create_oprec_assessments',1),(31,'2026_09_30_000001_add_oprec_announcement_metadata',1),(32,'2026_10_13_000001_create_audit_entries',1),(33,'2026_10_16_000001_add_guidebook_to_oprecs',1),(34,'2026_10_16_000001_add_landing_content_flags',1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_assessment_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `assigned_by` bigint unsigned DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oprec_assessment_assignments_oprec_id_user_id_unique` (`oprec_id`,`user_id`),
  KEY `oprec_assessment_assignments_user_id_foreign` (`user_id`),
  KEY `oprec_assessment_assignments_assigned_by_foreign` (`assigned_by`),
  CONSTRAINT `oprec_assessment_assignments_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `oprec_assessment_assignments_oprec_id_foreign` FOREIGN KEY (`oprec_id`) REFERENCES `oprecs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `oprec_assessment_assignments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_assessment_decision_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_registration_id` bigint unsigned NOT NULL,
  `actor_id` bigint unsigned DEFAULT NULL,
  `old_status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_division_id` bigint unsigned DEFAULT NULL,
  `new_division_id` bigint unsigned DEFAULT NULL,
  `old_position` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_position` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `oprec_assessment_decision_logs_actor_id_foreign` (`actor_id`),
  KEY `oprec_decision_history_idx` (`oprec_registration_id`,`created_at`),
  CONSTRAINT `oprec_assessment_decision_logs_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `oprec_assessment_decision_logs_oprec_registration_id_foreign` FOREIGN KEY (`oprec_registration_id`) REFERENCES `oprec_registrations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_assessment_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_registration_id` bigint unsigned NOT NULL,
  `reviewer_id` bigint unsigned DEFAULT NULL,
  `reviewer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pemahaman` decimal(3,1) DEFAULT NULL,
  `kepribadian` decimal(3,1) DEFAULT NULL,
  `public_speaking` decimal(3,1) DEFAULT NULL,
  `kejujuran` decimal(3,1) DEFAULT NULL,
  `problem_solving` decimal(3,1) DEFAULT NULL,
  `kerja_sama` decimal(3,1) DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oprec_review_reviewer_unique` (`oprec_registration_id`,`reviewer_id`),
  KEY `oprec_assessment_reviews_reviewer_id_foreign` (`reviewer_id`),
  CONSTRAINT `oprec_assessment_reviews_oprec_registration_id_foreign` FOREIGN KEY (`oprec_registration_id`) REFERENCES `oprec_registrations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `oprec_assessment_reviews_reviewer_id_foreign` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_divisions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_id` bigint unsigned NOT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `jabatan` json NOT NULL DEFAULT (_utf8mb4'[]'),
  PRIMARY KEY (`id`),
  KEY `oprec_divisions_oprec_id_foreign` (`oprec_id`),
  CONSTRAINT `oprec_divisions_oprec_id_foreign` FOREIGN KEY (`oprec_id`) REFERENCES `oprecs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oprec_enrollments_oprec_id_user_id_unique` (`oprec_id`,`user_id`),
  KEY `oprec_enrollments_user_id_created_at_index` (`user_id`,`created_at`),
  CONSTRAINT `oprec_enrollments_oprec_id_foreign` FOREIGN KEY (`oprec_id`) REFERENCES `oprecs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `oprec_enrollments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_registrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `nim` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `form_data` json NOT NULL,
  `file_uploads` json DEFAULT NULL,
  `divisi_pilihan_1` bigint unsigned DEFAULT NULL,
  `divisi_pilihan_2` bigint unsigned DEFAULT NULL,
  `accepted_division_id` bigint unsigned DEFAULT NULL,
  `status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `divisi_pilihan_3` bigint unsigned DEFAULT NULL,
  `accepted_position` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oprec_registrations_oprec_id_nim_unique` (`oprec_id`,`nim`),
  UNIQUE KEY `oprec_registrations_oprec_id_user_id_unique` (`oprec_id`,`user_id`),
  KEY `oprec_registrations_user_id_foreign` (`user_id`),
  CONSTRAINT `oprec_registrations_oprec_id_foreign` FOREIGN KEY (`oprec_id`) REFERENCES `oprecs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `oprec_registrations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_stages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_id` bigint unsigned NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `headline` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `poster` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_buka` timestamp NOT NULL,
  `tanggal_tutup` timestamp NULL DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT '0',
  `form_fields` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oprec_stages_oprec_id_type_unique` (`oprec_id`,`type`),
  CONSTRAINT `oprec_stages_oprec_id_foreign` FOREIGN KEY (`oprec_id`) REFERENCES `oprecs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprec_test_submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `oprec_stage_id` bigint unsigned NOT NULL,
  `oprec_registration_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `answers` json NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oprec_test_submissions_oprec_stage_id_user_id_unique` (`oprec_stage_id`,`user_id`),
  KEY `oprec_test_submissions_oprec_registration_id_foreign` (`oprec_registration_id`),
  KEY `oprec_test_submissions_user_id_foreign` (`user_id`),
  CONSTRAINT `oprec_test_submissions_oprec_registration_id_foreign` FOREIGN KEY (`oprec_registration_id`) REFERENCES `oprec_registrations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `oprec_test_submissions_oprec_stage_id_foreign` FOREIGN KEY (`oprec_stage_id`) REFERENCES `oprec_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `oprec_test_submissions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oprecs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `periode` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'closed',
  `headline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `poster` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poster_alt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_buka` timestamp NULL DEFAULT NULL,
  `tanggal_tutup` timestamp NULL DEFAULT NULL,
  `schema_version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1',
  `form_intro` text COLLATE utf8mb4_unicode_ci,
  `link_grup_wa` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_fields` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `faq` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `pengumuman_published` tinyint(1) NOT NULL DEFAULT '0',
  `pengumuman_tanggal` timestamp NULL DEFAULT NULL,
  `pengumuman_pesan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `first_published_at` timestamp NULL DEFAULT NULL,
  `pengumuman_judul` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pengumuman_poster` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pengumuman_grup_wa` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guidebook` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oprecs_periode_unique` (`periode`),
  KEY `oprecs_status_tanggal_buka_index` (`status`,`tanggal_buka`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_kerja` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `site_content_id` bigint unsigned NOT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `program_kerja_site_content_id_foreign` (`site_content_id`),
  CONSTRAINT `program_kerja_site_content_id_foreign` FOREIGN KEY (`site_content_id`) REFERENCES `site_contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_contents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hero_tagline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hero_subtitle` text COLLATE utf8mb4_unicode_ci,
  `about` text COLLATE utf8mb4_unicode_ci,
  `visi` text COLLATE utf8mb4_unicode_ci,
  `misi` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `statistik` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `sosial_media` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `gallery_managed` tinyint(1) NOT NULL DEFAULT '0',
  `testimonials_managed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `struktur_organisasi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `site_content_id` bigint unsigned NOT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jabatan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `struktur_organisasi_site_content_id_foreign` (`site_content_id`),
  CONSTRAINT `struktur_organisasi_site_content_id_foreign` FOREIGN KEY (`site_content_id`) REFERENCES `site_contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_code_reservations` (
  `code` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_code_sequences` (
  `prefix` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_number` bigint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'accepted',
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_members_team_id_user_id_unique` (`team_id`,`user_id`),
  UNIQUE KEY `team_members_event_id_user_id_unique` (`event_id`,`user_id`),
  KEY `team_members_user_id_foreign` (`user_id`),
  KEY `team_members_status_index` (`status`),
  CONSTRAINT `team_members_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `kode_unik` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_tim` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ketua_id` bigint unsigned NOT NULL,
  `jumlah_anggota` smallint unsigned NOT NULL DEFAULT '1',
  `completion_status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'incomplete',
  `review_status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `form_data` json DEFAULT NULL,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `form_submitted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teams_event_id_kode_unik_unique` (`event_id`,`kode_unik`),
  KEY `teams_ketua_id_foreign` (`ketua_id`),
  CONSTRAINT `teams_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teams_ketua_id_foreign` FOREIGN KEY (`ketua_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `site_content_id` bigint unsigned NOT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `angkatan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quote` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `testimonials_site_content_id_foreign` (`site_content_id`),
  CONSTRAINT `testimonials_site_content_id_foreign` FOREIGN KEY (`site_content_id`) REFERENCES `site_contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_profil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_google_id_unique` (`google_id`),
  UNIQUE KEY `users_one_super_admin` (((case when (`role` = _utf8mb4'super_admin') then 1 else NULL end))),
  KEY `users_role_index` (`role`),
  CONSTRAINT `users_role_allowed` CHECK ((`role` in (_utf8mb4'super_admin',_utf8mb4'admin',_utf8mb4'leader',_utf8mb4'kwu',_utf8mb4'user')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

