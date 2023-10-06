import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.set("view engine", "html");

// 정적 파일 서비스 설정
app.use("/public", express.static(__dirname + "/public"));
// 루트 경로 설정
app.get("/", (_, res) => res.sendFile(__dirname + "/public/index.html"));
// 모든 경로를 루트로 리다이렉트
app.get("/*", (req, res) => res.redirect("/"));
// 서버가 시작되었을 때의 처리
const handleListen = () => console.log(`http://localhost:3000에서 대기 중`);
// HTTP 서버 생성
const httpServer = http.createServer(app);
// 웹 소켓 서버 생성
const io = new Server(httpServer);

// 웹 소켓 서버의 adapter에서 rooms와 sids 추출
const { sids, rooms } = io.sockets.adapter;

// 모든 공개 방 목록을 반환하는 함수
function publicRoomList() {
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (!sids.get(key)) {
      const count = rooms.get(key).size;
      publicRooms.push(`${key}🏡  총: ${count} 명`);
    }
  });
  return publicRooms;
}

// 방의 현재 인원 수를 반환하는 함수
function countRoom(roomName) {
  return rooms.get(roomName)?.size;
}

// 클라이언트와의 연결이 설정될 때의 처리
io.on("connection", (socket) => {
  // 모든 이벤트에 대한 빈 핸들러 등록
  socket.onAny((e) => {});

  // 클라이언트가 방에 입장할 때의 처리
  socket.on("enter_room", (roomName, func) => {
    socket.join(roomName);
    func();
    socket.to(roomName).emit("welcome", socket.nickName, countRoom(roomName));
    io.sockets.emit("room_change", publicRoomList(), countRoom(roomName));
  });

  // 클라이언트가 연결을 종료할 때의 처리
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickName, countRoom(room) - 1)
    );
  });

  // 클라이언트가 완전히 연결을 끊을 때의 처리
  socket.on("disconnect", () =>
    io.sockets.emit("room_change", publicRoomList())
  );

  // 새로운 메시지를 받았을 때의 처리
  socket.on("new_msg", (msg, roomName, done) => {
    socket.to(roomName).emit("new_msg", `${socket.nickName}님: ${msg} `);
    done();
  });

  // 닉네임 설정
  socket.on("new_nick", (nickName) => {
    socket["nickName"] = nickName;
  });
});

// 서버 시작
httpServer.listen(3000, handleListen);
