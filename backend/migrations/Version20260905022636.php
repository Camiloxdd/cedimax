<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260905022636 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE appointments (id INT AUTO_INCREMENT NOT NULL, date DATE NOT NULL, time VARCHAR(5) NOT NULL, duration_minutes SMALLINT NOT NULL, status VARCHAR(32) NOT NULL, price NUMERIC(10, 2) NOT NULL, notes LONGTEXT DEFAULT NULL, cancelled_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, contact_id INT NOT NULL, service_id INT NOT NULL, session_id INT DEFAULT NULL, INDEX IDX_6A41727AE7A1254A (contact_id), INDEX IDX_6A41727AED5CA9E6 (service_id), INDEX IDX_6A41727A613FECDF (session_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE booking_sessions (id INT AUTO_INCREMENT NOT NULL, token VARCHAR(24) NOT NULL, wa_id VARCHAR(64) DEFAULT NULL, status VARCHAR(32) NOT NULL, suggested_service VARCHAR(255) DEFAULT NULL, service_id INT DEFAULT NULL, preferred_date DATE DEFAULT NULL, preferred_time VARCHAR(5) DEFAULT NULL, customer_name VARCHAR(255) DEFAULT NULL, customer_phone VARCHAR(32) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL, conversation_id INT DEFAULT NULL, contact_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_A154039E5F37A13B (token), INDEX IDX_A154039E9AC0396 (conversation_id), INDEX IDX_A154039EE7A1254A (contact_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE business_exceptions (id INT AUTO_INCREMENT NOT NULL, exception_date DATE NOT NULL, reason VARCHAR(255) DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE business_hours (id INT AUTO_INCREMENT NOT NULL, day_of_week SMALLINT NOT NULL, open_time VARCHAR(5) NOT NULL, close_time VARCHAR(5) NOT NULL, slot_interval SMALLINT NOT NULL, active TINYINT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE contacts (id INT AUTO_INCREMENT NOT NULL, wa_id VARCHAR(64) DEFAULT NULL, name VARCHAR(255) DEFAULT NULL, phone VARCHAR(32) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_33401573974A4786 (wa_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE conversations (id INT AUTO_INCREMENT NOT NULL, wa_id VARCHAR(64) NOT NULL, status VARCHAR(32) NOT NULL, ai_thread JSON NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, contact_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_C2521BF1974A4786 (wa_id), INDEX IDX_C2521BF1E7A1254A (contact_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE messages (id INT AUTO_INCREMENT NOT NULL, wa_id VARCHAR(64) DEFAULT NULL, direction VARCHAR(8) NOT NULL, channel VARCHAR(16) NOT NULL, body LONGTEXT NOT NULL, status VARCHAR(32) NOT NULL, created_at DATETIME NOT NULL, contact_id INT DEFAULT NULL, INDEX IDX_DB021E96E7A1254A (contact_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE services (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, duration_minutes INT NOT NULL, price NUMERIC(10, 2) NOT NULL, active TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE appointments ADD CONSTRAINT FK_6A41727AE7A1254A FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE appointments ADD CONSTRAINT FK_6A41727AED5CA9E6 FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE appointments ADD CONSTRAINT FK_6A41727A613FECDF FOREIGN KEY (session_id) REFERENCES booking_sessions (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE booking_sessions ADD CONSTRAINT FK_A154039E9AC0396 FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE booking_sessions ADD CONSTRAINT FK_A154039EE7A1254A FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE conversations ADD CONSTRAINT FK_C2521BF1E7A1254A FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE messages ADD CONSTRAINT FK_DB021E96E7A1254A FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE appointments DROP FOREIGN KEY FK_6A41727AE7A1254A');
        $this->addSql('ALTER TABLE appointments DROP FOREIGN KEY FK_6A41727AED5CA9E6');
        $this->addSql('ALTER TABLE appointments DROP FOREIGN KEY FK_6A41727A613FECDF');
        $this->addSql('ALTER TABLE booking_sessions DROP FOREIGN KEY FK_A154039E9AC0396');
        $this->addSql('ALTER TABLE booking_sessions DROP FOREIGN KEY FK_A154039EE7A1254A');
        $this->addSql('ALTER TABLE conversations DROP FOREIGN KEY FK_C2521BF1E7A1254A');
        $this->addSql('ALTER TABLE messages DROP FOREIGN KEY FK_DB021E96E7A1254A');
        $this->addSql('DROP TABLE appointments');
        $this->addSql('DROP TABLE booking_sessions');
        $this->addSql('DROP TABLE business_exceptions');
        $this->addSql('DROP TABLE business_hours');
        $this->addSql('DROP TABLE contacts');
        $this->addSql('DROP TABLE conversations');
        $this->addSql('DROP TABLE messages');
        $this->addSql('DROP TABLE services');
    }
}
