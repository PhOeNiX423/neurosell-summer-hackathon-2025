import * as THREE from "three";
import { UpscalerPlugin } from "./upscaler.js";

const processed = new WeakMap();

function upscaleImage(img) {
  if (processed.has(img)) return;

  const container = img.parentElement;

  // ❗ Удаляем предыдущий canvas
  const existingCanvas = container.querySelector("canvas[data-upscaled]");
  if (existingCanvas) existingCanvas.remove();

  // Вычисляем соотношение сторон и CSS-размеры
  const ratio = img.naturalWidth / img.naturalHeight;
  const cssHeight = img.offsetHeight;
  const cssWidth = cssHeight * ratio;

  // Настраиваем three.js
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  const scale = 4;

  // 4-кратный рендер, но отображение по CSS-пропорциям
  renderer.setSize(img.naturalWidth * scale, img.naturalHeight * scale);
  renderer.domElement.setAttribute("data-upscaled", "true"); // ✅ отметка
  renderer.domElement.style.width = `${cssWidth}px`;
  renderer.domElement.style.height = `${cssHeight}px`;
  renderer.domElement.style.maxWidth = "100%";
  renderer.domElement.style.maxHeight = "100%";
  renderer.domElement.style.width = "auto";
  renderer.domElement.style.height = "auto";
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "50%";
  renderer.domElement.style.left = "50%";
  renderer.domElement.style.transform = "translate(-50%, -50%)";
  renderer.domElement.style.borderRadius = getComputedStyle(img).borderRadius;
  renderer.domElement.style.zIndex = 1;
  renderer.domElement.style.pointerEvents = "none";

  // Оборачиваем контейнер в позиционируемый div
  container.style.position = "relative";

  const texture = new THREE.TextureLoader().load(img.src, () => {
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const upscaler = new UpscalerPlugin(renderer, scene, camera, {
      scaleFactor: 2,
      useEdgeDetection: true,
    });

    upscaler.render();

    container.appendChild(renderer.domElement);
    processed.set(img, {
      renderer,
      texture,
      mesh,
      canvas: renderer.domElement,
    });
  });
}

function removeUpscale(img) {
  const entry = processed.get(img);
  if (!entry) return;

  entry.renderer.dispose?.();
  entry.texture.dispose?.();
  entry.mesh?.geometry?.dispose();
  entry.canvas.remove();

  processed.delete(img);
}

const observer = new MutationObserver(() => {
  document.querySelectorAll("img[data-upscale]").forEach(upscaleImage);

  document.querySelectorAll("img:not([data-upscale])").forEach((img) => {
    if (processed.has(img)) {
      removeUpscale(img);
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  subtree: true,
  attributeFilter: ["data-upscale"],
});
