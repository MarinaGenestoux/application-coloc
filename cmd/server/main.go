package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/auth"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/cache"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/config"
	handler "github.com/MarinaGenestoux/application-coloc/internal/infra/grpc"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/repository/postgres"
	"github.com/MarinaGenestoux/application-coloc/internal/application/service"
	pb "github.com/MarinaGenestoux/application-coloc/proto/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
)

type server struct {
	cfg                 *config.Config
	pool                *pgxpool.Pool
	jwtManager          *auth.JWTManager
	authHandler         *handler.AuthHandler
	userHandler         *handler.UserHandler
	colocationHandler   *handler.ColocationHandler
	categoryHandler     *handler.CategoryHandler
	expenseHandler      *handler.ExpenseHandler
	balanceHandler      *handler.BalanceHandler
	paymentHandler      *handler.PaymentHandler
	decisionHandler     *handler.DecisionHandler
	fundHandler         *handler.FundHandler
	notificationHandler *handler.NotificationHandler
	eventHandler        *handler.EventHandler
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aucun fichier .env trouve, utilisation des valeurs par defaut")
	}

	cfg := config.Load()

	// Connect to database
	pool, err := postgres.Connect(&cfg.Database)
	if err != nil {
		log.Fatalf("Erreur de connexion a la base de donnees: %v", err)
	}
	defer pool.Close()

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenExpiry,
		cfg.JWT.RefreshTokenExpiry,
	)

	// Initialize repositories
	authRepo := postgres.NewAuthRepository(pool)
	colocationRepo := postgres.NewColocationRepository(pool)
	categoryRepo := postgres.NewCategoryRepository(pool)
	expenseRepo := postgres.NewExpenseRepository(pool)
	balanceRepo := postgres.NewBalanceRepository(pool)
	paymentRepo := postgres.NewPaymentRepository(pool)
	decisionRepo := postgres.NewDecisionRepository(pool)
	fundRepo := postgres.NewFundRepository(pool)
	notificationRepo := postgres.NewNotificationRepository(pool)
	eventRepo := postgres.NewEventRepository(pool)

	// Initialize cache (TTL de 5 minutes pour les soldes)
	balanceCache := cache.NewBalanceCache(5 * time.Minute)

	// Initialize services
	hasher := auth.NewBcryptPasswordHasher()
	authService := service.NewAuthService(authRepo, jwtManager, hasher)
	userService := service.NewUserService(authRepo)
	colocationService := service.NewColocationService(colocationRepo)
	categoryService := service.NewCategoryService(categoryRepo, colocationRepo)
	expenseService := service.NewExpenseService(expenseRepo, colocationRepo, categoryRepo, balanceCache)
	balanceService := service.NewBalanceService(balanceRepo, colocationRepo, balanceCache)
	paymentService := service.NewPaymentService(paymentRepo, colocationRepo)
	decisionService := service.NewDecisionService(decisionRepo, colocationRepo)
	fundService := service.NewFundService(fundRepo, colocationRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	eventService := service.NewEventService(eventRepo, colocationRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	colocationHandler := handler.NewColocationHandler(colocationService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	expenseHandler := handler.NewExpenseHandler(expenseService)
	balanceHandler := handler.NewBalanceHandler(balanceService)
	paymentHandler := handler.NewPaymentHandler(paymentService)
	decisionHandler := handler.NewDecisionHandler(decisionService)
	fundHandler := handler.NewFundHandler(fundService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	eventHandler := handler.NewEventHandler(eventService)

	srv := &server{
		cfg:                 cfg,
		pool:                pool,
		jwtManager:          jwtManager,
		authHandler:         authHandler,
		userHandler:         userHandler,
		colocationHandler:   colocationHandler,
		categoryHandler:     categoryHandler,
		expenseHandler:      expenseHandler,
		balanceHandler:      balanceHandler,
		paymentHandler:      paymentHandler,
		decisionHandler:     decisionHandler,
		fundHandler:         fundHandler,
		notificationHandler: notificationHandler,
		eventHandler:        eventHandler,
	}

	// Start gRPC server in goroutine
	go func() {
		if err := srv.runGRPCServer(); err != nil {
			log.Fatalf("Erreur serveur gRPC: %v", err)
		}
	}()

	// Start HTTP gateway
	if err := srv.runHTTPGateway(); err != nil {
		log.Fatalf("Erreur gateway HTTP: %v", err)
	}
}

func (s *server) runGRPCServer() error {
	lis, err := net.Listen("tcp", ":"+s.cfg.Server.GRPCPort)
	if err != nil {
		return err
	}

	// Create auth interceptor
	authInterceptor := auth.NewAuthInterceptor(s.jwtManager)

	// Configure TLS if enabled
	var opts []grpc.ServerOption
	if s.cfg.TLS.Enabled {
		// Load server certificate and private key
		cert, err := tls.LoadX509KeyPair(s.cfg.TLS.CertFile, s.cfg.TLS.KeyFile)
		if err != nil {
			log.Fatalf("Erreur chargement certificat TLS: %v", err)
		}

		// Configure TLS with modern security settings
		tlsConfig := &tls.Config{
			Certificates: []tls.Certificate{cert},
			MinVersion:   tls.VersionTLS12, // Minimum TLS 1.2 for security
			CipherSuites: []uint16{
				tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
				tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			},
		}

		creds := credentials.NewTLS(tlsConfig)
		opts = append(opts, grpc.Creds(creds))
		log.Printf("🔒 TLS active sur le serveur gRPC (certificat: %s)", s.cfg.TLS.CertFile)
	} else {
		log.Printf("⚠️  AVERTISSEMENT: TLS desactive - connexions NON chiffrees")
	}

	opts = append(opts,
		grpc.UnaryInterceptor(authInterceptor.Unary()),
		grpc.StreamInterceptor(authInterceptor.Stream()),
	)

	grpcServer := grpc.NewServer(opts...)

	// Register gRPC services
	pb.RegisterAuthServiceServer(grpcServer, s.authHandler)
	pb.RegisterUserServiceServer(grpcServer, s.userHandler)
	pb.RegisterColocationServiceServer(grpcServer, s.colocationHandler)
	pb.RegisterCategoryServiceServer(grpcServer, s.categoryHandler)
	pb.RegisterExpenseServiceServer(grpcServer, s.expenseHandler)
	pb.RegisterBalanceServiceServer(grpcServer, s.balanceHandler)
	pb.RegisterPaymentServiceServer(grpcServer, s.paymentHandler)
	pb.RegisterDecisionServiceServer(grpcServer, s.decisionHandler)
	pb.RegisterFundServiceServer(grpcServer, s.fundHandler)
	pb.RegisterNotificationServiceServer(grpcServer, s.notificationHandler)
	pb.RegisterEventServiceServer(grpcServer, s.eventHandler)

	// Enable reflection for grpcurl/grpcui
	reflection.Register(grpcServer)

	protocol := "gRPC"
	if s.cfg.TLS.Enabled {
		protocol = "gRPCs (TLS)"
	}
	log.Printf("Serveur %s demarre sur le port %s", protocol, s.cfg.Server.GRPCPort)
	return grpcServer.Serve(lis)
}

func (s *server) runHTTPGateway() error {
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	mux := runtime.NewServeMux(
		runtime.WithIncomingHeaderMatcher(customHeaderMatcher),
	)

	// Configure gRPC client connection (gateway -> gRPC server)
	var opts []grpc.DialOption
	if s.cfg.TLS.Enabled {
		// Use TLS for internal gRPC connection
		creds := credentials.NewTLS(&tls.Config{
			InsecureSkipVerify: true, // Skip verification for localhost (self-signed cert)
		})
		opts = append(opts, grpc.WithTransportCredentials(creds))
	} else {
		opts = append(opts, grpc.WithTransportCredentials(insecure.NewCredentials()))
	}

	grpcEndpoint := "localhost:" + s.cfg.Server.GRPCPort

	// Register HTTP handlers
	if err := pb.RegisterAuthServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterUserServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterColocationServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterCategoryServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterExpenseServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterBalanceServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterPaymentServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterDecisionServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterFundServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterNotificationServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}
	if err := pb.RegisterEventServiceHandlerFromEndpoint(ctx, mux, grpcEndpoint, opts); err != nil {
		return err
	}

	// Wrap with CORS
	handler := corsMiddleware(mux)

	// Add health check
	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
	httpMux.HandleFunc("/swagger/doc.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		http.ServeFile(w, r, "proto/pb/coloc.swagger.json")
	})
	httpMux.HandleFunc("/swagger/", swaggerUIHandler("/swagger/doc.json"))
	httpMux.Handle("/", handler)

	// Start HTTP or HTTPS server based on TLS configuration
	protocol := "HTTP"
	apiURL := fmt.Sprintf("http://localhost:%s/api/v1/", s.cfg.Server.HTTPPort)
	swaggerURL := fmt.Sprintf("http://localhost:%s/swagger/", s.cfg.Server.HTTPPort)

	if s.cfg.TLS.Enabled {
		protocol = "HTTPS (TLS)"
		apiURL = fmt.Sprintf("https://localhost:%s/api/v1/", s.cfg.Server.HTTPPort)
		swaggerURL = fmt.Sprintf("https://localhost:%s/swagger/", s.cfg.Server.HTTPPort)

		// Configure HTTPS server with modern TLS settings
		server := &http.Server{
			Addr:    ":" + s.cfg.Server.HTTPPort,
			Handler: httpMux,
			TLSConfig: &tls.Config{
				MinVersion: tls.VersionTLS12, // Minimum TLS 1.2
				CipherSuites: []uint16{
					tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
					tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
				},
			},
		}

		log.Printf("🔒 Gateway REST %s demarree sur le port %s", protocol, s.cfg.Server.HTTPPort)
		log.Printf("API v1 disponible sur %s", apiURL)
		log.Printf("Swagger UI disponible sur %s", swaggerURL)
		log.Printf("🔒 Certificat: %s", s.cfg.TLS.CertFile)

		return server.ListenAndServeTLS(s.cfg.TLS.CertFile, s.cfg.TLS.KeyFile)
	}

	log.Printf("⚠️  Gateway REST %s demarree sur le port %s (NON SECURISE)", protocol, s.cfg.Server.HTTPPort)
	log.Printf("API v1 disponible sur %s", apiURL)
	log.Printf("Swagger UI disponible sur %s", swaggerURL)

	return http.ListenAndServe(":"+s.cfg.Server.HTTPPort, httpMux)
}

// customHeaderMatcher allows Authorization header to pass through
func customHeaderMatcher(key string) (string, bool) {
	switch key {
	case "Authorization":
		return key, true
	default:
		return runtime.DefaultHeaderMatcher(key)
	}
}

// corsMiddleware adds CORS headers for frontend access
func corsMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func swaggerUIHandler(specURL string) http.HandlerFunc {
	const pageTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Coloc API - Swagger UI</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: "%s",
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "StandaloneLayout"
        });
      };
    </script>
  </body>
</html>`
	page := fmt.Sprintf(pageTemplate, specURL)

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		io.WriteString(w, page)
	}
}
