const video = document.getElementById('input');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const userIdInput = document.getElementById('userId');
const kanaSelect = document.getElementById('kana');
const previewDiv = document.getElementById('preview');
const captureListDiv = document.getElementById('captureList');

let capturing = false;
let capturedData = [];
let captureCount = 0;

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

function onResults(results) {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
    drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });

    if (capturing) {
      captureData(landmarks);
    }
  }
  ctx.restore();
}

function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return [];

  const wrist = landmarks[0];
  const centeredLandmarks = landmarks.map(lm => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: lm.z - wrist.z
  }));

  const maxDist = Math.max(...centeredLandmarks.map(lm =>
    Math.sqrt(lm.x * lm.x + lm.y * lm.y + lm.z * lm.z)
  ));

  return centeredLandmarks.map(lm => ({
    x: lm.x / maxDist,
    y: lm.y / maxDist,
    z: lm.z / maxDist
  }));
}

function captureData(landmarks) {
  const userId = userIdInput.value;
  const kana = kanaSelect.value;
  const now = new Date();
  captureCount++;

  const baseFileName = `${captureCount.toString().padStart(3, '0')}_${userId}_${kana}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

  const normalizedLandmarks = normalizeLandmarks(landmarks);

  let rawCsvContent = "index,x,y,z\n";
  let normalizedCsvContent = "index,normalized_x,normalized_y,normalized_z\n";

  landmarks.forEach((lm, i) => {
    rawCsvContent += `${i},${lm.x},${lm.y},${lm.z}\n`;
    const nlm = normalizedLandmarks[i];
    normalizedCsvContent += `${i},${nlm.x},${nlm.y},${nlm.z}\n`;
  });

  capturedData.push(
    { fileName: `${baseFileName}_raw.csv`, csvContent: rawCsvContent },
    { fileName: `${baseFileName}_normalized.csv`, csvContent: normalizedCsvContent }
  );

  previewDiv.textContent = `キャプチャ完了: ${baseFileName}`;
  updateCaptureList();
  capturing = false;
}

function updateCaptureList() {
  captureListDiv.innerHTML = '<h3>キャプチャしたファイル:</h3>';
  for (let i = 0; i < capturedData.length; i += 2) {
    const baseFileName = capturedData[i].fileName.replace('_raw.csv', '');
    captureListDiv.innerHTML += `<p>${i / 2 + 1}. ${baseFileName} (生データ & 正規化データ)</p>`;
  }
}

document.getElementById('start').addEventListener('click', startCapture);
document.getElementById('stop').addEventListener('click', stopCapture);
document.getElementById('capture').addEventListener('click', initiateCapture);
document.getElementById('downloadZip').addEventListener('click', downloadZip);

function startCapture() {
  if (userIdInput.value) {
    camera.start().catch(error => {
      console.error('カメラの起動に失敗しました:', error);
      alert('カメラの起動に失敗しました。ブラウザの設定を確認してください。');
    });
  } else {
    alert('ユーザーIDを入力してください。');
  }
}

function stopCapture() {
  camera.stop();
}

function initiateCapture() {
  if (userIdInput.value) {
    capturing = true;
  } else {
    alert('ユーザーIDを入力してください。');
  }
}

async function downloadZip() {
  if (capturedData.length === 0) {
    alert('ダウンロードするデータがありません。');
    return;
  }

  try {
    const zip = new JSZip();
    const rawFolder = zip.folder("raw_data");
    const normalizedFolder = zip.folder("normalized_data");

    capturedData.forEach(data => {
      if (data.fileName.includes('_raw.csv')) {
        rawFolder.file(data.fileName, data.csvContent);
      } else {
        normalizedFolder.file(data.fileName, data.csvContent);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "captured_data.zip";
    link.click();
  } catch (error) {
    console.error('ZIPファイルの生成に失敗しました:', error);
    alert('データのダウンロードに失敗しました。');
  }
}