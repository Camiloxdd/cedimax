<?php
// Script temporal de prueba: crea una BookingSession y muestra su token.
use App\Entity\BookingSession;
use App\Kernel;
use Symfony\Component\HttpFoundation\Request;

require dirname(__DIR__) . '/vendor/autoload_runtime.php';

return function (array $context) {
    $kernel = new Kernel('dev', true);
    $kernel->boot();
    $em = $kernel->getContainer()->get('doctrine')->getManager();

    $session = new BookingSession();
    $session->setToken('testtoken' . substr(bin2hex(random_bytes(8)), 0, 12));
    $session->setWaId('573001112233');
    $session->setSuggestedService('Corte de cabello');
    $session->setServiceId(1);
    $session->setExpiresAt(new \DateTimeImmutable('+60 minutes'));
    $em->persist($session);
    $em->flush();

    echo 'TOKEN=' . $session->getToken() . PHP_EOL;
};