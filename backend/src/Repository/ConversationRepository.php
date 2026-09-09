<?php

namespace App\Repository;

use App\Entity\Conversation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Conversation>
 */
class ConversationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Conversation::class);
    }

    public function findByWaId(string $waId): ?Conversation
    {
        return $this->findOneBy(['waId' => $waId]);
    }

    public function findOrCreateByWaId(string $waId): Conversation
    {
        $conversation = $this->findByWaId($waId);
        if ($conversation === null) {
            $conversation = new Conversation();
            $conversation->setWaId($waId);
            $this->getEntityManager()->persist($conversation);
        }

        return $conversation;
    }
}