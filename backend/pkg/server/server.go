package server

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"

	"hack-sprinter/backend/pkg/internal/controller"
	"hack-sprinter/backend/pkg/internal/infrastructure"
	"hack-sprinter/backend/pkg/internal/usecase"
	httpmiddleware "hack-sprinter/backend/pkg/http/middleware"
)

func NewServer(pool *pgxpool.Pool) *echo.Echo {
	e := echo.New()

	e.Use(echomiddleware.Logger())
	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	// Repositories
	userRepo := infrastructure.NewUserRepository(pool)
	eventRepo := infrastructure.NewEventRepository(pool)
	participantRepo := infrastructure.NewParticipantRepository(pool)

	// Usecases
	authUC := usecase.NewAuthUsecase(userRepo)
	eventUC := usecase.NewEventUsecase(eventRepo)
	participantUC := usecase.NewParticipantUsecase(participantRepo, eventRepo)
	adminUC := usecase.NewAdminUsecase(userRepo, eventRepo)

	// Controllers
	authCtrl := controller.NewAuthController(authUC)
	eventCtrl := controller.NewEventController(eventUC)
	participantCtrl := controller.NewParticipantController(participantUC)
	adminCtrl := controller.NewAdminController(adminUC)

	v1 := e.Group("/v1")

	// Auth routes
	auth := v1.Group("/auth")
	auth.POST("/register", authCtrl.Register)
	auth.POST("/login", authCtrl.Login)
	auth.GET("/me", authCtrl.GetMe, httpmiddleware.JWTAuth())

	// Event routes
	events := v1.Group("/events")
	events.GET("", eventCtrl.ListEvents)
	events.GET("/:id", eventCtrl.GetEvent)
	events.POST("", eventCtrl.CreateEvent, httpmiddleware.JWTAuth())
	events.PUT("/:id", eventCtrl.UpdateEvent, httpmiddleware.JWTAuth())
	events.DELETE("/:id", eventCtrl.DeleteEvent, httpmiddleware.JWTAuth())
	events.GET("/:id/participants", participantCtrl.ListParticipants)
	events.POST("/:id/participants", participantCtrl.JoinEvent, httpmiddleware.JWTAuth())
	events.DELETE("/:id/participants", participantCtrl.CancelParticipation, httpmiddleware.JWTAuth())

	// User routes
	users := v1.Group("/users", httpmiddleware.JWTAuth())
	users.GET("/me/events", eventCtrl.ListMyEvents)
	users.GET("/me/participations", participantCtrl.ListMyParticipations)

	// Admin routes
	admin := v1.Group("/admin", httpmiddleware.JWTAuth(), httpmiddleware.RequireAdmin())
	admin.GET("/users", adminCtrl.ListUsers)
	admin.DELETE("/users/:id", adminCtrl.DeleteUser)
	admin.GET("/events", adminCtrl.ListAllEvents)

	return e
}
