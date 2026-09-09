<?php

namespace App\Entity;

use App\Repository\ConversationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ConversationRepository::class)]
#[ORM\Table(name: 'conversations')]
class Conversation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['admin'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'conversations')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['admin'])]
    private ?Contact $contact = null;

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    #[Groups(['admin'])]
    private string $waId;

    #[ORM\Column(type: 'string', length: 16)]
    #[Groups(['admin'])]
    private string $channel = 'whatsapp';

    #[ORM\Column(type: 'string', length: 32)]
    #[Groups(['admin'])]
    private string $status = 'active';

    #[ORM\Column(type: 'json')]
    private array $aiThread = [];

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

    public function getContact(): ?Contact
    {
        return $this->contact;
    }

    public function setContact(?Contact $contact): static
    {
        $this->contact = $contact;
        return $this;
    }

    public function getWaId(): string
    {
        return $this->waId;
    }

    public function setWaId(string $waId): static
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

    /**
     * @return array<int, array{role: string, content: string}>
     */
    public function getAiThread(): array
    {
        return $this->aiThread;
    }

    /**
     * @param array<int, array{role: string, content: string}> $aiThread
     */
    public function setAiThread(array $aiThread): static
    {
        $this->aiThread = $aiThread;
        return $this;
    }

    public function appendAiMessage(string $role, string $content): static
    {
        $this->aiThread[] = ['role' => $role, 'content' => $content];
        $this->aiThread = array_slice($this->aiThread, -30);
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