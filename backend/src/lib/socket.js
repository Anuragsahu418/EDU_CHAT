import { Server } from "socket.io";
import Message from "../models/message.model.js";
let io;
const userSocketMap = {};
 
export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

const CLIENT_URLS = process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",").map(url => url.trim()): ["http://localhost:5173"];
  
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: CLIENT_URLS, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {

    const userId = socket.handshake.auth.userId;

    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("messageRead", async (messageIds) => {
      await Message.updateMany(
        { _id: { $in: messageIds }, status: { $ne: "read" } },
        { status: "read" }
      );
      const messages = await Message.find({ _id: { $in: messageIds } });
      messages.forEach((msg) => {
        const senderSocketId = getReceiverSocketId(msg.senderId.toString());
        if (senderSocketId) io.to(senderSocketId).emit("messageStatusUpdated", { messageId: msg._id, status: "read" });
      });
    });

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("onlineUsers", Object.keys(userSocketMap)); 
    });
  });

  return io;
};

export { io };