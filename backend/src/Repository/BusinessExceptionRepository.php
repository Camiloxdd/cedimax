<?php

namespace App\Repository;

use App\Entity\BusinessException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BusinessException>
 */
class BusinessExceptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BusinessException::class);
    }

    public function findByDate(\DateTimeInterface $date): ?BusinessException
    {
        $start = \DateTimeImmutable::createFromInterface($date)->modify('midnight');
        $end = $start->modify('+1 day');

        return $this->createQueryBuilder('e')
            ->where('e.exceptionDate >= :start')
            ->andWhere('e.exceptionDate < :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}