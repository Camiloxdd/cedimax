<?php

declare(strict_types=1);

namespace App\Tests;

use App\Entity\Appointment;
use App\Entity\BusinessException;
use App\Entity\BusinessHour;
use App\Repository\AppointmentRepository;
use App\Repository\BusinessExceptionRepository;
use App\Repository\BusinessHourRepository;
use App\Service\SlotService;
use PHPUnit\Framework\TestCase;

final class SlotServiceTest extends TestCase
{
    private BusinessHourRepository $hoursRepository;
    private BusinessExceptionRepository $exceptionRepository;
    private AppointmentRepository $appointmentRepository;
    private SlotService $service;

    protected function setUp(): void
    {
        $this->hoursRepository = $this->createStub(BusinessHourRepository::class);
        $this->exceptionRepository = $this->createStub(BusinessExceptionRepository::class);
        $this->appointmentRepository = $this->createStub(AppointmentRepository::class);
        $this->service = new SlotService($this->hoursRepository, $this->exceptionRepository, $this->appointmentRepository);
    }

    private function makeHour(int $weekday, string $open, string $close, int $interval, bool $active = true): BusinessHour
    {
        $hour = new BusinessHour();
        $hour->setDayOfWeek($weekday);
        $hour->setOpenTime($open);
        $hour->setCloseTime($close);
        $hour->setSlotInterval($interval);
        $hour->setActive($active);

        return $hour;
    }

    private function makeAppointment(string $time, int $duration): Appointment
    {
        $appointment = new Appointment();
        $appointment->setDate(new \DateTimeImmutable('2027-12-15'));
        $appointment->setTime($time);
        $appointment->setDurationMinutes($duration);

        return $appointment;
    }

    public function testNoSlotsWhenDayIsClosed(): void
    {
        $this->hoursRepository->method('findActiveByDay')->willReturn(null);

        self::assertSame([], $this->service->availableSlots(new \DateTimeImmutable('2027-12-15'), 30));
    }

    public function testNoSlotsWhenDateIsException(): void
    {
        $exception = new BusinessException();
        $exception->setExceptionDate(new \DateTimeImmutable('2027-12-15'));
        $this->hoursRepository->method('findActiveByDay')->willReturn($this->makeHour(3, '09:00', '12:00', 60));
        $this->exceptionRepository->method('findByDate')->willReturn($exception);
        $this->appointmentRepository->method('findActiveForDate')->willReturn([]);

        self::assertSame([], $this->service->availableSlots(new \DateTimeImmutable('2027-12-15'), 30));
    }

    public function testSlotsFollowIntervalStep(): void
    {
        $this->hoursRepository->method('findActiveByDay')->willReturn($this->makeHour(3, '09:00', '12:00', 60));
        $this->exceptionRepository->method('findByDate')->willReturn(null);
        $this->appointmentRepository->method('findActiveForDate')->willReturn([]);

        self::assertSame(
            ['09:00', '10:00', '11:00'],
            $this->service->availableSlots(new \DateTimeImmutable('2027-12-15'), 60),
        );
    }

    public function testSlotsAccountForDifferentDurations(): void
    {
        $this->hoursRepository->method('findActiveByDay')->willReturn($this->makeHour(3, '09:00', '12:30', 60));
        $this->exceptionRepository->method('findByDate')->willReturn(null);
        $this->appointmentRepository->method('findActiveForDate')->willReturn([]);

        // Con 120 min solo caben 09:00 y 10:00 (11:00 no alcanza a cerrar a las 12:30).
        self::assertSame(
            ['09:00', '10:00'],
            $this->service->availableSlots(new \DateTimeImmutable('2027-12-15'), 120),
        );
    }

    public function testOverlappingAppointmentBlocksSlot(): void
    {
        $this->hoursRepository->method('findActiveByDay')->willReturn($this->makeHour(3, '09:00', '13:00', 60));
        $this->exceptionRepository->method('findByDate')->willReturn(null);
        $this->appointmentRepository->method('findActiveForDate')->willReturn([
            $this->makeAppointment('10:00', 60),
        ]);

        // 10:00 ocupado por una cita de 60 min.
        self::assertSame(
            ['09:00', '11:00', '12:00'],
            $this->service->availableSlots(new \DateTimeImmutable('2027-12-15'), 60),
        );
    }

    public function testTheoreticalSlotsIgnoresAppointments(): void
    {
        $this->hoursRepository->method('findActiveByDay')->willReturn($this->makeHour(3, '09:00', '12:00', 30));

        self::assertSame(
            ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
            $this->service->theoreticalSlots(new \DateTimeImmutable('2027-12-15')),
        );
    }
}