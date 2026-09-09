<?php

namespace App\Entity;

use App\Repository\BusinessHourRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: BusinessHourRepository::class)]
#[ORM\Table(name: 'business_hours')]
class BusinessHour
{
    public const DOW_NAMES = [
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miércoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sábado',
        7 => 'Domingo',
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['admin', 'public'])]
    private ?int $id = null;

    #[ORM\Column(type: 'smallint')]
    #[Assert\Range(min: 1, max: 7)]
    #[Groups(['admin', 'public'])]
    private int $dayOfWeek;

    #[ORM\Column(type: 'string', length: 5)]
    #[Assert\Regex(pattern: '/^\d{2}:\d{2}$/')]
    #[Groups(['admin', 'public'])]
    private string $openTime = '09:00';

    #[ORM\Column(type: 'string', length: 5)]
    #[Assert\Regex(pattern: '/^\d{2}:\d{2}$/')]
    #[Groups(['admin', 'public'])]
    private string $closeTime = '18:00';

    #[ORM\Column(type: 'smallint')]
    #[Assert\Range(min: 5, max: 240)]
    #[Groups(['admin', 'public'])]
    private int $slotInterval = 30;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['admin'])]
    private bool $active = true;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDayOfWeek(): int
    {
        return $this->dayOfWeek;
    }

    public function setDayOfWeek(int $dayOfWeek): static
    {
        $this->dayOfWeek = $dayOfWeek;
        return $this;
    }

    public function getOpenTime(): string
    {
        return $this->openTime;
    }

    public function setOpenTime(string $openTime): static
    {
        $this->openTime = $openTime;
        return $this;
    }

    public function getCloseTime(): string
    {
        return $this->closeTime;
    }

    public function setCloseTime(string $closeTime): static
    {
        $this->closeTime = $closeTime;
        return $this;
    }

    public function getSlotInterval(): int
    {
        return $this->slotInterval;
    }

    public function setSlotInterval(int $slotInterval): static
    {
        $this->slotInterval = $slotInterval;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): static
    {
        $this->active = $active;
        return $this;
    }
}