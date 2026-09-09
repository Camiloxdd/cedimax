<?php

namespace App\Repository;

use App\Entity\Appointment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Appointment>
 */
class AppointmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Appointment::class);
    }

    /**
     * Citas activas (no canceladas) de una fecha concreta.
     *
     * @return Appointment[]
     */
    public function findActiveForDate(\DateTimeInterface $date): array
    {
        $start = \DateTimeImmutable::createFromInterface($date)->modify('midnight');
        $end = $start->modify('+1 day');

        return $this->createQueryBuilder('a')
            ->where('a.date >= :start')
            ->andWhere('a.date < :end')
            ->andWhere('a.status != :cancelled')
            ->orderBy('a.time', 'ASC')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setParameter('cancelled', Appointment::STATUS_CANCELLED)
            ->getQuery()
            ->getResult();
    }
}