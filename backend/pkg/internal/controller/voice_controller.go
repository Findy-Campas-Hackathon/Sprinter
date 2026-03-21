package controller

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type voicePeer struct {
	conn   *websocket.Conn
	userID int
	name   string
	mu     sync.Mutex
}

func (p *voicePeer) send(msg []byte) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.conn.WriteMessage(websocket.TextMessage, msg)
}

type voiceRoom struct {
	mu    sync.RWMutex
	peers map[int]*voicePeer // userID -> peer
}

type VoiceController struct {
	mu    sync.RWMutex
	rooms map[int]*voiceRoom // eventID -> room
}

func NewVoiceController() *VoiceController {
	return &VoiceController{
		rooms: make(map[int]*voiceRoom),
	}
}

func (vc *VoiceController) getOrCreateRoom(eventID int) *voiceRoom {
	vc.mu.Lock()
	defer vc.mu.Unlock()
	room, ok := vc.rooms[eventID]
	if !ok {
		room = &voiceRoom{peers: make(map[int]*voicePeer)}
		vc.rooms[eventID] = room
	}
	return room
}

type signalingMessage struct {
	Type     string          `json:"type"`
	From     int             `json:"from,omitempty"`
	FromName string          `json:"from_name,omitempty"`
	To       int             `json:"to,omitempty"`
	Payload  json.RawMessage `json:"payload,omitempty"`
	Peers    []peerInfo      `json:"peers,omitempty"`
}

type peerInfo struct {
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
}

func parseTokenFromQuery(tokenStr string) (int, string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return 0, "", fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, "", fmt.Errorf("invalid claims")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, "", fmt.Errorf("missing user_id")
	}

	name, _ := claims["name"].(string)
	return int(userIDFloat), name, nil
}

func (vc *VoiceController) HandleVoiceWS(ctx echo.Context) error {
	eventID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	tokenStr := ctx.QueryParam("token")
	if tokenStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "token required")
	}

	userID, userName, err := parseTokenFromQuery(tokenStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	ws, err := upgrader.Upgrade(ctx.Response(), ctx.Request(), nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return err
	}
	defer ws.Close()

	room := vc.getOrCreateRoom(eventID)
	peer := &voicePeer{conn: ws, userID: userID, name: userName}

	room.mu.Lock()
	existingPeers := make([]peerInfo, 0, len(room.peers))
	for _, p := range room.peers {
		existingPeers = append(existingPeers, peerInfo{UserID: p.userID, Name: p.name})
	}
	room.peers[userID] = peer
	room.mu.Unlock()

	peersMsg, _ := json.Marshal(signalingMessage{
		Type:  "peers",
		Peers: existingPeers,
	})
	_ = peer.send(peersMsg)

	joinMsg, _ := json.Marshal(signalingMessage{
		Type:     "peer-joined",
		From:     userID,
		FromName: userName,
	})
	room.mu.RLock()
	for id, p := range room.peers {
		if id != userID {
			_ = p.send(joinMsg)
		}
	}
	room.mu.RUnlock()

	defer func() {
		room.mu.Lock()
		delete(room.peers, userID)
		remaining := len(room.peers)
		room.mu.Unlock()

		leaveMsg, _ := json.Marshal(signalingMessage{
			Type:     "peer-left",
			From:     userID,
			FromName: userName,
		})
		room.mu.RLock()
		for _, p := range room.peers {
			_ = p.send(leaveMsg)
		}
		room.mu.RUnlock()

		if remaining == 0 {
			vc.mu.Lock()
			delete(vc.rooms, eventID)
			vc.mu.Unlock()
		}
	}()

	for {
		_, msgBytes, err := ws.ReadMessage()
		if err != nil {
			break
		}

		var msg signalingMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			continue
		}

		msg.From = userID
		msg.FromName = userName

		switch msg.Type {
		case "offer", "answer", "ice-candidate":
			if msg.To == 0 {
				continue
			}
			forward, _ := json.Marshal(msg)
			room.mu.RLock()
			if target, ok := room.peers[msg.To]; ok {
				_ = target.send(forward)
			}
			room.mu.RUnlock()
		}
	}

	return nil
}
