<?php

namespace App\Command;

use App\Entity\Appointment;
use App\Entity\Service;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:import-catalog', description: 'Importa el catálogo de estudios CEDIMAX desde data/catalog.json')]
class ImportCatalogCommand extends Command
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('file', null, InputOption::VALUE_OPTIONAL, 'Ruta del JSON del catálogo', __DIR__ . '/../../data/catalog.json')
            ->addOption('reset', null, InputOption::VALUE_NONE, 'Elimina citas y estudios existentes antes de importar.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $file = (string) $input->getOption('file');

        if (!is_file($file)) {
            $io->error('No existe el archivo: ' . $file);

            return Command::FAILURE;
        }

        $json = json_decode((string) file_get_contents($file), true);
        $services = $json['services'] ?? [];
        if ($services === []) {
            $io->error('El catálogo no contiene estudios.');

            return Command::FAILURE;
        }

        if ($input->getOption('reset')) {
            foreach ($this->em->getRepository(Appointment::class)->findAll() as $appointment) {
                $this->em->remove($appointment);
            }
            foreach ($this->em->getRepository(Service::class)->findAll() as $service) {
                $this->em->remove($service);
            }
            $this->em->flush();
            $io->writeln('✔ Citas y estudios existentes eliminados.');
        }

        foreach ($services as $item) {
            $service = new Service();
            $service->setName((string) $item['name']);
            $service->setDescription($item['description'] ?? null);
            $service->setDurationMinutes((int) $item['duration_minutes']);
            $service->setPrice((string) $item['price']);
            $this->em->persist($service);
        }
        $this->em->flush();

        $count = (int) $this->em->getRepository(Service::class)->count([]);
        $io->success(sprintf('Catálogo importado: %d estudios (%d en BD).', count($services), $count));

        return Command::SUCCESS;
    }
}