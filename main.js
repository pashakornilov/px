// Find the latest version by visiting https://unpkg.com/three, currently it's 0.126.1

import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
export { createPixelArt, clearScene };
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
window.createPixelArt = createPixelArt;
window.clearScene = clearScene;
// После импортов
const textureLoader = new THREE.TextureLoader();

// В начале файла, где объявляются другие глобальные переменные
let scene, camera, renderer, controls;
let pixelArt;
let mainLight, mainLight2, ambientLight, roomLight, ceilingLight;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Обновляем функцию clearScene
function clearScene() {
    // Сохраняем только комнату
    let room;
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BoxGeometry) {
            room = object;
        }
    });
    
    // Полностью очищаем сцену
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    // Возвращаем только комнату
    if (room) {
        scene.add(room);
    }
    
    // Сбрасываем все источники света
    mainLight = null;
    mainLight2 = null;
    ambientLight = null;
    roomLight = null;
    ceilingLight = null;
}

function createCustomGeometry() {
    const geometry = new THREE.BufferGeometry();
    
    // Определяем вершины для призмы со скошенной передней гранью
    const vertices = new Float32Array([
        // Задняя грань
        -0.5, -0.5,  0.0,  // 0
         0.5, -0.5,  0.0,  // 1
         0.5,  0.5,  0.0,  // 2
        -0.5,  0.5,  0.0,  // 3
        // Передняя грань (скошенная)
        -0.5, -0.5,  1.0,  // 4
         0.5, -0.5,  1.0,  // 5
         0.5,  0.5,  0.5,  // 6
        -0.5,  0.5,  0.5   // 7
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    0, 2, 3,    // задняя грань
        4, 5, 6,    4, 6, 7,    // передняя грань
        0, 4, 7,    0, 7, 3,    // левая грань
        1, 5, 6,    1, 6, 2,    // правая грань
        3, 2, 6,    3, 6, 7,    // верхняя грань
        0, 1, 5,    0, 5, 4     // нижняя грань
    ]);

    // Добавляем UV-координаты
    const uvs = new Float32Array([
        // Задняя грань
        0, 0,  1, 0,  1, 1,  0, 1,
        // Передняя грань
        0, 0,  1, 0,  1, 1,  0, 1,
        // Левая грань
        0, 0,  1, 0,  1, 1,  0, 1,
        // Правая грань
        0, 0,  1, 0,  1, 1,  0, 1,
        // Верхняя грань
        0, 0,  1, 0,  1, 1,  0, 1,
        // Нижняя грань
        0, 0,  1, 0,  1, 1,  0, 1
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    return geometry;
}

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        precision: "highp",
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });

    const container = document.getElementById('canvas-container');
    if (container) {
        // Очищаем контейнер перед добавлением нового канваса
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        
        // Update camera aspect ratio based on container dimensions
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    } else {
        console.error('Canvas container not found!');
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
    }
    renderer.setPixelRatio(window.devicePixelRatio); // Важно для четкости
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    


    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    
    // Устанавливаем ограничения зума
    controls.minDistance = 20;
    controls.maxDistance = 120;

    // Создаем комнату
    const roomGeometry = new THREE.BoxGeometry(500, 300, 500); // 5000мм x 3000мм x 5000мм
    const wallsMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xf5f5f5,
        side: THREE.BackSide
    });
    const room = new THREE.Mesh(roomGeometry, wallsMaterial);
    room.position.y = 150; // Половина высоты комнаты (1500мм)
    room.receiveShadow = true;
    scene.add(room);

    // Добавляем освещение комнаты
    roomLight = new THREE.AmbientLight(0xffffff, 0); // Изначально выключен
    scene.add(roomLight);

    ceilingLight = new THREE.PointLight(0xffffff, 0); // Изначально выключен
    ceilingLight.position.set(0, 280, 0);
    scene.add(ceilingLight);

    controls.target.set(0, 150, 0);
    controls.update();

    animate();
}

// В начале файла добавим новые переменные
const colorPalette = [
    "#9C6B30", "#691639", "#887142", "#83639D", "#7B5141", "#8A5A83",
    "#48A43F", "#4C2F26", "#A38995", "#FA842B", "#2F2A5A", "#327662",
    "#35382E", "#6A93B0", "#B9B9A8", "#DFCEA1", "#817F68", "#2E3234",
    "#AB2524", "#B7D9B1", "#FFAB00", "#CBD0CC", "#0E4243", "#C63678",
    "#8F4E35", "#5E2028", "#7E8B92", "#F7BA0B", "#41678D", "#CB8D73",
    "#C89F04", "#1F4764", "#DD7907", "#701F29", "#E1A6AD", "#BE4E20",
    "#F4B752", "#4B4D46", "#AF8A54", "#F0CA00", "#C1121C", "#B42041",
    "#402225", "#0B4151", "#81C0BB", "#9DA3A6", "#2B2C7C", "#673831",
    "#A65E2F", "#384C70", "#5A3A29", "#68825B", "#FFFFFF", "#9C322E",
    "#DB6A50", "#4A203B", "#D3545F", "#282828", "#1A5784", "#79553C",
    "#21888F", "#D7D7D7", "#FDF4E3", "#211F20", "#AC4034", "#3481B8",
    "#992572", "#276235", "#0A0A0A", "#D2B773", "#818979", "#746643",
    "#703731", "#3E753B", "#3F3A3A", "#D9C022", "#0F8558", "#555D61",
    "#1D1F2A"]
    
    // Здесь будет храниться палитра цветов

// Функция для конвертации HEX в LAB
function hexToLab(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // RGB в XYZ
    let r1 = r / 255, g1 = g / 255, b1 = b / 255;
    
    r1 = r1 > 0.04045 ? Math.pow((r1 + 0.055) / 1.055, 2.4) : r1 / 12.92;
    g1 = g1 > 0.04045 ? Math.pow((g1 + 0.055) / 1.055, 2.4) : g1 / 12.92;
    b1 = b1 > 0.04045 ? Math.pow((b1 + 0.055) / 1.055, 2.4) : b1 / 12.92;
    
    r1 *= 100;
    g1 *= 100;
    b1 *= 100;
    
    const x = r1 * 0.4124 + g1 * 0.3576 + b1 * 0.1805;
    const y = r1 * 0.2126 + g1 * 0.7152 + b1 * 0.0722;
    const z = r1 * 0.0193 + g1 * 0.1192 + b1 * 0.9505;
    
    // XYZ в Lab
    const refX = 95.047, refY = 100.000, refZ = 108.883;
    let x1 = x / refX, y1 = y / refY, z1 = z / refZ;
    
    x1 = x1 > 0.008856 ? Math.pow(x1, 1/3) : (7.787 * x1) + 16/116;
    y1 = y1 > 0.008856 ? Math.pow(y1, 1/3) : (7.787 * y1) + 16/116;
    z1 = z1 > 0.008856 ? Math.pow(z1, 1/3) : (7.787 * z1) + 16/116;
    
    return {
        l: (116 * y1) - 16,
        a: 500 * (x1 - y1),
        b: 200 * (y1 - z1)
    };
}

// Функция для расчета CIEDE2000
function CIEDE2000(lab1, lab2) {
    const kL = 1, kC = 1, kH = 1;
    
    const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
    const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
    const Cavg = (C1 + C2) / 2;
    
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cavg, 7) / (Math.pow(Cavg, 7) + Math.pow(25, 7))));
    
    const a1p = (1 + G) * lab1.a;
    const a2p = (1 + G) * lab2.a;
    
    const C1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b);
    const C2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b);
    
    const h1p = Math.atan2(lab1.b, a1p) + 2 * Math.PI * (Math.atan2(lab1.b, a1p) < 0 ? 1 : 0);
    const h2p = Math.atan2(lab2.b, a2p) + 2 * Math.PI * (Math.atan2(lab2.b, a2p) < 0 ? 1 : 0);
    
    const dL = lab2.l - lab1.l;
    const dC = C2p - C1p;
    
    let dhp = 0;
    if (C1p * C2p !== 0) {
        if (Math.abs(h2p - h1p) <= Math.PI) dhp = h2p - h1p;
        else if (h2p - h1p > Math.PI) dhp = h2p - h1p - 2 * Math.PI;
        else if (h2p - h1p < -Math.PI) dhp = h2p - h1p + 2 * Math.PI;
    }
    
    const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2);
    
    const Lp = (lab1.l + lab2.l) / 2;
    const Cp = (C1p + C2p) / 2;
    
    let hp = 0;
    if (C1p * C2p !== 0) {
        if (Math.abs(h1p - h2p) <= Math.PI) hp = (h1p + h2p) / 2;
        else if (Math.abs(h1p - h2p) > Math.PI && h1p + h2p < 2 * Math.PI) hp = (h1p + h2p + 2 * Math.PI) / 2;
        else if (Math.abs(h1p - h2p) > Math.PI && h1p + h2p >= 2 * Math.PI) hp = (h1p + h2p - 2 * Math.PI) / 2;
    }
    
    const T = 1 - 0.17 * Math.cos(hp - Math.PI/6) + 0.24 * Math.cos(2*hp) + 0.32 * Math.cos(3*hp + Math.PI/30) - 0.20 * Math.cos(4*hp - 21*Math.PI/60);
    
    const SL = 1 + (0.015 * Math.pow(Lp - 50, 2)) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
    const SC = 1 + 0.045 * Cp;
    const SH = 1 + 0.015 * Cp * T;
    
    const RT = -2 * Math.sqrt(Math.pow(Cp, 7)/(Math.pow(Cp, 7) + Math.pow(25, 7))) * Math.sin(Math.PI/3 * Math.exp(-Math.pow((hp - 275*Math.PI/180)/25, 2)));
    
    return Math.sqrt(
        Math.pow(dL/(kL*SL), 2) +
        Math.pow(dC/(kC*SC), 2) +
        Math.pow(dH/(kH*SH), 2) +
        RT * (dC/(kC*SC)) * (dH/(kH*SH))
    );
}

// Функция для нахождения ближайшего цвета из палитры
function findClosestColor(targetColor) {
    let minDelta = Infinity;
    let closestColor = null;
    const targetLab = hexToLab(targetColor);

    for (const paletteColor of colorPalette) {
        const paletteLab = hexToLab(paletteColor);
        const delta = CIEDE2000(targetLab, paletteLab);
        
        if (delta < minDelta) {
            minDelta = delta;
            closestColor = paletteColor;
        }
    }
    
    return closestColor;
}



function createPixelArt(imageElement, gridSize, container = null) {
    if (pixelArt) {
        scene.remove(pixelArt);
    }
// Если renderer уже существует, удаляем его canvas из DOM
if (renderer && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement);
}
    // Создаем новую группу для пиксель-арта
    pixelArt = new THREE.Group();

      // Полусферическое освещение для более реалистичного ambient light
      const hemiLight = new THREE.HemisphereLight(
        0xffffff, // цвет неба
        0x444444, // цвет земли
        0.4 // интенсивность
    );
    hemiLight.position.set(0, 300, 0);
    scene.add(hemiLight);

    // После настройки renderer, добавляем canvas в контейнер или body
    if (container && typeof container === 'string') {
        container = document.getElementById(container);
    }
    
    if (container instanceof HTMLElement) {
        // Очищаем контейнер перед добавлением нового канваса
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Добавляем канвас в контейнер
        container.appendChild(renderer.domElement);
        
        // Обновляем размер рендерера в соответствии с размером контейнера
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    } else {
        // Если контейнер не указан или не найден, добавляем в body (для обратной совместимости)
        //document.body.appendChild(renderer.domElement);
    }

    // Мягкий ambient light для заполнения теней
    ambientLight = new THREE.AmbientLight(0xffe5cc, 0.4);
    scene.add(ambientLight);

    // Точечный свет для акцентов
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-100, 200, -100);
    scene.add(pointLight);

// Основной направленный свет
mainLight = new THREE.DirectionalLight(0xffd7b3, 1.2);
mainLight.position.set(100, 200, 100);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 4096;
mainLight.shadow.mapSize.height = 4096;
mainLight.shadow.normalBias = 0.02;     // Важно для четких граней
mainLight.shadow.bias = -0.0001;        // Тонкая настройка теней
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 1000;
mainLight.shadow.camera.left = -250;
mainLight.shadow.camera.right = 250;
mainLight.shadow.camera.top = 250;
mainLight.shadow.camera.bottom = -250;
mainLight.shadow.normalBias = 0.01;
scene.add(mainLight);


// Второй основной направленный свет
mainLight2 = new THREE.DirectionalLight(0xffe0cc, 0.8);
mainLight2.position.set(-100, 200, 100);
mainLight2.castShadow = true;
mainLight2.shadow.mapSize.width = 4096;
mainLight2.shadow.mapSize.height = 4096;
mainLight2.shadow.normalBias = 0.02;
mainLight2.shadow.bias = -0.0001;
mainLight2.shadow.camera.near = 0.5;
mainLight2.shadow.camera.far = 1000;
mainLight2.shadow.camera.left = -250;
mainLight2.shadow.camera.right = 250;
mainLight2.shadow.camera.top = 250;
mainLight2.shadow.camera.bottom = -250;
scene.add(mainLight2);

// Обработчики для второго основного света
document.getElementById('mainLight2Toggle').addEventListener('change', (e) => {
    if (mainLight2) {
        mainLight2.visible = e.target.checked;
    }
});

document.getElementById('mainLight2Intensity').addEventListener('input', (e) => {
    if (mainLight2) {
        const value = parseFloat(e.target.value);
        mainLight2.intensity = value;
        document.getElementById('mainLight2Value').textContent = value.toFixed(1);
    }
});

// Удаляем создание roomLight и ceilingLight отсюда, так как они уже созданы в init3D
// Оставляем только обработчики событий
// Обработчики для комнатного света
document.getElementById('roomLightToggle').addEventListener('change', (e) => {
    roomLight.visible = e.target.checked;
});

document.getElementById('roomLightIntensity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    roomLight.intensity = value;
    document.getElementById('roomLightValue').textContent = value.toFixed(1);
});

// Обработчики для потолочного света
document.getElementById('ceilingLightToggle').addEventListener('change', (e) => {
    ceilingLight.visible = e.target.checked;
});

document.getElementById('ceilingLightIntensity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    ceilingLight.intensity = value;
    document.getElementById('ceilingLightValue').textContent = value.toFixed(1);
});

// Обработчики для основного света
document.getElementById('mainLightToggle').addEventListener('change', (e) => {
    mainLight.visible = e.target.checked;
});

document.getElementById('mainLightIntensity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    mainLight.intensity = value;
    document.getElementById('mainLightValue').textContent = value.toFixed(1);
});

// Обработчики для фонового света
document.getElementById('ambientLightToggle').addEventListener('change', (e) => {
    ambientLight.visible = e.target.checked;
});

document.getElementById('ambientLightIntensity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    ambientLight.intensity = value;
    document.getElementById('ambientLightValue').textContent = value.toFixed(1);
});

// Пересоздаем комнату
const roomGeometry = new THREE.BoxGeometry(500, 300, 500);
const wallsMaterial = new THREE.MeshPhongMaterial({ 
    color: '#929cb0',
    side: THREE.BackSide
});
const room = new THREE.Mesh(roomGeometry, wallsMaterial);
room.position.y = 150;
room.receiveShadow = true;
scene.add(room);


// Добавляем освещение комнаты (изначально выключено)
roomLight = new THREE.AmbientLight(0xffffff, 0);
scene.add(roomLight);

// Добавляем потолочный свет (изначально выключен)
ceilingLight = new THREE.PointLight(0xffffff, 0);
ceilingLight.position.set(0, 280, 0);
scene.add(ceilingLight);


// Создаем новую группу для пиксель-арта
pixelArt = new THREE.Group();
    
    if (pixelArt) {
        scene.remove(pixelArt);
    }

    pixelArt = new THREE.Group();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Получаем оригинальные размеры изображения
const imgWidth = imageElement.naturalWidth;
const imgHeight = imageElement.naturalHeight;

    // Сохраняем пропорции изображения
const aspectRatio = imgWidth / imgHeight;
let canvasWidth = gridSize;
let canvasHeight = gridSize;
    // Корректируем размеры canvas в зависимости от пропорций изображения
if (aspectRatio > 1) {
    // Для широких изображений
    canvasHeight = Math.floor(gridSize / aspectRatio);
} else {
    // Для высоких изображений
    canvasWidth = Math.floor(gridSize * aspectRatio);
}
    canvas.width = canvasWidth;
canvas.height = canvasHeight;
    // Отрисовываем изображение с сохранением пропорций
ctx.drawImage(imageElement, 0, 0, canvasWidth, canvasHeight);

const pixels = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
    const geometry = createCustomGeometry();
    
    // Создаем массив для хранения предыдущих поворотов
    let prevRotations = new Array(gridSize).fill(-1);
    
    const cubeSize = 2.7;
    
    // Обновляем размеры сетки для кубиков
const actualGridSizeX = canvasWidth;
const actualGridSizeY = canvasHeight;
    
    for (let y = 0; y < actualGridSizeY; y++) {
        let lastRotation = -1;
        
        for (let x = 0; x < actualGridSizeX; x++) {
            const i = (y * actualGridSizeX + x) * 4;  // Используем actualGridSizeX вместо gridSize
            const pixelColor = new THREE.Color(
                pixels[i] / 255,
                pixels[i + 1] / 255,
                pixels[i + 2] / 255
            );

        // Преобразуем RGB в HEX формат
        const hexColor = '#' + 
            ((1 << 24) + (pixels[i] << 16) + (pixels[i + 1] << 8) + pixels[i + 2])
            .toString(16).slice(1);
        
        // Используем findClosestColor для поиска ближайшего цвета из палитры
        const finalColor = colorPalette.length > 0 ? 
            findClosestColor(hexColor) : 
            hexColor;
        
      // Увеличиваем насыщенность цвета перед созданием материала
      const color = new THREE.Color(finalColor);
      const hsl = {};
      color.getHSL(hsl);
      color.setHSL(hsl.h, hsl.s * 1.2, hsl.l); // Увеличиваем насыщенность на 20%


      
      // Create material with random texture
      const material = new THREE.MeshStandardMaterial({ 
          color: color,
                map: textureArray[Math.floor(Math.random() * textureArray.length)],
                side: THREE.DoubleSide,
                shadowSide: THREE.BackSide,
                roughness: 1,
    metalness: 0.0,
    flatShading: true,     // Отключаем плоское затенение
    envMapIntensity: 0.2,
    emissiveIntensity: 0,
    dithering: true,        // Включаем дизеринг
    precision: "highp"      // Высокая точность
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true;
            cube.receiveShadow = true;
            
            // Обновляем позиционирование с учетом нового размера
            cube.position.x = (x - actualGridSizeX/2) * (cubeSize * (1));
            cube.position.y = (actualGridSizeY/2 - y) * (cubeSize * (1));
            cube.position.z = 0;
            
            // Применяем масштаб к кубику
            cube.scale.set(cubeSize, cubeSize, cubeSize);
            
            // Получаем список доступных поворотов (0, 90, 180, 270 градусов)
            let possibleRotations = [0, Math.PI/2, Math.PI, Math.PI*3/2];
            
            // Удаляем поворот, который использовался в кубике слева
            if (lastRotation !== -1) {
                possibleRotations = possibleRotations.filter(r => r !== lastRotation);
            }
            
            // Удаляем поворот, который использовался в кубике сверху
            if (prevRotations[x] !== -1) {
                possibleRotations = possibleRotations.filter(r => r !== prevRotations[x]);
            }
            
            // Выбираем случайный поворот из оставшихся
            const rotation = possibleRotations[Math.floor(Math.random() * possibleRotations.length)];
            
            // Сохраняем текущий поворот для следующих итераций
            lastRotation = rotation;
            prevRotations[x] = rotation;
            
            cube.rotation.z = rotation;
            
            pixelArt.add(cube);
        }
    }
    
         // Вычисляем размеры и позицию картины
         const artWidth = actualGridSizeX * (cubeSize * (1));
         const artHeight = actualGridSizeY * (cubeSize * (1));
    const centerY = 150;
    
    // Размещаем пиксель-арт на стене по центру
    pixelArt.position.z = -249;
    pixelArt.position.y = centerY;
    pixelArt.position.x = 0;
    
    // Рассчитываем оптимальное расстояние для камеры
    //const aspectRatio = window.innerWidth / window.innerHeight;
    const fov = camera.fov * (Math.PI / 180);
    const baseDistance = Math.max(artWidth, artHeight / aspectRatio) / (2 * Math.tan(fov / 2));
    const targetViewSize = (gridSize + 100) * (cubeSize); // Желаемый размер вида для базового размера сетки (32)
    console.log(gridSize)
    const scaleFactor = artWidth / targetViewSize; // Коэффициент масштабирования на основе текущего размера
    let distance = baseDistance * 2 * scaleFactor;
    distance = Math.max(controls.minDistance, Math.min(distance, controls.maxDistance));

    // Настраиваем камеру для вида на центр картины
    camera.position.set(0, centerY, -distance);
    camera.lookAt(0, centerY, -245);
    controls.target.set(0, centerY, -245);

    
    controls.update();
    
    // После создания pixelArt группы и перед добавлением в сцену
    // Создаем плоскость для теней позади картины
    const shadowPlaneGeometry = new THREE.PlaneGeometry(500, 300);
    const shadowPlaneMaterial = new THREE.MeshPhongMaterial({
        color: '#929cb0',
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.05
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeometry, shadowPlaneMaterial);
    shadowPlane.position.z = -249.5; // Чуть дальше, чем картина (-245)
    shadowPlane.position.y = 150;  // На той же высоте
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Делаем всю группу pixelArt источником тени
    pixelArt.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.castShadow = true;
        }
    });

    scene.add(pixelArt);
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded');
    init3D();
    
    try {
        await loadTextures();
        console.log('Textures loaded successfully');
    } catch (error) {
        console.error('Error loading textures:', error);
    }
    
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    
    console.log('Elements found:', {
        imageInput: !!imageInput,
        imagePreview: !!imagePreview
    });
    
    if (!imageInput || !imagePreview) {
        console.error('Required elements not found!');
        return;
    }
    
    // Set initial preview styles
    imagePreview.style.maxWidth = '300px';
    imagePreview.style.border = '2px solid red'; // Temporary border to make it visible
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file);
        
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        console.log('Created URL:', url);
        
        imagePreview.onload = () => {
            console.log('Image loaded successfully');
            URL.revokeObjectURL(url);
            
            // Автоматически конвертируем в 3D после загрузки изображения
            const gridSize = parseInt(gridSizeInput.value) || 32;
            console.log('Converting to 3D with grid size:', gridSize);
            clearScene(); 
            
            // Получаем контейнер и передаем его в createPixelArt
            const container = document.getElementById('canvas-container');
            createPixelArt(imagePreview, gridSize, container);
        };
        
        imagePreview.src = url;
        imagePreview.style.display = 'block';
    });
    
    const convert3DButton = document.getElementById('convert3DButton');
    const gridSizeInput = document.getElementById('gridSize');
    
    convert3DButton.addEventListener('click', () => {
        const gridSize = parseInt(gridSizeInput.value) || 32;
        if (imagePreview.src) {
            console.log('Converting to 3D with grid size:', gridSize);
            clearScene(); 
            
            // Получаем контейнер и передаем его в createPixelArt
            const container = document.getElementById('canvas-container');
            createPixelArt(imagePreview, gridSize, container);
        } else {
            alert('Please select an image first');
        }
    });

    // Добавляем обработчик изменения размера сетки
gridSizeInput.addEventListener('change', () => {
    if (imagePreview.src) {
        const gridSize = parseInt(gridSizeInput.value) || 32;
        console.log('Updating 3D model with new grid size:', gridSize);
        clearScene();
        
        const container = document.getElementById('canvas-container');
        createPixelArt(imagePreview, gridSize, container);
    }
});
    
    // Добавляем обработчики для контролов освещения
    const mainLightIntensity = document.getElementById('mainLightIntensity');
    const ambientLightIntensity = document.getElementById('ambientLightIntensity');
    const shadowDarkness = document.getElementById('shadowDarkness');

    mainLightIntensity.addEventListener('input', (e) => {
        if (mainLight) {
            mainLight.intensity = parseFloat(e.target.value);
        }
    });

    ambientLightIntensity.addEventListener('input', (e) => {
        if (ambientLight) {
            ambientLight.intensity = parseFloat(e.target.value);
        }
    });

    // Находим обработчик shadowDarkness и заменяем его на:
    shadowDarkness.addEventListener('input', (e) => {
    if (mainLight) {
        const value = parseFloat(e.target.value);
        // Настраиваем интенсивность теней через bias и radius
        mainLight.shadow.bias = -0.0005 * value;
        mainLight.shadow.radius = 4 * value;
        // Настраиваем интенсивность света
        mainLight.intensity = 1.2 * (1 - value * 0.5);
    }
});


const light2PosX = document.getElementById('light2PosX');
const light2PosY = document.getElementById('light2PosY');
const light2PosZ = document.getElementById('light2PosZ');

const light2PosXValue = document.getElementById('light2PosXValue');
const light2PosYValue = document.getElementById('light2PosYValue');
const light2PosZValue = document.getElementById('light2PosZValue');

function updateLight2Position() {
    if (mainLight2) {
        const currentGridSize = parseInt(gridSizeInput.value) || 32;
        const x = parseFloat(light2PosX.value) * currentGridSize;
        const y = parseFloat(light2PosY.value) * currentGridSize;
        const z = parseFloat(light2PosZ.value) * currentGridSize;
        
        mainLight2.position.set(x, y, z);
        
        light2PosXValue.textContent = light2PosX.value;
        light2PosYValue.textContent = light2PosY.value;
        light2PosZValue.textContent = light2PosZ.value;
    }
}

light2PosX.addEventListener('input', updateLight2Position);
light2PosY.addEventListener('input', updateLight2Position);
light2PosZ.addEventListener('input', updateLight2Position);
    
    // Добавляем обработчики для позиции света
    const lightPosX = document.getElementById('lightPosX');
    const lightPosY = document.getElementById('lightPosY');
    const lightPosZ = document.getElementById('lightPosZ');
    
    const lightPosXValue = document.getElementById('lightPosXValue');
    const lightPosYValue = document.getElementById('lightPosYValue');
    const lightPosZValue = document.getElementById('lightPosZValue');

    function updateLightPosition() {
        if (mainLight) {
            const currentGridSize = parseInt(gridSizeInput.value) || 32;
            const x = parseFloat(lightPosX.value) * currentGridSize;
            const y = parseFloat(lightPosY.value) * currentGridSize;
            const z = parseFloat(lightPosZ.value) * currentGridSize;
            
            mainLight.position.set(x, y, z);
            
            // Обновляем отображаемые значения
            lightPosXValue.textContent = lightPosX.value;
            lightPosYValue.textContent = lightPosY.value;
            lightPosZValue.textContent = lightPosZ.value;
        }
    }

    lightPosX.addEventListener('input', updateLightPosition);
    lightPosY.addEventListener('input', updateLightPosition);
    lightPosZ.addEventListener('input', updateLightPosition);

    
    

    
    });

// После объявления глобальных переменных
let textureArray = [];

function getTextureFiles() {
    return [
        //'./textures/concrete.jpg',
        // './textures/concrete2.jpg',
        // './textures/concrete3.jpg',
        './textures/2.png',

        // Add more textures here
    ];
}

// Update the loadTextures function
function loadTextures() {
    return new Promise((resolve, reject) => {
        const textureFiles = getTextureFiles();
        const texturePromises = textureFiles.map(file => {
            return new Promise((resolveTexture, rejectTexture) => {
                const texture = textureLoader.load(
                    file,
                    (texture) => {
                        console.log(`Texture loaded successfully: ${file}`);
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(1, 1);
                        texture.encoding = THREE.sRGBEncoding;
                        resolveTexture(texture);
                    },
                    undefined,
                    (err) => {
                        console.error(`Error loading texture ${file}:`, err);
                        rejectTexture(err);
                    }
                );
                textureArray.push(texture);
            });
        });

        Promise.all(texturePromises)
            .then(() => {
                console.log('All textures loaded successfully');
                resolve(textureArray);
            })
            .catch(reject);
    });
}

// Update the material creation in createPixelArt
// Inside the pixel creation loop, update the material creation:
