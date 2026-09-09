<?php

namespace App\Service;

use App\Entity\Appointment;
use App\Entity\BookingSession;
use App\Entity\Contact;
use App\Repository\AppointmentRepository;
use App\Repository\BookingSessionRepository;
use App\Repository\ContactRepository;
use App\Repository\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class BookingService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BookingSessionRepository $sessionRepository,
        private readonly ServiceRepository $serviceRepository,
        private readonly ContactRepository $contactRepository,
        private readonly AppointmentRepository $appointmentRepository,
        private readonly SlotService $slotService,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @throws \InvalidArgumentException si la reserva no es valida
     */
    public function createBooking(
        string $token,
        int $serviceId,
        \DateTimeInterface $date,
        string $time,
        string $customerName,
        string $customerPhone,
        ?string $notes = null,
    ): Appointment {
        $session = $this->sessionRepository->findByToken($token);
        if ($session === null || $session->isExpired() || $session->getStatus() === 'booked') {
            throw new \InvalidArgumentException('El enlace de reserva no es valido o ya fue utilizado.');
        }

        $service = $this->serviceRepository->find($serviceId);
        if ($service === null || !$service->isActive()) {
            throw new \InvalidArgumentException('El servicio seleccionado no existe.');
        }

        $serviceName = $service->getName();
        $lockName = sprintf('cedimax_slot_%s_%s', $date->format('Y-m-d'), $time);

        try {
            $this->em->wrapInTransaction(function () use ($date, $time, $service, $session, $customerName, $customerPhone, $notes, $serviceName, $lockName, &$appointment) {
                $locked = $this->em->getConnection()->fetchOne('SELECT GET_LOCK(:name, 10)', ['name' => $lockName]);
                if (!$locked) {
                    throw new \RuntimeException('No se pudo adquirir el bloqueo para el horario.');
                }

                try {
                    $free = in_array($time, $this->slotService->availableSlots($date, $service->getDurationMinutes()), true);
                    if (!$free) {
                        throw new \InvalidArgumentException('El horario seleccionado ya no esta disponible.');
                    }

                    $contact = $this->contactRepository->findOrCreateByWaId($session->getWaId() ?? 'wa_web_' . bin2hex(random_bytes(10)));
                    $contact->setName($customerName);
                    $contact->setPhone($customerPhone);
                    if ($serviceName !== null && $session->getServiceId() === null) {
                        $session->setServiceId($service->getId());
                        $session->setSuggestedService($service->getName());
                    }
                    $contact->touch();

                    $appointment = new Appointment();
                    $appointment->setContact($contact);
                    $appointment->setService($service);
                    $appointment->setSession($session);
                    $appointment->setDate($date);
                    $appointment->setTime($time);
                    $appointment->setDurationMinutes($service->getDurationMinutes());
                    $appointment->setPrice($service->getPrice());
                    $appointment->setNotes($notes);

                    $session->setStatus('booked');
                    $session->setCustomerName($customerName);
                    $session->setCustomerPhone($customerPhone);
                    $session->setNotes($notes);

                    $this->em->persist($appointment);
                    $this->em->flush();
                } finally {
                    $this->em->getConnection()->executeStatement('SELECT RELEASE_LOCK(:name)', ['name' => $lockName]);
                }
            });
        } catch (\Throwable $e) {
            $this->logger->error('Error creando reserva: ' . $e->getMessage(), ['token' => $token]);
            throw $e;
        }

        return $appointment;
    }

    /**
     * Cancela una cita y libera el cupo. Opcionalmente notifica por WhatsApp.
     */
    public function cancelAppointment(Appointment $appointment, string $reason = ''): void
    {
        $appointment->setStatus(Appointment::STATUS_CANCELLED);
        $appointment->setCancelledAt(new \DateTimeImmutable());
        if ($reason !== '') {
            $appointment->setNotes(trim(($appointment->getNotes() ?? '') . "\n[Cancelada] " . $reason));
        }
        $appointment->touch();
        $this->em->flush();
    }

    /**
     * Cambia fecha/hora de una cita validando disponibilidad (usa el SlotService).
     *
     * @throws \InvalidArgumentException si el nuevo horario no esta disponible
     */
    public function rescheduleAppointment(Appointment $appointment, \DateTimeInterface $date, string $time): void
    {
        $lockName = sprintf('cedimax_slot_%s_%s', $date->format('Y-m-d'), $time);
        $conn = $this->em->getConnection();
        $locked = $conn->fetchOne('SELECT GET_LOCK(:name, 10)', ['name' => $lockName]);
        if (!$locked) {
            throw new \InvalidArgumentException('No se pudo adquirir el bloqueo del horario, intenta de nuevo.');
        }

        try {
            $free = in_array($time, $this->slotService->availableSlots($date, $appointment->getDurationMinutes()), true);
            if (!$free) {
                throw new \InvalidArgumentException('El nuevo horario ya no esta disponible.');
            }

            $appointment->setDate($date);
            $appointment->setTime($time);
            $appointment->touch();
            $this->em->flush();
        } finally {
            $conn->executeStatement('SELECT RELEASE_LOCK(:name)', ['name' => $lockName]);
        }
    }
}