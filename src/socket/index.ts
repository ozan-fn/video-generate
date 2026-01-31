import { Server } from "socket.io";
import loginHandler from "./loginHandler";

export default function registerSocketHandlers(io: Server) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        loginHandler(socket);

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
}
