import { useRef, useEffect, useState } from "react";
import "./App.css";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import Webcam from "react-webcam";
import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/types";
import { draw } from "./mask";
import { Coords3D } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
import React from "react";

function App() {
  const webcam = useRef<Webcam>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const capture = React.useCallback(() => {
    if (webcam.current) {
      const imageSrc = webcam.current.getScreenshot();
      console.log(imageSrc);
    }
  }, [webcam]);

  //  const [webcamStream, setWebcamStream] = useState(null);
  const [faceLandmarks, setFaceLandmarks] = useState(null);
  const [faceDirection, setFaceDirection] = useState("center");

  //

  const runFaceDetect = async () => {
    const model = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );
    detect(model);
  };

  const detect = async (model: MediaPipeFaceMesh) => {
    if (webcam.current && canvas.current) {
      const webcamCurrent = webcam.current as any;
      if (webcamCurrent.video.readyState === 4) {
        const video = webcamCurrent.video;
        const videoWidth = webcamCurrent.video.videoWidth;
        const videoHeight = webcamCurrent.video.videoHeight;
        canvas.current.width = videoWidth;
        canvas.current.height = videoHeight;
        const predictions = await model.estimateFaces({
          input: video,
        });
        //@ts-ignore
        if (predictions.length === 1) {
          //@ts-ignore
          const angle = meshToEulerAngle(predictions[0].scaledMesh);
          console.log(angle.yaw);

          if (angle.yaw > 0.5) {
            console.log("Nhìn sang trái");
            capture();
          } else if (angle.yaw < -0.5) {
            console.log("Nhìn sang phải");
          } else {
            console.log("Nhìn thẳng");
          }
        } else {
          console.log("không có mặt trong cam");
        }

        // requestAnimationFrame(() => {
        //   draw(predictions, ctx, videoWidth, videoHeight);
        // });
        detect(model);
      }
    }
  };
  const meshToEulerAngle = (mesh: Coords3D) => {
    // simple Euler angle calculation based existing 3D mesh
    //@ts-ignore
    const radians = (a1, a2, b1, b2) => Math.atan2(b2 - a2, b1 - a1);
    return {
      // values are in radians in range of -pi/2 to pi/2 which is -90 to +90 degrees, value of 0 means center
      pitch: radians(mesh[10][1], mesh[10][2], mesh[152][1], mesh[152][2]), // looking at y,z of top and bottom points of the face // pitch is face move up/down
      yaw: radians(mesh[33][0], mesh[33][2], mesh[263][0], mesh[263][2]), // looking at x,z of outside corners of leftEye and rightEye // yaw is face turn left/right
      roll: radians(mesh[33][0], mesh[33][1], mesh[263][0], mesh[263][1]), // looking at x,y of outside corners of leftEye and rightEye // roll is face lean left/right
    };
  };

  useEffect(() => {
    runFaceDetect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcam.current?.video?.readyState]);

  return (
    <div className="App">
      <header className="header">
        <div className="title">face mask App</div>
      </header>
      <Webcam
        audio={false}
        ref={webcam}
        screenshotFormat="image/jpeg"
        style={{
          position: "absolute",
          margin: "auto",
          textAlign: "center",
          top: 100,
          left: 0,
          right: 0,
          zIndex: 9,
        }}
      />
      <canvas
        ref={canvas}
        style={{
          position: "absolute",
          margin: "auto",
          textAlign: "center",
          top: 100,
          left: 0,
          right: 0,
          zIndex: 9,
        }}
      />
    </div>
  );
}

export default App;
