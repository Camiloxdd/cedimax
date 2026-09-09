<?php

namespace App\Controller\Api;

use App\Entity\Appointment;
use App\Entity\BookingSession;
use App\Entity\BusinessException;
use App\Entity\BusinessHour;
use App\Entity\Contact;
use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\Service;
use App\Repository\AppointmentRepository;
use App\Repository\BookingSessionRepository;
use App\Repository\BusinessExceptionRepository;
use App\Repository\BusinessHourRepository;
use App\Repository\ConversationRepository;
use App\Repository\MessageRepository;
use App\Repository\ServiceRepository;
use App\Service\BookingService;
use App\Service\SlotService;
use App\Service\WhatsAppSender;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
    }

    #[Route('/stats', name: 'api_admin_stats', methods: ['GET'])]
    public function stats(BookingSessionRepository $sessions): JsonResponse
    {
        $today = new \DateTimeImmutable('today');
        $tomorrow = $today->modify('+1 day');

        $repo = $this->em->getRepository(Appointment::class);
        $qb = fn (array $statuses) => $repo->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->where('a.date >= :from')->andWhere('a.date < :to')
            ->andWhere('a.status IN (:statuses)')
            ->setParameter('from', $today)->setParameter('to', $tomorrow)
            ->setParameter('statuses', $statuses)
            ->getQuery()->getSingleScalarResult();

        $upcoming = $repo->createQueryBuilder('a')
            ->where('a.date >= :today')->andWhere('a.status = :confirmed')
            ->orderBy('a.date', 'ASC')->addOrderBy('a.time', 'ASC')
            ->setMaxResults(5)
            ->setParameter('today', $today)->setParameter('confirmed', Appointment::STATUS_CONFIRMED)
            ->getQuery()->getResult();

        $pendingSessions = $sessions->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->where('s.status = :pending')->andWhere('s.expiresAt > :now')
            ->setParameter('pending', 'pending')->setParameter('now', new \DateTimeImmutable())
            ->getQuery()->getSingleScalarResult();

        return new JsonResponse([
            'data' => [
                'citas_hoy' => (int) $qb([Appointment::STATUS_CONFIRMED, Appointment::STATUS_COMPLETED]),
                'confirmadas_hoy' => (int) $qb([Appointment::STATUS_CONFIRMED]),
                'completadas_hoy' => (int) $qb([Appointment::STATUS_COMPLETED]),
                'canceladas_hoy' => (int) $qb([Appointment::STATUS_CANCELLED]),
                'enlaces_pendientes' => (int) $pendingSessions,
                'proximas' => array_map(fn (Appointment $a) => $this->appointmentView($a), $upcoming),
            ],
        ]);
    }

    #[Route('/appointments', name: 'api_admin_appointments', methods: ['GET'])]
    public function appointments(Request $request): JsonResponse
    {
        $query = (string) $request->query->get('q', '');
        $status = $request->query->get('status');
        $serviceId = $request->query->getInt('service_id', 0);
        $from = $request->query->get('from');
        $to = $request->query->get('to');
        $limit = min(200, max(1, $request->query->getInt('limit', 50)));
        $offset = max(0, $request->query->getInt('offset', 0));

        $qb = $this->em->createQueryBuilder()
            ->select('a')->from(Appointment::class, 'a')
            ->join('a.contact', 'c')->join('a.service', 's');

        if ($status !== null && in_array($status, Appointment::STATUSES, true)) {
            $qb->andWhere('a.status = :status')->setParameter('status', $status);
        }
        if ($serviceId > 0) {
            $qb->andWhere('s.id = :sid')->setParameter('sid', $serviceId);
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $from)) {
            $qb->andWhere('a.date >= :from')->setParameter('from', new \DateTimeImmutable($from));
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $to)) {
            $qb->andWhere('a.date <= :to')->setParameter('to', new \DateTimeImmutable($to));
        }
        if ($query !== '') {
            $qb->andWhere('c.name LIKE :q OR c.phone LIKE :q OR c.waId LIKE :q')
                ->setParameter('q', '%' . $query . '%');
        }

        $total = (clone $qb)->select('COUNT(a.id)')->getQuery()->getSingleScalarResult();

        $qb->orderBy('a.date', 'DESC')->addOrderBy('a.time', 'DESC')
            ->setMaxResults($limit)->setFirstResult($offset);

        $items = array_map(fn (Appointment $a) => $this->appointmentView($a), $qb->getQuery()->getResult());

        return new JsonResponse(['data' => $items, 'total' => (int) $total]);
    }

    #[Route('/appointments/{id}', name: 'api_admin_appointment_get', methods: ['GET'])]
    public function appointment(int $id): JsonResponse
    {
        $appointment = $this->em->find(Appointment::class, $id);
        if ($appointment === null) {
            return $this->error('Cita no encontrada.', 404);
        }

        return new JsonResponse(['data' => $this->appointmentView($appointment)]);
    }

    #[Route('/appointments', name: 'api_admin_appointment_create', methods: ['POST'])]
    public function createAppointment(Request $request, SlotService $slotService): JsonResponse
    {
        $body = $this->body($request);

        $service = $this->em->find(Service::class, (int) ($body['service_id'] ?? 0));
        if ($service === null || !$service->isActive()) {
            return $this->error('Servicio inválido.', 422);
        }

        $date = new \DateTimeImmutable((string) ($body['date'] ?? ''));
        $time = (string) ($body['time'] ?? '');
        if (!preg_match('/^(\d{1,2}):(\d{2})$/', $time)) {
            return $this->error('Hora inválida (H:MM).', 422);
        }
        $time = sprintf('%02d:%02d', (int) explode(':', $time)[0], (int) explode(':', $time)[1]);

        $contact = $this->findOrCreateContactForAdmin($body);
        if ($contact->getName() === null) {
            return $this->error('Nombre del contacto es obligatorio.', 422);
        }

        $appointment = new Appointment();
        $appointment->setContact($contact);
        $appointment->setService($service);
        $appointment->setDate($date);
        $appointment->setTime($time);
        $appointment->setDurationMinutes($service->getDurationMinutes());
        $appointment->setPrice($service->getPrice());
        $appointment->setNotes(isset($body['notes']) ? (string) $body['notes'] : null);

        try {
            $this->em->wrapInTransaction(function () use ($appointment, $date, $time, $slotService) {
                $lockName = sprintf('cedimax_slot_%s_%s', $date->format('Y-m-d'), $time);
                $locked = $this->em->getConnection()->fetchOne('SELECT GET_LOCK(:name, 10)', ['name' => $lockName]);
                if (!$locked) {
                    throw new \RuntimeException('No se pudo adquirir el bloqueo del horario.');
                }

                try {
                    $free = in_array($time, $slotService->availableSlots($date, $appointment->getDurationMinutes()), true);
                    if (!$free) {
                        throw new \InvalidArgumentException('El horario seleccionado ya no esta disponible.');
                    }
                    $this->em->persist($appointment);
                    $this->em->flush();
                } finally {
                    $this->em->getConnection()->executeStatement('SELECT RELEASE_LOCK(:name)', ['name' => $lockName]);
                }
            });
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 409);
        } catch (\Throwable $e) {
            return $this->error('Error guardando: ' . $e->getMessage(), 500);
        }

        return new JsonResponse(['data' => $this->appointmentView($appointment)], Response::HTTP_CREATED);
    }

    #[Route('/appointments/{id}', name: 'api_admin_appointment_update', methods: ['PATCH'])]
    public function updateAppointment(int $id, Request $request, BookingService $bookingService): JsonResponse
    {
        $appointment = $this->em->find(Appointment::class, $id);
        if ($appointment === null) {
            return $this->error('Cita no encontrada.', 404);
        }

        $body = $this->body($request);
        $changed = false;

        if (isset($body['status'])) {
            $status = (string) $body['status'];
            if (!in_array($status, Appointment::STATUSES, true)) {
                return $this->error('Estado inválido.', 422);
            }
            if ($status === Appointment::STATUS_CANCELLED) {
                $bookingService->cancelAppointment($appointment, (string) ($body['cancel_reason'] ?? ''));
            } else {
                $appointment->setStatus($status);
            }
            $changed = true;
        }

        if (isset($body['date'], $body['time'])) {
            try {
                $bookingService->rescheduleAppointment(
                    $appointment,
                    new \DateTimeImmutable((string) $body['date']),
                    sprintf('%02d:%02d', (int) explode(':', (string) $body['time'])[0], (int) explode(':', (string) $body['time'])[1]),
                );
                $changed = true;
            } catch (\InvalidArgumentException $e) {
                return $this->error($e->getMessage(), 409);
            }
        }

        if (isset($body['notes'])) {
            $appointment->setNotes((string) $body['notes']);
            $changed = true;
        }

        if ($changed) {
            $appointment->touch();
            $this->em->flush();
        }

        return new JsonResponse(['data' => $this->appointmentView($appointment)]);
    }

    #[Route('/calendar', name: 'api_admin_calendar', methods: ['GET'])]
    public function calendar(Request $request): JsonResponse
    {
        $from = $request->query->get('from', (new \DateTimeImmutable('first day of this month'))->format('Y-m-d'));
        $to = $request->query->get('to', (new \DateTimeImmutable('last day of this month'))->format('Y-m-d'));

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            return $this->error('Rango inválido.', 422);
        }

        $rows = $this->em->createQueryBuilder()
            ->select('a')->from(Appointment::class, 'a')
            ->join('a.contact', 'c')->join('a.service', 's')
            ->where('a.date >= :from')->andWhere('a.date <= :to')
            ->andWhere('a.status != :cancelled')
            ->orderBy('a.date', 'ASC')->addOrderBy('a.time', 'ASC')
            ->setParameter('from', $from)->setParameter('to', $to)
            ->setParameter('cancelled', Appointment::STATUS_CANCELLED)
            ->getQuery()->getResult();

        $grouped = [];
        foreach ($rows as $a) {
            $key = $a->getDate()->format('Y-m-d');
            $grouped[$key][] = [
                'id' => $a->getId(),
                'time' => $a->getTime(),
                'service' => $a->getService()->getName(),
                'contact' => $a->getContact()->getName(),
                'phone' => $a->getContact()->getPhone(),
                'status' => $a->getStatus(),
                'duration' => $a->getDurationMinutes(),
            ];
        }

        return new JsonResponse(['data' => $grouped, 'from' => $from, 'to' => $to]);
    }

    #[Route('/services', name: 'api_admin_services_list', methods: ['GET'])]
    public function servicesList(ServiceRepository $services, SerializerInterface $serializer): JsonResponse
    {
        $data = $serializer->normalize($services->findAll(), null, ['groups' => ['admin']]);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/services', name: 'api_admin_services_create', methods: ['POST'])]
    public function servicesCreate(Request $request): JsonResponse
    {
        $body = $this->body($request);
        try {
            $service = $this->hydrateService(new Service(), $body);
            $this->em->persist($service);
            $this->em->flush();
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return new JsonResponse(['data' => $this->serviceView($service)], Response::HTTP_CREATED);
    }

    #[Route('/services/{id}', name: 'api_admin_services_update', methods: ['PATCH'])]
    public function servicesUpdate(int $id, Request $request): JsonResponse
    {
        $service = $this->em->find(Service::class, $id);
        if ($service === null) {
            return $this->error('Servicio no encontrado.', 404);
        }
        try {
            $this->hydrateService($service, $this->body($request), partial: true);
            $service->touch();
            $this->em->flush();
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return new JsonResponse(['data' => $this->serviceView($service)]);
    }

    #[Route('/services/{id}', name: 'api_admin_services_delete', methods: ['DELETE'])]
    public function servicesDelete(int $id): JsonResponse
    {
        $service = $this->em->find(Service::class, $id);
        if ($service === null) {
            return $this->error('Servicio no encontrado.', 404);
        }

        $active = $this->em->createQueryBuilder()
            ->select('COUNT(a.id)')->from(Appointment::class, 'a')
            ->where('a.service = :s')->setParameter('s', $service)
            ->getQuery()->getSingleScalarResult();

        if ((int) $active > 0) {
            $service->setActive(false);
            $service->touch();
            $this->em->flush();

            return new JsonResponse(['data' => $this->serviceView($service), 'message' => 'Servicio desactivado (tiene citas asociadas).']);
        }

        $this->em->remove($service);
        $this->em->flush();

        return new JsonResponse(['ok' => true], Response::HTTP_NO_CONTENT);
    }

    #[Route('/business-hours', name: 'api_admin_hours_list', methods: ['GET'])]
    public function hoursList(SerializerInterface $serializer): JsonResponse
    {
        $data = $serializer->normalize($this->em->getRepository(BusinessHour::class)->findAll(), null, ['groups' => ['admin']]);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/business-hours', name: 'api_admin_hours_save', methods: ['PUT'])]
    public function hoursReplace(Request $request): JsonResponse
    {
        $body = $request->toArray();
        $items = is_array($body['data'] ?? $body) ? (array) ($body['data'] ?? $body) : [];

        $this->em->wrapInTransaction(function () use ($items) {
            $existing = $this->em->getRepository(BusinessHour::class)->findAll();
            foreach ($existing as $hour) {
                $this->em->remove($hour);
            }
            $this->em->flush();

            foreach ($items as $item) {
                $hour = new BusinessHour();
                $hour->setDayOfWeek((int) ($item['day_of_week'] ?? 0));
                $hour->setOpenTime((string) ($item['open_time'] ?? '09:00'));
                $hour->setCloseTime((string) ($item['close_time'] ?? '18:00'));
                $hour->setSlotInterval((int) ($item['slot_interval'] ?? 30));
                $hour->setActive((bool) ($item['active'] ?? true));
                $this->em->persist($hour);
            }
            $this->em->flush();
        });

        return new JsonResponse(['ok' => true]);
    }

    #[Route('/business-exceptions', name: 'api_admin_exceptions_list', methods: ['GET'])]
    public function exceptionsList(SerializerInterface $serializer): JsonResponse
    {
        $data = $serializer->normalize($this->em->getRepository(BusinessException::class)->findAll(), null, ['groups' => ['admin']]);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/business-exceptions', name: 'api_admin_exceptions_create', methods: ['POST'])]
    public function exceptionsCreate(Request $request): JsonResponse
    {
        $body = $this->body($request);
        $date = $body['date'] ?? '';
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $date)) {
            return $this->error('Fecha inválida.', 422);
        }

        $exception = new BusinessException();
        $exception->setExceptionDate(new \DateTimeImmutable($date));
        $exception->setReason(isset($body['reason']) ? (string) $body['reason'] : null);
        $this->em->persist($exception);
        $this->em->flush();

        return new JsonResponse(['data' => ['id' => $exception->getId(), 'date' => $date, 'reason' => $exception->getReason()]], Response::HTTP_CREATED);
    }

    #[Route('/business-exceptions/{id}', name: 'api_admin_exceptions_delete', methods: ['DELETE'])]
    public function exceptionsDelete(int $id): JsonResponse
    {
        $exception = $this->em->find(BusinessException::class, $id);
        if ($exception === null) {
            return $this->error('No encontrado.', 404);
        }
        $this->em->remove($exception);
        $this->em->flush();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    #[Route('/conversations', name: 'api_admin_conversations', methods: ['GET'])]
    public function conversations(Request $request): JsonResponse
    {
        $limit = min(500, max(1, $request->query->getInt('limit', 100)));
        $offset = max(0, $request->query->getInt('offset', 0));

        $conversations = $this->em->getRepository(Conversation::class)->createQueryBuilder('c')
            ->leftJoin('c.contact', 'contact')->addSelect('contact')
            ->orderBy('c.updatedAt', 'DESC')
            ->setMaxResults($limit)->setFirstResult($offset)
            ->getQuery()->getResult();

        $maxIds = $this->em->createQueryBuilder()
            ->select('m.waId AS waId, MAX(m.id) AS maxId')
            ->from(Message::class, 'm')
            ->groupBy('m.waId')
            ->getQuery()->getResult();
        $maxIds = array_column($maxIds, 'maxId', 'waId');

        $bodies = [];
        if ($maxIds !== []) {
            $rows = $this->em->createQueryBuilder()
                ->select('m.waId, m.body')
                ->from(Message::class, 'm')
                ->where('m.id IN (:ids)')
                ->setParameter('ids', array_values($maxIds))
                ->getQuery()->getResult();
            $bodies = array_column($rows, 'body', 'waId');
        }

        $data = array_map(function (Conversation $c) use ($bodies) {
            return [
                'id' => $c->getId(),
                'wa_id' => $c->getWaId(),
                'contact' => $c->getContact()?->getName(),
                'status' => $c->getStatus(),
                'updated_at' => $c->getUpdatedAt()?->format('Y-m-d H:i:s'),
                'last_message' => $bodies[$c->getWaId()] ?? null,
            ];
        }, $conversations);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/conversations/{id}', name: 'api_admin_conversation_get', methods: ['GET'])]
    public function conversation(int $id, MessageRepository $messages): JsonResponse
    {
        $conversation = $this->em->find(Conversation::class, $id);
        if ($conversation === null) {
            return $this->error('Conversación no encontrada.', 404);
        }

        $history = $messages->findByWaIdPaginated($conversation->getWaId(), 100);

        $sessions = $this->em->getRepository(BookingSession::class)->findBy(['waId' => $conversation->getWaId()], ['createdAt' => 'DESC']);

        return new JsonResponse([
            'data' => [
                'id' => $conversation->getId(),
                'wa_id' => $conversation->getWaId(),
                'contact' => [
                    'name' => $conversation->getContact()?->getName(),
                    'phone' => $conversation->getContact()?->getPhone(),
                ],
                'status' => $conversation->getStatus(),
                'channel' => $conversation->getChannel(),
                'messages' => array_map(fn (Message $m) => [
                    'id' => $m->getId(),
                    'direction' => $m->getDirection(),
                    'body' => $m->getBody(),
                    'created_at' => $m->getCreatedAt()->format('Y-m-d H:i:s'),
                ], array_reverse($history)),
                'sessions' => array_map(fn (BookingSession $s) => [
                    'token' => $s->getToken(),
                    'status' => $s->getStatus(),
                    'service' => $s->getSuggestedService(),
                    'date' => $s->getPreferredDate()?->format('Y-m-d'),
                    'time' => $s->getPreferredTime(),
                    'expires_at' => $s->getExpiresAt()->format('Y-m-d H:i:s'),
                ], $sessions),
            ],
        ]);
    }

    #[Route('/conversations/{id}/messages', name: 'api_admin_conversation_reply', methods: ['POST'])]
    public function conversationReply(int $id, Request $request, WhatsAppSender $whatsappSender): JsonResponse
    {
        $conversation = $this->em->find(Conversation::class, $id);
        if ($conversation === null) {
            return $this->error('Conversación no encontrada.', 404);
        }

        $text = trim((string) ($this->body($request)['text'] ?? ''));
        if ($text === '') {
            return $this->error('El texto es obligatorio.', 422);
        }

        $waId = $conversation->getWaId();
        $channel = $conversation->getChannel();
        $sent = $whatsappSender->sendText($waId, $text, $channel);

        $message = new Message();
        $message->setContact($conversation->getContact());
        $message->setWaId($waId);
        $message->setDirection(Message::DIR_OUT);
        $message->setChannel($channel);
        $message->setBody($text);
        $message->setStatus($sent ? 'sent' : 'failed');
        $this->em->persist($message);
        $this->em->flush();

        return new JsonResponse(['data' => ['sent' => $sent, 'status' => $message->getStatus(), 'id' => $message->getId()]]);
    }

    private function appointmentView(Appointment $a): array
    {
        return [
            'id' => $a->getId(),
            'status' => $a->getStatus(),
            'date' => $a->getDate()->format('Y-m-d'),
            'time' => $a->getTime(),
            'duration_minutes' => $a->getDurationMinutes(),
            'price' => $a->getPrice(),
            'notes' => $a->getNotes(),
            'created_at' => $a->getCreatedAt()->format('Y-m-d H:i:s'),
            'contact' => [
                'id' => $a->getContact()->getId(),
                'name' => $a->getContact()->getName(),
                'phone' => $a->getContact()->getPhone(),
                'wa_id' => $a->getContact()->getWaId(),
            ],
            'service' => [
                'id' => $a->getService()->getId(),
                'name' => $a->getService()->getName(),
                'duration_minutes' => $a->getService()->getDurationMinutes(),
                'price' => $a->getService()->getPrice(),
            ],
        ];
    }

    private function serviceView(Service $s): array
    {
        return [
            'id' => $s->getId(),
            'name' => $s->getName(),
            'description' => $s->getDescription(),
            'duration_minutes' => $s->getDurationMinutes(),
            'price' => $s->getPrice(),
            'active' => $s->isActive(),
        ];
    }

    private function hydrateService(Service $service, array $body, bool $partial = false): Service
    {
        if (!$partial || array_key_exists('name', $body)) {
            $name = trim((string) ($body['name'] ?? ''));
            if ($name === '') {
                throw new \InvalidArgumentException('El nombre es obligatorio.');
            }
            $service->setName($name);
        }
        if (!$partial || array_key_exists('description', $body)) {
            $service->setDescription(isset($body['description']) ? (string) $body['description'] : null);
        }
        if (!$partial || array_key_exists('duration_minutes', $body)) {
            $duration = (int) ($body['duration_minutes'] ?? 0);
            if ($duration <= 0) {
                throw new \InvalidArgumentException('La duración debe ser mayor a 0.');
            }
            $service->setDurationMinutes($duration);
        }
        if (!$partial || array_key_exists('price', $body)) {
            $service->setPrice((string) ($body['price'] ?? '0'));
        }
        if (!$partial || array_key_exists('active', $body)) {
            $service->setActive((bool) ($body['active'] ?? true));
        }

        return $service;
    }

    private function findOrCreateContactForAdmin(array $body): Contact
    {
        $repo = $this->em->getRepository(Contact::class);
        $waId = isset($body['wa_id']) ? trim((string) $body['wa_id']) : null;

        $contact = null;
        if ($waId !== '') {
            $contact = $repo->findOneBy(['waId' => $waId]);
        }

        if ($contact === null) {
            $contact = $repo->findOneBy(['name' => (string) ($body['name'] ?? '')]) ?? new Contact();
            if ($contact->getId() === null) {
                $this->em->persist($contact);
            }
        }

        $contact->setName(trim((string) ($body['name'] ?? $contact->getName() ?? '')));
        if (isset($body['phone'])) {
            $contact->setPhone(preg_replace('/[^\d+]/', '', (string) $body['phone']));
        }
        if ($waId !== '') {
            $contact->setWaId($waId);
        }
        $contact->touch();

        return $contact;
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