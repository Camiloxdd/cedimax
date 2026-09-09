<?php

namespace App\Entity;

use App\Repository\MessageRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MessageRepository::class)]
#[ORM\Table(name: 'messages')]
class Message
{
    public const DIR_IN = 'in';
    public const DIR_OUT = 'out';
public const CHAN_WHATSAPP = 'whatsapp';

    public const CHAN_TELEGRAM = 'telegram';

    public const CHAN_WEB = 'web';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['admin'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['admin'])]
    private ?Contact $contact = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    #[Groups(['admin'])]
    private ?string $waId = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true, unique: true)]
    private ?string $webhookId = null;

    #[ORM\Column(type: 'string', length: 8)]
    #[Groups(['admin'])]
    private string $direction;

    #[ORM\Column(type: 'string', length: 16)]
    #[Groups(['admin'])]
    private string $channel = self::CHAN_WHATSAPP;

    #[ORM\Column(type: 'text')]
    #[Groups(['admin'])]
    private string $body;

    #[ORM\Column(type: 'string', length: 32)]
    #[Groups(['admin'])]
    private string $status = 'received';

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['admin'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getWebhookId(): ?string
    {
        return $this->webhookId;
    }

    public function setWebhookId(?string $webhookId): static
    {
        $this->webhookId = $webhookId;
        return $this;
    }

    public function getDirection(): string
    {
        return $this->direction;
    }

    public function setDirection(string $direction): static
    {
        $this->direction = $direction;
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

    public function getBody(): string
    {
        return $this->body;
    }

    public function setBody(string $body): static
    {
        $this->body = $body;
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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}