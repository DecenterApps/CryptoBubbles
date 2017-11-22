package main

import (
	"log"
	"net/http"

	"github.com/googollee/go-socket.io"
	"github.com/rs/cors"
	// "github.com/regcostajr/go-web3/providers"
	// web3 "github.com/regcostajr/go-web3"
)

func main() {
	server, err := socketio.NewServer(nil)

	// web3Client := web3.NewWeb3(providers.NewHTTPProvider("http://kovan.decenter.com", 10))

	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()

	server.On("connection", func(sock socketio.Socket) {
		log.Println("Socket connection")

		sock.On("disconnection", func() {
			log.Println("Socket disconnected")
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
