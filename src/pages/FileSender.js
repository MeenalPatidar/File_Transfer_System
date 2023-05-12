import React, { useState } from "react";

import DragDropFile from "../components/DragDropFile";
import "../styles/FileSender.scss";
import "../styles/FileStatus.scss";

import io from "socket.io-client";
const socket = io();

function generateId() {
  return `${Math.trunc(Math.random() * 999)}-${Math.trunc(
    Math.random() * 999
  )}-${Math.trunc(Math.random() * 999)}`;
}

function createFileElement(filename) {
  let fileElem = document.createElement("div");
  fileElem.classList.add("StatusContainer");

  let fileName = document.createElement("p");
  fileName.classList.add("FileName");

  let percent = document.createElement("p");
  percent.classList.add("Percentage");

  let fileIcon = document.createElement("img");
  fileIcon.src = "Icon.png";
  fileIcon.classList.add("FileIcon");

  fileName.innerHTML = filename;
  percent.innerHTML = "0%";
  percent.id = filename;

  fileElem.appendChild(percent);
  fileElem.appendChild(fileIcon);
  fileElem.appendChild(fileName);

  return fileElem;
}

const CreateRoom = () => {
  const [userName, setUserName] = useState("");
  const [joinId, setJoinId] = useState(null);
  let join = null;
  let transmittedData = {};
  function click() {
    document.getElementsByClassName("bgImage")[0].classList.add("animate");

    join = generateId();
    setJoinId(join);
    socket.emit("sender-join", { uid: join });
    socket.on("init", function (uid) {
    });
  }
  async function handleFileDragAndDrop(event) {
    let file = event.dataTransfer.files[0];
    transmittedData[file.name] = 0;
    const fileReader = new FileReader();
    fileReader.onload = async function (e) {
      let buffer = new Uint8Array(fileReader.result);
      let fileElem = createFileElement(file.name);
      document.getElementById("files").appendChild(fileElem);
      await shareFile(
        {
          filename: file.name,
          total_buffer_size: buffer.length,
          buffer_size: 524288,
          userName: userName,
        },
        buffer
      );
    };
    fileReader.readAsArrayBuffer(file);
  }
  async function handleFileUpload(event) {
    let file = event.target.files[0];
    transmittedData[file.name] = 0;
    const fileReader = new FileReader();
    fileReader.onload = async function (e) {
      let buffer = new Uint8Array(fileReader.result);
      let fileElem = createFileElement(file.name);
      document.getElementById("files").appendChild(fileElem);
      await shareFile(
        {
          filename: file.name,
          total_buffer_size: buffer.length,
          buffer_size: 524288,
          userName: userName,
        },
        buffer
      );
    };
    fileReader.readAsArrayBuffer(file);
  }

  async function shareFile(metadata, buffer) {
    // console.log(metadata);
    socket.emit("file-meta", {
      uid: joinId,
      metadata: metadata,
    });
    socket.on("fs-share", function () {
      let chunk = buffer.slice(0, metadata.buffer_size);
      transmittedData[metadata.filename] += chunk.length;
      buffer = buffer.slice(metadata.buffer_size, buffer.length);
      if (chunk.length !== 0) {
        socket.emit("file-raw", {
          uid: joinId,
          buffer: chunk,
          metadata: metadata
        });
        document.getElementById(metadata.filename).innerHTML =
          Math.trunc((transmittedData[metadata.filename] * 100) / metadata.total_buffer_size) +
          "%";
      } else {
        delete transmittedData[metadata.filename];
      }
    });
  }
  const takeUserName = (e) => {
    setUserName(e.target.value);
  };

  return (
    <div className="SenderBox">
      <div className="SenderContainer">
        <div className="SenderLeft">
          <div className="ID">
            <img
              className="bgImage"
              src={require("../images/fileSender.png")}
              alt=""
            />
            {joinId ? (
              <>
                <>
                  <h2>{userName}'s Room ID :</h2>
                  <h1>{joinId}</h1>
                </>
                <DragDropFile onChange={handleFileUpload} onDragAndDrop={handleFileDragAndDrop}></DragDropFile>
              </>
            ) : (
              <>
                <input
                  value={userName}
                  onChange={takeUserName}
                  type="text"
                  placeholder="Eren Yeager"
                  required
                />
                <button
                  className="createRoom"
                  onClick={click}
                  disabled={!userName}
                >
                  Create Room
                </button>
              </>
            )}
          </div>
        </div>

        <div className="SenderRight">
          <h1>Shared Files</h1>
          <div className="RightContent" id="files"></div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
export { createFileElement };
