<?php

namespace App\MessageHandler;

use App\Message\IncomingWhatsAppMessage;
use App\Service\AiService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class IncomingWhatsAppMessageHandler
{
    public function __construct(
        private readonly AiService $aiService,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function __invoke(IncomingWhatsAppMessage $message): void
    {
        try {
            $this->aiService->handleIncomingWhatsApp($message->waId, $message->text, $message->fromName, $message->channel);
        } catch (\Throwable $e) {
            $this->logger->error('Fallo procesando mensaje en cola: ' . $e->getMessage(), [
                'waId' => $message->waId,
                'channel' => $message->channel,
            ]);
            throw $e;
        }
    }
}