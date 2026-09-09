<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class WhatsAppSender
{
    public const CHANNELS = ['whatsapp' => 'WhatsApp', 'telegram' => 'Telegram'];

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $adapterUrl,
        private readonly string $telegramAdapterUrl,
        private readonly string $internalToken,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Envia un mensaje de texto por el canal indicado a traves del adapter Node correspondiente.
     */
    public function sendText(string $waId, string $text, string $channel = 'whatsapp', array $context = []): bool
    {
        if ($waId === '') {
            return false;
        }
        if ($channel === 'telegram') {
            $channel = 'telegram';
        } else {
            $channel = 'whatsapp';
        }

        $payload = array_merge([
            'waId' => $waId,
            'text' => $text,
        ], $context);

        return $this->dispatch('/send', $payload, $channel);
    }

    /**
     * Envia un link que las plataformas deben convertir en clickeable (entre <>).
     */
    public function sendLink(string $waId, string $url, ?string $label = null, string $channel = 'whatsapp'): bool
    {
        $text = sprintf('<%s>', $url);
        if ($label !== null) {
            $text = $label . "\n" . $text;
        }

        return $this->sendText($waId, $text, $channel);
    }

    public function isAdapterHealthy(string $channel = 'whatsapp'): bool
    {
        try {
            $response = $this->httpClient->request(Request::METHOD_GET, rtrim($this->adapterUrlFor($channel), '/') . '/health', [
                'timeout' => 3,
            ]);

            return 200 === $response->getStatusCode();
        } catch (ExceptionInterface $e) {
            $this->logger->warning('Adapter no responde: ' . $e->getMessage());

            return false;
        }
    }

    private function adapterUrlFor(string $channel): string
    {
        return $channel === 'telegram' ? $this->telegramAdapterUrl : $this->adapterUrl;
    }

    private function dispatch(string $path, array $payload, string $channel = 'whatsapp'): bool
    {
        try {
            $response = $this->httpClient->request(Request::METHOD_POST, rtrim($this->adapterUrlFor($channel), '/') . $path, [
                'json' => $payload,
                'headers' => [
                    'X-Internal-Token' => $this->internalToken,
                ],
                'timeout' => 5,
            ]);

            $ok = 2 === (int) intdiv((int) $response->getStatusCode(), 100);
            if (!$ok) {
                $this->logger->error('Error enviando por adapter: ' . $response->getContent(false));
            }

            return $ok;
        } catch (ExceptionInterface $e) {
            $this->logger->error('Excepcion enviando por adapter: ' . $e->getMessage());

            return false;
        }
    }
}