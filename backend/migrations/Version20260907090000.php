<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Idempotencia de webhooks (messages.webhook_id unico) y
 * una sola excepcion por fecha (business_exceptions.exception_date unico).
 */
final class Version20260907090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add unique webhook_id to messages and unique exception_date to business_exceptions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE messages ADD webhook_id VARCHAR(64) DEFAULT NULL');
        $this->addSql('ALTER TABLE messages ADD UNIQUE INDEX UNIQ_MESSAGES_WEBHOOK_ID (webhook_id)');
        $this->addSql('ALTER TABLE business_exceptions ADD UNIQUE INDEX UNIQ_EXCEPTION_DATE (exception_date)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE messages DROP INDEX UNIQ_MESSAGES_WEBHOOK_ID');
        $this->addSql('ALTER TABLE messages DROP COLUMN webhook_id');
        $this->addSql('ALTER TABLE business_exceptions DROP INDEX UNIQ_EXCEPTION_DATE');
    }
}