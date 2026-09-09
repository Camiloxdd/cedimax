<?php

namespace App\Entity;

use App\Repository\ContactRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ContactRepository::class)]
#[ORM\Table(name: 'contacts')]
class Contact
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['public', 'admin', 'conversation', 'booking'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true, unique: true)]
    #[Groups(['admin', 'conversation'])]
    private ?string $waId = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['public', 'admin', 'conversation', 'booking'])]
    private ?string $name = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    #[Groups(['public', 'admin', 'booking'])]
    private ?string $phone = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['admin'])]
    private ?string $notes = null;

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

    public function getWaId(): ?string
    {
        return $this->waId;
    }

    public function setWaId(?string $waId): static
    {
        $this->waId = $waId;
        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;
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