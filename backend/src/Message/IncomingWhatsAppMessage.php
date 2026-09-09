<?php

namespace App\Message;

final class IncomingWhatsAppMessage
{
    public function __construct(
        public readonly string $waId,
        public readonly string $text,
        public readonly ?string $fromName,
        public readonly string $channel,
    ) {
    }
}