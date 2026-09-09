<?php

namespace App\Repository;

use App\Entity\BookingSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BookingSession>
 */
class BookingSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BookingSession::class);
    }

    public function findByToken(string $token): ?BookingSession
    {
        return $this->findOneBy(['token' => $token]);
    }
}