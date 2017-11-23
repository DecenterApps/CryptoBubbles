package main

import (
	"log"
	"net/http"
	"encoding/json"

	"github.com/googollee/go-socket.io"
	"github.com/rs/cors"
	// "github.com/regcostajr/go-web3/providers"
	// web3 "github.com/regcostajr/go-web3"
)

type Position struct {
	x int `json:"x"`
	y int `json:"y"`
}

func main() {
	server, err := socketio.NewServer(nil)

	// web3Client := web3.NewWeb3(providers.NewHTTPProvider("http://kovan.decenter.com", 10))

	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()

	server.On("connection", func(sock socketio.Socket) {
		log.Println("User connection")
		
		sock.On("join", func() {

		})

		sock.On("disconnection", func() {
			log.Println("Socket disconnected")
		})

		sock.On("move", func(resp[] byte) {
			var pos = new(Position)
			err := json.Unmarshal(resp, &pos)

			if(err != nil) {
				log.Println(err)
			}
		})
	})

	server.On("error", func(sock socketio.Socket, err error) {
		log.Println(err)
	})

	mux.Handle("/socket.io/", server)

	log.Println("Listening at port 60000")

	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowCredentials: true,
	}).Handler(mux)

	log.Fatal(http.ListenAndServe(":60000", handler))
}
