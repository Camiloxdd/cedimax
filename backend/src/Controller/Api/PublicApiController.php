<?php

namespace App\Controller\Api;

use App\Entity\Appointment;
use App\Entity\BookingSession;
use App\Message\IncomingWhatsAppMessage;
use App\Repository\BookingSessionRepository;
use App\Repository\ServiceRepository;
use App\Service\AiService;
use App\Service\BookingService;
use App\Service\SlotService;
use App\Service\WhatsAppSender;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api')]
class PublicApiController extends AbstractController
{
    #[Route('/services', name: 'api_services', methods: ['GET'])]
    public function services(ServiceRepository $services, SerializerInterface $serializer): JsonResponse
    {
        $data = $serializer->normalize($services->findActive(), null, ['groups' => ['public']]);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/business-hours', name: 'api_hours_list', methods: ['GET'])]
    public function hoursList(\App\Repository\BusinessHourRepository $hours, SerializerInterface $serializer): JsonResponse
    {
        $active = $hours->findBy(['active' => true], ['dayOfWeek' => 'ASC']);

        return new JsonResponse(['data' => $serializer->normalize($active, null, ['groups' => ['public']])]);
    }

    #[Route('/session/{token}', name: 'api_session', methods: ['GET'])]
    public function session(string $token, BookingSessionRepository $sessions, SerializerInterface $serializer): JsonResponse
    {
        $session = $sessions->findByToken($token);
        if ($session === null) {
            return $this->error('Enlace no válido.', 404);
        }

        if ($session->isExpired()) {
            return $this->error('Este enlace ha caducado. Solicita uno nuevo por WhatsApp.', 410);
        }

        if ($session->getStatus() === 'booked') {
            return $this->error('Esta reserva ya fue completada.', 410);
        }

        $data = $serializer->normalize($session, null, ['groups' => ['public']]);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/slots', name: 'api_slots', methods: ['GET'])]
    public function slots(Request $request, ServiceRepository $services, SlotService $slotService): JsonResponse
    {
        $date = $request->query->get('date', '');
        $serviceId = (int) $request->query->get('service_id', '0');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $this->error('Parámetro date inválido (YYYY-MM-DD).', 422);
        }

        $service = $services->find($serviceId);
        if ($service === null || !$service->isActive()) {
            return $this->error('Parámetro service_id inválido.', 422);
        }

        $dateObj = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        if ($dateObj === false) {
            return $this->error('Fecha inválida.', 422);
        }

        if ($dateObj < (new \DateTimeImmutable('today'))) {
            return $this->error('La fecha no puede estar en el pasado.', 422);
        }

        $slots = $slotService->availableSlots($dateObj, $service->getDurationMinutes());

        return new JsonResponse([
            'date' => $date,
            'service_id' => $service->getId(),
            'duration_minutes' => $service->getDurationMinutes(),
            'slots' => $slots,
        ]);
    }

    #[Route('/booking', name: 'api_booking_create', methods: ['POST'])]
    public function createBooking(
        Request $request,
        BookingService $bookingService,
        BookingSessionRepository $sessions,
        WhatsAppSender $whatsappSender,
        SerializerInterface $serializer,
        LoggerInterface $logger,
    ): JsonResponse {
        $body = $this->body($request);

        $token = (string) ($body['token'] ?? '');
        $serviceId = (int) ($body['service_id'] ?? '0');
        $date = (string) ($body['date'] ?? '');
        $time = (string) ($body['time'] ?? '');
        $name = trim((string) ($body['name'] ?? ''));
        $phone = trim((string) ($body['phone'] ?? ''));
        $notes = isset($body['notes']) && trim((string) $body['notes']) !== '' ? trim((string) $body['notes']) : null;

        $session = $sessions->findByToken($token);

        $errors = [];
        if ($session === null) {
            $errors[] = 'El enlace de reserva no es válido.';
        }
        if ($name === '') {
            $errors[] = 'El nombre es obligatorio.';
        }
        if (!preg_match('/^[\d+\-\s()]{7,20}$/', $phone)) {
            $errors[] = 'El teléfono no es válido.';
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $errors[] = 'La fecha es obligatoria (YYYY-MM-DD).';
        }
        if (!preg_match('/^(\d{1,2}):(\d{2})$/', $time)) {
            $errors[] = 'La hora es obligatoria (H:MM).';
        }
        if ($errors !== []) {
            return $this->error(implode(' ', $errors), 422);
        }

        try {
            $appointment = $bookingService->createBooking(
                $token,
                $serviceId,
                \DateTimeImmutable::createFromFormat('!Y-m-d', $date),
                sprintf('%02d:%02d', (int) explode(':', $time)[0], (int) explode(':', $time)[1]),
                $name,
                preg_replace('/[^\d+]/', '', $phone),
                $notes,
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 409);
        } catch (\Throwable $e) {
            $logger->error('Fallo interno creando reserva: ' . $e->getMessage(), ['token' => $token]);

            return $this->error('No se pudo completar la reserva. Intenta de nuevo.', 500);
        }

        if ($appointment->getSession() !== null && $appointment->getSession()->getWaId() !== null) {
            $waId = $appointment->getSession()->getWaId();
            $confirmation = sprintf(
                "¡Cita confirmada en CEDIMAX! ✅\n\nFecha: %s\nHora: %s\nPaciente: %s\nEstudio: %s\nDuración: %d min\nTarifa: $%s\n\n📍 Calle 7 # 8-16, CC Los Pinos, Local 14\n\nSi necesitas preparación para el estudio o reprogramar, escríbenos.",
                $appointment->getDate()->format('d/m/Y'),
                $appointment->getTime(),
                ($name !== '' ? $name : '—'),
                $appointment->getService()->getName(),
                $appointment->getDurationMinutes(),
                number_format((float) $appointment->getPrice(), 0, ',', '.')
            );
            $whatsappSender->sendText($waId, $confirmation, $appointment->getSession()->getChannel());
        }

        $data = $serializer->normalize($appointment, null, ['groups' => ['booking']]);

        return new JsonResponse(['data' => $data], Response::HTTP_CREATED);
    }

    #[Route('/whatsapp/webhook', name: 'api_whatsapp_webhook', methods: ['POST'])]
    public function whatsappWebhook(
        Request $request,
        AiService $aiService,
        MessageBusInterface $bus,
        LoggerInterface $logger,
    ): JsonResponse {
        $provided = (string) $request->headers->get('X-Webhook-Token', '');
        if (!hash_equals($this->getParameter('whatsapp_webhook_token'), $provided)) {
            return $this->error('No autorizado.', 401);
        }

        $body = $this->body($request);
        $waId = (string) ($body['waId'] ?? '');
        $text = trim((string) ($body['text'] ?? ''));
        $fromName = isset($body['fromName']) ? (string) $body['fromName'] : null;
        $channel = (string) ($body['channel'] ?? 'whatsapp');

        if ($waId === '' || $text === '') {
            return $this->error('Faltan waId/text.', 422);
        }

        try {
            if ($aiService->isDuplicateWebhook($waId, $text, $channel)) {
                $logger->info('Webhook duplicado descartado antes de encolar', ['waId' => $waId]);

                return new JsonResponse(['ok' => true]);
            }
            $bus->dispatch(new IncomingWhatsAppMessage($waId, $text, $fromName, $channel));
        } catch (\Throwable $e) {
            $logger->error('Webhook WhatsApp falló: ' . $e->getMessage(), ['waId' => $waId]);

            return $this->error('Error interno.', 500);
        }

        return new JsonResponse(['ok' => true]);
    }

    private function body(Request $request): array
    {
        $data = json_decode((string) $request->getContent(), true);

        return is_array($data) ? $data : [];
    }

    private function error(string $message, int $code): JsonResponse
    {
        return new JsonResponse(['error' => $message], $code);
    }
}