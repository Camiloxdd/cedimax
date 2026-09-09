<?php

namespace App\Repository;

use App\Entity\BusinessHour;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BusinessHour>
 */
class BusinessHourRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BusinessHour::class);
    }

    public function findActiveByDay(int $dayOfWeek): ?BusinessHour
    {
        return $this->findOneBy(['dayOfWeek' => $dayOfWeek, 'active' => true]);
    }
}