<?php

namespace App\Repository;

use App\Entity\Contact;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Contact>
 */
class ContactRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Contact::class);
    }

    public function findByWaId(string $waId): ?Contact
    {
        return $this->findOneBy(['waId' => $waId]);
    }

    public function findOrCreateByWaId(string $waId): Contact
    {
        $contact = $this->findByWaId($waId);
        if ($contact === null) {
            $contact = new Contact();
            $contact->setWaId($waId);
            $this->getEntityManager()->persist($contact);
        }

        return $contact;
    }
}