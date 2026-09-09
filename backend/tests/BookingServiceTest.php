<?php

declare(strict_types=1);

namespace App\Tests;

use App\Entity\Appointment;
use App\Repository\AppointmentRepository;
use App\Repository\BookingSessionRepository;
use App\Repository\ContactRepository;
use App\Repository\ServiceRepository;
use App\Service\BookingService;
use App\Service\SlotService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

final class BookingServiceTest extends TestCase
{
    private EntityManagerInterface $em;
    private BookingSessionRepository $sessionRepository;
    private ServiceRepository $serviceRepository;
    private ContactRepository $contactRepository;
    private AppointmentRepository $appointmentRepository;
    private SlotService $slotService;
    private LoggerInterface $logger;

    protected function setUp(): void
    {
        $this->em = $this->createStub(EntityManagerInterface::class);
        $this->sessionRepository = $this->createStub(BookingSessionRepository::class);
        $this->serviceRepository = $this->createStub(ServiceRepository::class);
        $this->contactRepository = $this->createStub(ContactRepository::class);
        $this->appointmentRepository = $this->createStub(AppointmentRepository::class);
        $this->slotService = $this->createStub(SlotService::class);
        $this->logger = $this->createStub(LoggerInterface::class);
    }

    private function createService(): BookingService
    {
        return new BookingService(
            $this->em,
            $this->sessionRepository,
            $this->serviceRepository,
            $this->contactRepository,
            $this->appointmentRepository,
            $this->slotService,
            $this->logger,
        );
    }

    public function testCreateBookingThrowsWhenTokenInvalid(): void
    {
        $this->sessionRepository->method('findByToken')->willReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('El enlace de reserva no es valido o ya fue utilizado.');

        $this->createService()->createBooking('bad-token', 1, new \DateTimeImmutable('2027-12-15'), '10:00', 'Ana', '3100000000');
    }

    public function testRescheduleThrowsWhenLockCannotBeAcquired(): void
    {
        $connection = $this->createStub(\Doctrine\DBAL\Connection::class);
        $connection->method('fetchOne')->willReturn(0);
        $this->em->method('getConnection')->willReturn($connection);

        $appointment = new Appointment();
        $appointment->setDate(new \DateTimeImmutable('2027-12-01'));
        $appointment->setTime('10:00');
        $appointment->setDurationMinutes(30);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('No se pudo adquirir el bloqueo del horario, intenta de nuevo.');

        $this->createService()->rescheduleAppointment($appointment, new \DateTimeImmutable('2027-12-15'), '14:30');
    }

    public function testRescheduleUpdatesAppointmentWhenAvailable(): void
    {
        $connection = $this->createStub(\Doctrine\DBAL\Connection::class);
        $connection->method('fetchOne')->willReturn(1);
        $this->em->method('getConnection')->willReturn($connection);
        $this->slotService->method('availableSlots')->willReturn(['10:00', '14:30']);

        $appointment = new Appointment();
        $appointment->setDate(new \DateTimeImmutable('2027-12-01'));
        $appointment->setTime('10:00');
        $appointment->setDurationMinutes(30);

        $this->createService()->rescheduleAppointment($appointment, new \DateTimeImmutable('2027-12-15'), '14:30');

        self::assertSame('2027-12-15', $appointment->getDate()->format('Y-m-d'));
        self::assertSame('14:30', $appointment->getTime());
    }
}