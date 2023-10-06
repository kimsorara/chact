// Socket.IO 초기화
const socketIo = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const form = welcome.querySelector("form");

let roomName;
// 메시지 제출 처리 함수
function handleMsgSubmit(e) {
  e.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  // 새 메시지를 서버로 전송
  socketIo.emit("new_msg", input.value, roomName, () =>
    addMessage(`you: ${value}`)
  );
  input.value = "";
}

// 방을 보여주는 함수
function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `방 ${roomName} (1)`;

  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMsgSubmit);
}

// 방 이름과 인원 수를 업데이트하는 함수
function roomNameChange(count) {
  const h3 = room.querySelector("h3");
  h3.innerText = `방 ${roomName} (${count})`;
}

// 폼 제출 처리 함수
function handleSubmit(e) {
  e.preventDefault();
  const input = form.querySelector("input");
  const nickInput = form.querySelector("#nick");
  // 새 닉네임과 방 입장 이벤트를 서버로 전송
  socketIo.emit("new_nick", nickInput.value);
  socketIo.emit("enter_room", input.value, showRoom);
  // roomName 설정 및 입력 필드 초기화
  roomName = input.value;
  input.value = "";
  nickInput.value = "";
}

// 채팅 방에 메시지를 추가하는 함수
function addMessage(msg) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  ul.appendChild(li);
}

// 폼 제출 이벤트 리스너
form.addEventListener("submit", handleSubmit);

// Socket.IO 이벤트 리스너
socketIo.on("welcome", (nickName, count) => {
  roomNameChange(count);
  console.log(count, "입장");
  addMessage(`${nickName}님이 입장하셨습니다`);
});

socketIo.on("bye", (left, count) => {
  roomNameChange(count);
  addMessage(`${left}님이 퇴장하셨습니다 🥲 (${count}명 남음)`);
});

socketIo.on("new_msg", addMessage);

socketIo.on("room_change", (rooms, count) => {
  const roomList = welcome.querySelector("#room_list");
  roomNameChange(count);
  roomList.innerHTML = ""; // 방 목록 초기화
  if (rooms.length === 0) {
    return;
  }

  rooms.forEach((el) => {
    const li = document.createElement("li");
    li.innerText = el;
    roomList.appendChild(li);
  });
});
