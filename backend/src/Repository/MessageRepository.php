<?php

namespace App\Repository;

use App\Entity\Message;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Message>
 */
class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    public function findByWebhookId(string $webhookId): ?Message
    {
        return $this->findOneBy(['webhookId' => $webhookId]);
    }

    /**
     * @return Message[]
     */
    public function findByWaIdPaginated(string $waId, int $limit, int $offset = 0): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.waId = :waId')
            ->setParameter('waId', $waId)
            ->orderBy('m.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }
}