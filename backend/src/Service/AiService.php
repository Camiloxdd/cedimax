<?php

namespace App\Service;

use App\Entity\BookingSession;
use App\Entity\BusinessHour;
use App\Entity\Conversation;
use App\Entity\Contact;
use App\Entity\Message;
use App\Repository\BusinessHourRepository;
use App\Repository\ContactRepository;
use App\Repository\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class AiService
{
    private const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly EntityManagerInterface $em,
        private readonly ServiceRepository $serviceRepository,
        private readonly BusinessHourRepository $hoursRepository,
        private readonly ContactRepository $contactRepository,
        private readonly SlotService $slotService,
        private readonly WhatsAppSender $whatsappSender,
        private readonly LoggerInterface $logger,
        private readonly string $groqApiKey,
        private readonly string $groqModel,
        private readonly string $frontendUrl,
    ) {
    }

    /**
     * True si un mensaje identico (misma ventana de 2 min) ya fue registrado.
     * Permite descartar duplicados ANTES de encolar en Messenger.
     */
    public function isDuplicateWebhook(string $waId, string $text, string $channel): bool
    {
        $channel = $channel === 'telegram' ? 'telegram' : 'whatsapp';
        $key = $this->webhookKey($waId, $text, $channel);

        return $this->em->getRepository(Message::class)->findByWebhookId($key) !== null;
    }

    /**
     * Procesa un mensaje entrante de WhatsApp: guarda, llama a la IA y envia la respuesta.
     * Idempotente: si ya se proceso un mensaje con el mismo webhookId, no se repite.
     */
    public function handleIncomingWhatsApp(string $waId, string $text, ?string $fromName = null, string $channel = 'whatsapp', ?string $webhookId = null): void
    {
        $channel = $channel === 'telegram' ? 'telegram' : 'whatsapp';
        $webhookId = $webhookId ?? $this->webhookKey($waId, $text, $channel);

        $messageRepo = $this->em->getRepository(Message::class);
        if ($messageRepo->findByWebhookId($webhookId) !== null) {
            $this->logger->info('Webhook duplicado ignorado (idempotencia)', ['webhookId' => $webhookId]);

            return;
        }

        $contact = $this->contactRepository->findOrCreateByWaId($waId);
        if ($fromName !== null && $contact->getName() === null) {
            $contact->setName($fromName);
        }
        $contact->touch();

        $conversation = $this->findOrCreateConversation($waId, $contact, $channel);
        $this->logMessage($contact, $waId, Message::DIR_IN, $text, $channel, $webhookId);
        $conversation->appendAiMessage('user', $text);

        try {
            $reply = $this->ask($conversation);
        } catch (\Throwable $e) {
            $this->logger->error('Error en IA: ' . $e->getMessage(), ['waId' => $waId]);
            $reply = 'Perdón, tengo un problema técnico momentáneo. ¿Podrías intentarlo de nuevo en un momento? 🙏';
        }

        $conversation->appendAiMessage('assistant', $reply);
        $conversation->touch();

        if ($reply !== '') {
            $this->logMessage($contact, $waId, Message::DIR_OUT, $reply, $channel);
            $this->whatsappSender->sendText($waId, $reply, $channel);
        }

        $this->em->flush();
    }

    /**
     * @return string Respuesta de texto (vacio si la tool ya envio el link)
     */
    private function ask(Conversation $conversation): string
    {
        if ($this->groqApiKey === '') {
            return 'Parece que todavía no configuro mi sesión de atención. Prueba más tarde o llámanos directamente.';
        }

        $payload = [
            'model' => $this->groqModel,
            'messages' => array_merge(
                [['role' => 'system', 'content' => $this->systemPrompt()]],
                $conversation->getAiThread()
            ),
            'temperature' => 0.6,
            'max_tokens' => 1024,
            'tools' => $this->toolDefinitions(),
            'tool_choice' => 'auto',
            'parallel_tool_calls' => false,
        ];

        try {
            $response = $this->httpClient->request('POST', self::GROQ_ENDPOINT, [
                'json' => $payload,
                'headers' => ['Authorization' => 'Bearer ' . $this->groqApiKey],
            ])->toArray();
        } catch (ExceptionInterface $e) {
            throw new \RuntimeException('Groq HTTP error: ' . $e->getMessage(), 0, $e);
        }

        $message = $response['choices'][0]['message'] ?? [];

        if (!empty($message['tool_calls'])) {
            return $this->resolveToolCall($conversation, $message['tool_calls'][0]);
        }

        return trim((string) ($message['content'] ?? ''));
    }

    private function resolveToolCall(Conversation $conversation, array $toolCall): string
    {
        $name = $toolCall['function']['name'] ?? '';
        $args = json_decode($toolCall['function']['arguments'] ?? '{}', true) ?? [];

        return match ($name) {
            'send_booking_link' => $this->sendBookingLink($conversation, $args),
            'check_availability' => $this->checkAvailability($args),
            default => 'No puedo hacer eso por ahora. ¿Te ayudo con una reserva?',
        };
    }

    private function sendBookingLink(Conversation $conversation, array $args): string
    {
        $serviceName = isset($args['service_name']) && trim((string) $args['service_name']) !== ''
            ? trim((string) $args['service_name'])
            : null;
        $date = isset($args['preferred_date']) ? (string) $args['preferred_date'] : null;
        $time = isset($args['preferred_time']) ? (string) $args['preferred_time'] : null;

        $service = null;
        if ($serviceName !== null) {
            foreach ($this->serviceRepository->findActive() as $candidate) {
                if (mb_strtolower($candidate->getName()) === mb_strtolower($serviceName)) {
                    $service = $candidate;
                    break;
                }
            }
        }

        $session = new BookingSession();
        $session->setToken(bin2hex(random_bytes(12)));
        $session->setConversation($conversation);
        $session->setContact($conversation->getContact());
        $session->setWaId($conversation->getWaId());
        $session->setChannel($conversation->getChannel());
        $session->setSuggestedService($serviceName);
        $session->setServiceId($service?->getId());
        if ($date !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $session->setPreferredDate(new \DateTimeImmutable($date));
        }
        if ($time !== null && preg_match('/^(\d{1,2}):(\d{2})$/', $time, $m)) {
            $session->setPreferredTime(sprintf('%02d:%02d', (int) $m[1], (int) $m[2]));
        }
        $session->setExpiresAt(new \DateTimeImmutable('+60 minutes'));

        $this->em->persist($session);
        $this->em->flush();

        if ($serviceName !== null) {
            $message = match (true) {
                $date !== null && $time !== null => sprintf('Perfecto ✅ reserva de %s para el %s a las %s. Confírmala aquí 👇', $serviceName, $date, $session->getPreferredTime()),
                $date !== null => sprintf('Perfecto ✅ %s para el %s. Elige tu hora aquí 👇', $serviceName, $date),
                default => sprintf('Perfecto 👍 agenda tu cita para %s aquí 👇', $serviceName),
            };
        } else {
            $message = 'Genial 👌 cuenta con tu reserva, solo completa aquí tus datos 👇';
        }

        $url = rtrim($this->frontendUrl, '/') . '/reserva/' . $session->getToken();
        $sent = $this->whatsappSender->sendText($conversation->getWaId(), $message . "\n\n" . sprintf('<%s>', $url), $conversation->getChannel());

        return $sent ? '' : 'No pude enviarte el enlace, intenta de nuevo.';
    }

    private function checkAvailability(array $args): string
    {
        $date = $args['date'] ?? null;
        if ($date === null || !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $date)) {
            return '¿Para qué día quieres revisar disponibilidad?';
        }

        $duration = $this->defaultDuration();
        $serviceName = isset($args['service_name']) ? trim((string) $args['service_name']) : '';
        $service = null;
        if ($serviceName !== '') {
            foreach ($this->serviceRepository->findActive() as $candidate) {
                if (mb_strtolower($candidate->getName()) === mb_strtolower($serviceName)) {
                    $service = $candidate;
                    break;
                }
            }
            if ($service === null) {
                return sprintf('El estudio "%s" no está en nuestro catálogo. ¿Quieres revisar otro?', $serviceName);
            }
            $duration = $service->getDurationMinutes();
        }

        $slots = $this->slotService->availableSlots(new \DateTimeImmutable($date), $duration);

        if (count($slots) === 0) {
            return sprintf('El %s no tenemos disponibilidad%s. ¿Quieres otro día?', $date, $service !== null ? ' para ' . $service->getName() : '');
        }

        return sprintf(
            'Para el %s%s estos son los horarios disponibles: %s',
            $date,
            $service !== null ? ' (' . $service->getName() . ', ' . $service->getDurationMinutes() . ' min)' : '',
            implode(', ', array_slice($slots, 0, 6)) . (count($slots) > 6 ? '…' : '')
        );
    }

    private function systemPrompt(): string
    {
        $services = $this->serviceRepository->findActive();
        $servicesText = [];
        foreach ($services as $service) {
            $price = (float) $service->getPrice();
            $servicesText[] = $price > 0
                ? sprintf('- %s (%s min) — $%s', $service->getName(), $service->getDurationMinutes(), number_format($price, 0, ',', '.'))
                : sprintf('- %s (%s min)', $service->getName(), $service->getDurationMinutes());
        }

        $hoursText = [];
        foreach ($this->hoursRepository->findAll() as $hour) {
            if (!$hour->isActive()) {
                continue;
            }
            $hoursText[] = sprintf(
                '%s: %s a %s (cada %s min)',
                BusinessHour::DOW_NAMES[$hour->getDayOfWeek()] ?? $hour->getDayOfWeek(),
                $hour->getOpenTime(),
                $hour->getCloseTime(),
                $hour->getSlotInterval()
            );
        }

        return <<<PROMPT
Eres el asistente virtual de "CEDIMAX", un Centro de Imágenes Diagnósticas. Nuestra prioridad eres tú.
Atiendes a los pacientes amablemente en español, con tono cálido y profesional: respondes preguntas sobre los
estudios, los horarios y el proceso de agenda, y los conduces a reservar su cita mediante el enlace que genera
la herramienta send_booking_link.

ESTUDIOS DISPONIBLES:
{$this->renderBullets($servicesText)}

HORARIOS DE ATENCIÓN:
{$this->renderBullets($hoursText)}

REGLAS:
- Responde SIEMPRE en español, de forma breve y cercana, como quien agenda las citas del centro.
- Los valores de los estudios se confirman en el centro; si preguntan por el precio, responde amablemente que se
  les informa al agendar la cita o directamente en CEDIMAX.
- Cuando el paciente muestre intención de reservar (pide una cita, hora/día, quiere agendar un estudio), llama
  HERRAMIENTA send_booking_link INMEDIATAMENTE, incluyendo service_name, preferred_date y/o preferred_time si los
  mencionó (fecha en YYYY-MM-DD y hora en H:MM). No pidas datos personales en el chat: la página del enlace los pide.
- Aunque el paciente ya tenga una cita o mencione reprogramar, igual envía el enlace y agrégalo a su contexto.
- Si pregunta por disponibilidad de una fecha, usa check_availability.
- Si pregunta por algo fuera de estudios/horarios (resultados, indicaciones médicas de fondo, pagos complejos,
  temas legales), responde con amabilidad que puede llamar al centro o que se le atiende en persona.
PROMPT;
    }

    private function renderBullets(array $lines): string
    {
        return $lines === [] ? '(sin datos configurados)' : implode("\n", $lines);
    }

    private function toolDefinitions(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'send_booking_link',
                    'description' => 'Envía al paciente (por WhatsApp o Telegram) un enlace para reservar una cita para un estudio en la web. Usar cuando el paciente pida reservar, agendar, o elegir día/hora.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'service_name' => ['type' => 'string', 'description' => 'Nombre del servicio que el cliente menciona (opcional, usa el nombre exacto del catálogo)'],
                            'preferred_date' => ['type' => 'string', 'description' => 'Fecha preferida en formato YYYY-MM-DD (opcional)'],
                            'preferred_time' => ['type' => 'string', 'description' => 'Hora preferida en formato H:MM (opcional)'],
                        ],
                        'additionalProperties' => false,
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'check_availability',
                    'description' => 'Consulta los horarios libres disponibles para una fecha concreta.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'date' => ['type' => 'string', 'description' => 'Fecha en formato YYYY-MM-DD'],
                            'service_name' => ['type' => 'string', 'description' => 'Nombre del servicio (opcional; si se omite se usan los horarios por defecto)'],
                        ],
                        'required' => ['date'],
                        'additionalProperties' => false,
                    ],
                ],
            ],
        ];
    }

    private function findOrCreateConversation(string $waId, Contact $contact, string $channel = 'whatsapp'): Conversation
    {
        $repo = $this->em->getRepository(Conversation::class);
        $conversation = $repo->findOneBy(['waId' => $waId]);
        if ($conversation === null) {
            $conversation = new Conversation();
            $conversation->setWaId($waId);
            $this->em->persist($conversation);
        }
        $conversation->setChannel($channel);
        $conversation->setContact($contact);
        $conversation->setStatus('active');

        return $conversation;
    }

    private function logMessage(Contact $contact, string $waId, string $direction, string $body, string $channel = 'whatsapp', ?string $webhookId = null): void
    {
        $message = new Message();
        $message->setContact($contact);
        $message->setWaId($waId);
        $message->setDirection($direction);
        $message->setChannel($channel);
        $message->setBody($body);
        if ($direction === Message::DIR_IN && $webhookId !== null) {
            $message->setWebhookId($webhookId);
        }
        $message->setStatus($direction === Message::DIR_IN ? 'received' : 'queued');
        $this->em->persist($message);
    }

    /**
     * Clave de idempotencia: hash de (waId|canal|texto|ventana de 2 min).
     * Los reintentos de los adapters caen en la misma ventana y se descartan.
     */
    private function webhookKey(string $waId, string $text, string $channel): string
    {
        return hash('sha256', $waId . '|' . $channel . '|' . $text . '|' . intdiv(time(), 120));
    }

    private function defaultDuration(): int
    {
        $services = $this->serviceRepository->findActive();
        if (count($services) === 0) {
            return 30;
        }

        return $services[0]->getDurationMinutes();
    }
}