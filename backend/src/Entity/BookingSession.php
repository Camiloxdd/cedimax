<?php

namespace App\Entity;

use App\Repository\BookingSessionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: BookingSessionRepository::class)]
#[ORM\Table(name: 'booking_sessions')]
class BookingSession
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['admin'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 24, unique: true)]
    #[Groups(['public', 'admin'])]
    private string $token;

    #[ORM\ManyToOne(inversedBy: 'bookingSessions')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['admin'])]
    private ?Conversation $conversation = null;

    #[ORM\ManyToOne(inversedBy: 'bookingSessions')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['admin'])]
    private ?Contact $contact = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    #[Groups(['admin'])]
    private ?string $waId = null;

    #[ORM\Column(type: 'string', length: 16)]
    #[Groups(['admin'])]
    private string $channel = 'whatsapp';

    #[ORM\Column(type: 'string', length: 32)]
    #[Groups(['admin'])]
    private string $status = 'pending';

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['public'])]
    private ?string $suggestedService = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Groups(['public'])]
    private ?int $serviceId = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    #[Groups(['public'])]
    private ?\DateTimeImmutable $preferredDate = null;

    #[ORM\Column(type: 'string', length: 5, nullable: true)]
    #[Groups(['public'])]
    private ?string $preferredTime = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['public'])]
    private ?string $customerName = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    #[Groups(['public'])]
    private ?string $customerPhone = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['public'])]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function setToken(string $token): static
    {
        $this->token = $token;
        return $this;
    }

    public function getConversation(): ?Conversation
    {
        return $this->conversation;
    }

    public function setConversation(?Conversation $conversation): static
    {
        $this->conversation = $conversation;
        return $this;
    }

    public function getContact(): ?Contact
    {
        return $this->contact;
    }

    public function setContact(?Contact $contact): static
    {
        $this->contact = $contact;
        return $this;
    }

    public function getWaId(): ?string
    {
        return $this->waId;
    }

    public function setWaId(?string $waId): static
    {
        $this->waId = $waId;
        return $this;
    }

    public function getChannel(): string
    {
        return $this->channel;
    }

    public function setChannel(string $channel): static
    {
        $this->channel = $channel;
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

    public function getSuggestedService(): ?string
    {
        return $this->suggestedService;
    }

    public function setSuggestedService(?string $suggestedService): static
    {
        $this->suggestedService = $suggestedService;
        return $this;
    }

    public function getServiceId(): ?int
    {
        return $this->serviceId;
    }

    public function setServiceId(?int $serviceId): static
    {
        $this->serviceId = $serviceId;
        return $this;
    }

    public function getPreferredDate(): ?\DateTimeImmutable
    {
        return $this->preferredDate;
    }

    public function setPreferredDate(?\DateTimeInterface $preferredDate): static
    {
        $this->preferredDate = $preferredDate !== null ? \DateTimeImmutable::createFromInterface($preferredDate) : null;
        return $this;
    }

    public function getPreferredTime(): ?string
    {
        return $this->preferredTime;
    }

    public function setPreferredTime(?string $preferredTime): static
    {
        $this->preferredTime = $preferredTime;
        return $this;
    }

    public function getCustomerName(): ?string
    {
        return $this->customerName;
    }

    public function setCustomerName(?string $customerName): static
    {
        $this->customerName = $customerName;
        return $this;
    }

    public function getCustomerPhone(): ?string
    {
        return $this->customerPhone;
    }

    public function setCustomerPhone(?string $customerPhone): static
    {
        $this->customerPhone = $customerPhone;
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

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }

    public function isExpired(): bool
    {
        return $this->expiresAt < new \DateTimeImmutable();
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}