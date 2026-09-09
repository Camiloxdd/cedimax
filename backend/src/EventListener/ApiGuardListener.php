<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Psr\Log\LoggerInterface;

class ApiGuardListener
{
    public function __construct(
        private readonly string $adminApiKey,
        private readonly string $allowedOrigins,
        private readonly RateLimiterFactory $apiPublicFactory,
        private readonly RateLimiterFactory $apiAdminFactory,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 255)]
    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        if ($request->getMethod() === Request::METHOD_OPTIONS) {
            $response = new Response('', Response::HTTP_NO_CONTENT);
            $this->applyCors($request, $response);
            $event->setResponse($response);

            return;
        }

        if ($this->consumeRateLimit($request) === false) {
            $event->setResponse(new JsonResponse(['error' => 'Demasiadas peticiones. Intenta de nuevo en un momento.'], Response::HTTP_TOO_MANY_REQUESTS));

            return;
        }

        if (str_starts_with($request->getPathInfo(), '/api/admin')) {
            $key = (string) $request->headers->get('X-Admin-Key', '');
            if (!hash_equals($this->adminApiKey, $key)) {
                $event->setResponse(new JsonResponse(['error' => 'No autorizado.'], Response::HTTP_UNAUTHORIZED));

                return;
            }
        }
    }

    private function consumeRateLimit(Request $request): bool
    {
        try {
            $factory = str_starts_with($request->getPathInfo(), '/api/admin')
                ? $this->apiAdminFactory
                : $this->apiPublicFactory;
            $limiter = $factory->create((string) $request->getClientIp());

            return $limiter->consume(1)->isAccepted();
        } catch (\Throwable $e) {
            $this->logger->warning('Rate limiter no disponible: ' . $e->getMessage());

            return true;
        }
    }

    #[AsEventListener(event: KernelEvents::RESPONSE)]
    public function onKernelResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }
        $this->applyCors($request, $event->getResponse());
    }

    #[AsEventListener(event: KernelEvents::EXCEPTION, priority: 255)]
    public function onKernelException(ExceptionEvent $event): void
    {
        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $exception = $event->getThrowable();
        $code = $exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : Response::HTTP_INTERNAL_SERVER_ERROR;
        $message = $code >= 500 ? 'Error interno del servidor.' : $exception->getMessage();

        if ($code >= 500) {
            $this->logger->error('API exception: ' . $exception->getMessage(), [
                'class' => $exception::class,
                'trace' => substr((string) $exception->getTraceAsString(), 0, 4000),
            ]);
        }

        $response = new JsonResponse(['error' => $message], $code);
        $this->applyCors($request, $response);
        $event->setResponse($response);
    }

    private function applyCors(Request $request, Response $response): void
    {
        $origin = (string) $request->headers->get('Origin', '');
        $allowed = array_values(array_filter(array_map('trim', explode(',', $this->allowedOrigins))));

        if ($origin !== '' && (in_array('*', $allowed, true) || in_array($origin, $allowed, true))) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key, X-Webhook-Token');
    }
}