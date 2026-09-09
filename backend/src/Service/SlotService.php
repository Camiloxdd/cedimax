<?php

namespace App\Service;

use App\Entity\Appointment;
use App\Repository\AppointmentRepository;
use App\Repository\BusinessExceptionRepository;
use App\Repository\BusinessHourRepository;

class SlotService
{
    public function __construct(
        private readonly BusinessHourRepository $hoursRepository,
        private readonly BusinessExceptionRepository $exceptionRepository,
        private readonly AppointmentRepository $appointmentRepository,
    ) {
    }

    /**
     * @return string[] Lista de horas libres en formato H:i
     */
    public function availableSlots(\DateTimeInterface $date, int $durationMinutes): array
    {
        $day = (int) $date->format('N');
        $hour = $this->hoursRepository->findActiveByDay($day);
        if ($hour === null) {
            return [];
        }
        if ($this->exceptionRepository->findByDate($date) !== null) {
            return [];
        }

        $appointments = $this->appointmentRepository->findActiveForDate($date);

        $start = $this->toMinutes($hour->getOpenTime());
        $end = $this->toMinutes($hour->getCloseTime());
        $step = $hour->getSlotInterval();

        $now = new \DateTimeImmutable('now', new \DateTimeZone(date_default_timezone_get()));
        $isToday = $date->format('Y-m-d') === $now->format('Y-m-d');

        $slots = [];
        for ($slot = $start; $slot + $durationMinutes <= $end; $slot += $step) {
            if ($isToday && $slot <= $this->toMinutes($now->format('H:i'))) {
                continue;
            }

            $slotStart = $slot;
            $slotEnd = $slot + $durationMinutes;

            $free = true;
            foreach ($appointments as $appointment) {
                $aStart = $this->toMinutes($appointment->getTime());
                $aEnd = $aStart + $appointment->getDurationMinutes();
                if ($aStart < $slotEnd && $slotStart < $aEnd) {
                    $free = false;
                    break;
                }
            }

            if ($free) {
                $slots[] = $this->toTime($slot);
            }
        }

        return $slots;
    }

    /**
     * @return string[] Lista de todos los slots teoricos del dia (libres o no)
     */
    public function theoreticalSlots(\DateTimeInterface $date): array
    {
        $day = (int) $date->format('N');
        $hour = $this->hoursRepository->findActiveByDay($day);
        if ($hour === null) {
            return [];
        }

        $start = $this->toMinutes($hour->getOpenTime());
        $end = $this->toMinutes($hour->getCloseTime());
        $step = $hour->getSlotInterval();

        $slots = [];
        for ($slot = $start; $slot < $end; $slot += $step) {
            $slots[] = $this->toTime($slot);
        }

        return $slots;
    }

    private function toMinutes(string $time): int
    {
        [$h, $m] = explode(':', $time);

        return (int) $h * 60 + (int) $m;
    }

    private function toTime(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }
}