<?php

namespace App\Command;

use App\Entity\BusinessException;
use App\Entity\Appointment;
use App\Entity\BusinessHour;
use App\Entity\Service;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed', description: 'Carga los servicios y horarios de CEDIMAX · Centro de Imágenes Diagnósticas')]
class SeedCommand extends Command
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('tipo', null, InputOption::VALUE_OPTIONAL, 'Perfil de datos: "imagenes", "salon", "clinica", "consultoria"', 'imagenes')
            ->addOption('reset', null, InputOption::VALUE_NONE, 'Elimina citas, servicios y horarios existentes antes de cargar los datos.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $profile = (string) $input->getOption('tipo');

        if ($input->getOption('reset')) {
            $this->resetData($io);
        }

        $this->seedServices($profile, $io);
        $this->seedHours($io);

        $io->success('Datos cargados para el perfil "' . $profile . '".');

        return Command::SUCCESS;
    }

    private function resetData(SymfonyStyle $io): void
    {
        $appointments = $this->em->getRepository(Appointment::class)->findAll();
        foreach ($appointments as $appointment) {
            $this->em->remove($appointment);
        }
        $services = $this->em->getRepository(Service::class)->findAll();
        foreach ($services as $service) {
            $this->em->remove($service);
        }
        $hours = $this->em->getRepository(BusinessHour::class)->findAll();
        foreach ($hours as $hour) {
            $this->em->remove($hour);
        }
        $this->em->flush();
        $io->writeln(sprintf('✔ Datos previos eliminados: %d citas, %d servicios, %d horarios.', count($appointments), count($services), count($hours)));
    }

    private function seedServices(string $profile, SymfonyStyle $io): void
    {
        $count = (int) $this->em->getRepository(Service::class)->count([]);
        if ($count > 0) {
            $io->note('Ya existen ' . $count . ' servicios; no se agregan nuevos.');

            return;
        }

        $services = match ($profile) {
            'imagenes' => [
                ['Ecografía de tiroides', 'Estudio de la glándula tiroides y su región anatómica.', 25, '0.00'],
                ['Ecografía de cuello', 'Evaluación de las estructuras y tejidos del cuello.', 25, '0.00'],
                ['Ecografía de glándulas salivales', 'Valoración de parótidas, submaxilares y sublinguales.', 25, '0.00'],
                ['Ecografía de seno', 'Estudio de las glándulas mamarias y tejidos adyacentes.', 25, '0.00'],
                ['Ecografía de abdomen total', 'Evaluación integral de los órganos abdominales.', 25, '0.00'],
                ['Ecografía de hígado y vías biliares', 'Valoración del hígado, la vesícula y las vías biliares.', 25, '0.00'],
                ['Ecografía renal y vías urinarias', 'Estudio de riñones, uréteres y vejiga.', 25, '0.00'],
                ['Ecografía pélvica trans abdominal y trans vaginal', 'Evaluación pélvica mediante abordaje abdominal y vaginal.', 25, '0.00'],
                ['Ecografía de próstata trans abdominal', 'Estudio de la próstata por vía trans abdominal.', 25, '0.00'],
                ['Ecografía testicular', 'Valoración de los testículos y estructuras escrotales.', 25, '0.00'],
                ['Ecografía de hombro, rodilla y tejidos blandos', 'Evaluación osteomuscular y de tejidos blandos.', 25, '0.00'],
                ['Ecografía obstétrica', 'Control de la gestación y desarrollo fetal.', 25, '0.00'],
                ['Doppler', 'Estudio del flujo sanguíneo mediante ultrasonido.', 45, '0.00'],
            ],
            'clinica' => [
                [$d = 'Consulta general', 'Diagnóstico y revisión médica', 30, '35.00'],
                [$d = 'Consulta especializada', 'Valoración por especialista', 45, '60.00'],
                [$d = 'Controles y seguimiento', 'Control o seguimiento de tratamiento', 20, '25.00'],
            ],
            'consultoria' => [
                [$d = 'Sesión de consultoría 1h', 'Sesión individual', 60, '80.00'],
                [$d = 'Consultoría exprés', 'Consulta puntual', 30, '45.00'],
                [$d = 'Acompañamiento mensual', 'Seguimiento mensual continuo', 90, '180.00'],
            ],
            default => [
                ['Corte de cabello', 'Corte, lavado y secado profesional', 30, '15.00'],
                ['Corte + barba', 'Corte y arreglo de barba', 45, '20.00'],
                ['Colorimetría', 'Tinte completo con productos profesionales', 120, '45.00'],
                ['Peinado de evento', 'Peinado para ocasiones especiales', 60, '35.00'],
                ['Manicure y pedicure', 'Cuidado completo de manos y pies', 90, '30.00'],
            ],
        };

        foreach ($services as [$name, $desc, $duration, $price]) {
            $service = new Service();
            $service->setName($name);
            $service->setDescription($desc);
            $service->setDurationMinutes($duration);
            $service->setPrice($price);
            $this->em->persist($service);
        }
        $this->em->flush();
        $io->writeln(sprintf('✔ %d servicios añadidos.', count($services)));
    }

    private function seedHours(SymfonyStyle $io): void
    {
        $count = (int) $this->em->getRepository(BusinessHour::class)->count([]);
        if ($count > 0) {
            $io->note('Ya existen horarios configurados.');

            return;
        }

        $days = [
            [1, '07:00', '18:00'],
            [2, '07:00', '18:00'],
            [3, '07:00', '18:00'],
            [4, '07:00', '18:00'],
            [5, '07:00', '18:00'],
            [6, '07:00', '13:00'],
        ];
        foreach ($days as [$day, $open, $close]) {
            $hour = new BusinessHour();
            $hour->setDayOfWeek($day);
            $hour->setOpenTime($open);
            $hour->setCloseTime($close);
            $hour->setSlotInterval(30);
            $hour->setActive(true);
            $this->em->persist($hour);
        }
        $this->em->flush();
        $io->writeln('✔ Horarios: Lun–Vie 07:00–18:00, Sáb 07:00–13:00 (cada 30 min).');
    }
}