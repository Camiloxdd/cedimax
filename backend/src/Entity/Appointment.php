<?php

namespace App\Entity;

use App\Repository\AppointmentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AppointmentRepository::class)]
#[ORM\Table(name: 'appointments')]
class Appointment
{
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_NO_SHOW = 'no_show';

    public const STATUSES = [
        self::STATUS_CONFIRMED,
        self::STATUS_CANCELLED,
        self::STATUS_COMPLETED,
        self::STATUS_NO_SHOW,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['public', 'admin', 'booking'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'appointments')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['admin', 'booking'])]
    private Contact $contact;

    #[ORM\ManyToOne(inversedBy: 'appointments')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    #[Groups(['public', 'admin', 'booking'])]
    private Service $service;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['admin'])]
    private ?BookingSession $session = null;

    #[ORM\Column(type: 'date_immutable')]
    #[Assert\NotBlank]
    #[Groups(['public', 'admin', 'booking'])]
    private \DateTimeImmutable $date;

    #[ORM\Column(type: 'string', length: 5)]
    #[Assert\Regex(pattern: '/^\d{2}:\d{2}$/')]
    #[Groups(['public', 'admin', 'booking'])]
    private string $time;

    #[ORM\Column(type: 'smallint')]
    #[Groups(['public', 'admin', 'booking'])]
    private int $durationMinutes;

    #[ORM\Column(type: 'string', length: 32)]
    #[Groups(['public', 'admin'])]
    private string $status = self::STATUS_CONFIRMED;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    #[Groups(['public', 'admin'])]
    private string $price = '0.00';

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['admin', 'booking'])]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['admin'])]
    private ?\DateTimeImmutable $cancelledAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['admin'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['admin'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContact(): Contact
    {
        return $this->contact;
    }

    public function setContact(Contact $contact): static
    {
        $this->contact = $contact;
        return $this;
    }

    public function getService(): Service
    {
        return $this->service;
    }

    public function setService(Service $service): static
    {
        $this->service = $service;
        return $this;
    }

    public function getSession(): ?BookingSession
    {
        return $this->session;
    }

    public function setSession(?BookingSession $session): static
    {
        $this->session = $session;
        return $this;
    }

    public function getDate(): \DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = \DateTimeImmutable::createFromInterface($date);
        return $this;
    }

    public function getTime(): string
    {
        return $this->time;
    }

    public function setTime(string $time): static
    {
        $this->time = $time;
        return $this;
    }

    public function getDurationMinutes(): int
    {
        return $this->durationMinutes;
    }

    public function setDurationMinutes(int $durationMinutes): static
    {
        $this->durationMinutes = $durationMinutes;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getPrice(): string
    {
        return $this->price;
    }

    public function setPrice(string|int|float $price): static
    {
        $this->price = (string) $price;
        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;
        return $this;
    }

    public function getCancelledAt(): ?\DateTimeImmutable
    {
        return $this->cancelledAt;
    }

    public function setCancelledAt(?\DateTimeImmutable $cancelledAt): static
    {
        $this->cancelledAt = $cancelledAt;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function touch(): static
    {
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }
}