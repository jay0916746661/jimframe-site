# Face models

- `face-api.min.js`, `weights/tiny_face_detector*`, `weights/face_landmark_68*`: face-api.js (MIT) — finds faces and 68 landmarks.
- `sface_int8.onnx`: SFace face recognition, int8, from OpenCV Zoo (https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface), Apache License 2.0. Used for matching.
- `/ort/*`: onnxruntime-web 1.19.2 (MIT), runs the SFace model in the browser (WebAssembly).
