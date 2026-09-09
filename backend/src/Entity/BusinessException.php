<?php

namespace App\Entity;

use App\Repository\BusinessExceptionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: BusinessExceptionRepository::class)]
#[ORM\Table(name: 'business_exceptions')]
class BusinessException
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['admin'])]
    private ?int $id = null;

    #[ORM\Column(type: 'date_immutable')]
    #[Groups(['admin', 'public'])]
    private \DateTimeImmutable $exceptionDate;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['admin'])]
    private ?string $reason = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getExceptionDate(): \DateTimeImmutable
    {
        return $this->exceptionDate;
    }

    public function setExceptionDate(\DateTimeInterface $exceptionDate): static
    {
        $this->exceptionDate = \DateTimeImmutable::createFromInterface($exceptionDate);
        return $this;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(?string $reason): static
    {
        $this->reason = $reason;
        return $this;
    }
}